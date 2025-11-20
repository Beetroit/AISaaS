import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from backend.app.config import logger
from backend.app.crud.agent_crud import AgentCRUD
from backend.app.crud.chat_session_crud import ChatSessionCRUD
from backend.app.crud.lead_crud import LeadCRUD
from backend.app.crud.message_crud import MessageCRUD
from backend.app.crud.workflow_crud import WorkflowCRUD
from backend.app.crud.workflow_run_crud import WorkflowRunCRUD
from backend.app.models.agent import Agent
from backend.app.models.chat_session import ChatSession
from backend.app.models.workflow_run import WorkflowRun
from backend.app.schemas.lead import LeadCreate, LeadUpdate
from backend.app.schemas.message import MessageCreate
from backend.app.schemas.workflow import LeadExtractionConfig
from backend.app.services.ai_service import AIService
from backend.app.services.credential_service import CredentialService
from backend.app.services.messaging_service import MessagingService
from backend.app.services.retrieval_service import RetrievalService
from backend.app.services.workflow_actions.factory import ActionFactory


class AgentWorkflowService:
    def __init__(
        self,
        agent_crud: AgentCRUD,
        lead_crud: LeadCRUD,
        chat_session_crud: ChatSessionCRUD,
        message_crud: MessageCRUD,
        workflow_crud: WorkflowCRUD,
        workflow_run_crud: WorkflowRunCRUD,
        ai_service: AIService,
        credential_service: CredentialService,
        messaging_service: MessagingService,
        retrieval_service: RetrievalService,
    ):
        self.agent_crud = agent_crud
        self.lead_crud = lead_crud
        self.chat_session_crud = chat_session_crud
        self.message_crud = message_crud
        self.workflow_crud = workflow_crud
        self.workflow_run_crud = workflow_run_crud
        self.ai_service = ai_service
        self.credential_service = credential_service
        self.messaging_service = messaging_service
        self.retrieval_service = retrieval_service
        self.action_factory = ActionFactory()

    async def execute_workflow(
        self, workflow_run_id: str, user_message: str, send_response: bool = True
    ) -> str:
        # First, retrieve the workflow run by its ID
        workflow_run = await self.workflow_run_crud.get_workflow_run(workflow_run_id)
        if not workflow_run:
            logger.error("WorkflowRun with ID %s not found.", workflow_run_id)
            return "Error: Workflow run not found."

        user_id = workflow_run.user_id

        agent = await self.lead_crud.session.get(Agent, workflow_run.agent_id)
        workflow = await self.workflow_crud.get_workflow(
            workflow_run.workflow_id, user_id=user_id
        )
        chat_session = (
            await self.chat_session_crud.get_chat_session(workflow_run.chat_session_id)
            if workflow_run.chat_session_id
            else None
        )

        if not agent or not workflow or not chat_session:
            logger.error(
                "Missing agent, workflow, or chat session for WorkflowRun %s.",
                workflow_run_id,
            )
            return "Error: Required data for workflow execution is missing."

        nodes = {node["id"]: node for node in workflow.workflow_schema.get("nodes", [])}
        edges = workflow.workflow_schema.get("edges", [])
        knowledge_base_document_ids = workflow.knowledge_base_document_ids

        # Determine current node
        current_node_id = chat_session.current_workflow_step or self._find_start_node(
            nodes
        )
        if not current_node_id:
            return "Error: Workflow has no start node."

        # Initialize context
        workflow_context = {"user_message": user_message}
        response = ""

        # Initialize lead collection state if needed
        if chat_session.lead_collection_state is None:
            chat_session.lead_collection_state = {"collected_data": {}}

        try:
            # We process the workflow.
            # For conversational nodes (Lead Extraction, Product QA), we process once and return response.
            # If a transition happens (END tag), we move to the next node.
            # If the NEXT node is also conversational, we STOP and wait for the next user input
            # (unless we want to generate a greeting, but for now we stick to 1 turn = 1 response).
            # If the NEXT node is automatic (Start, End, Logic), we continue looping.

            steps_processed = 0
            max_steps = 10  # Prevent infinite loops for automatic nodes

            while current_node_id and steps_processed < max_steps:
                steps_processed += 1
                current_node = nodes.get(current_node_id)
                if not current_node:
                    raise ValueError(f"Node {current_node_id} not found.")

                node_type = self._get_node_type(current_node)
                logger.info(f"Processing node: {current_node_id} ({node_type})")

                # --- AI Conversational Nodes ---
                if node_type in ["lead_extraction", "product_qa"]:
                    # Process the AI node
                    ai_response_text, should_transition = await self._process_ai_node(
                        user_message=user_message,
                        node=current_node,
                        chat_session=chat_session,
                        knowledge_base_document_ids=knowledge_base_document_ids,
                        agent=agent,
                    )

                    response = ai_response_text

                    if should_transition:
                        # Move to next node
                        logger.info(f"Node {current_node_id} signaled transition.")
                        next_node_id = self._find_next_node(current_node_id, edges)
                        chat_session.current_workflow_step = next_node_id
                        current_node_id = next_node_id

                        # If we transitioned, we persist the state change
                        await self.chat_session_crud.session.flush()

                        # If we transitioned, do we continue loop?
                        # If next node is conversational, we should probably stop and let the user reply to the "response"
                        # which was the "Goodbye/Transition" message from the previous node.
                        # So we break.
                        # Exception: If the response was empty (unlikely), maybe we want the next node to speak?
                        # For now, assume 1 turn = 1 response.
                        break
                    else:
                        # Stay on this node
                        chat_session.current_workflow_step = current_node_id
                        await self.chat_session_crud.session.flush()
                        break  # Done for this turn

                # --- Legacy / Automatic Nodes ---
                else:
                    # Handle Start, End, Custom Actions
                    action_class = self.action_factory.get_action(node_type)
                    action_instance = action_class()

                    # Execute action
                    action_result = await action_instance.execute(
                        context=workflow_context,
                        node_data=current_node.get("data", {}),
                        knowledge_base_document_ids=knowledge_base_document_ids,
                    )
                    workflow_context.update(action_result)

                    # Move to next node
                    next_node_id = self._find_next_node(current_node_id, edges)
                    chat_session.current_workflow_step = next_node_id
                    current_node_id = next_node_id

                    if not current_node_id:
                        # End of workflow
                        workflow_run.status = "completed"
                        workflow_run.end_time = datetime.now(timezone.utc)
                        await self.workflow_run_crud.session.flush()
                        break

            if not response:
                response = "..."  # Should not happen for conversational nodes

            await self._handle_response_and_credits(
                agent, chat_session, workflow_run, response, send_response
            )
            return response

        except Exception as e:
            logger.error("Error executing workflow run %s: %s", workflow_run_id, e)
            workflow_run.status = "failed"
            await self.workflow_run_crud.session.flush()
            return "Error: An unexpected error occurred."

    async def _process_ai_node(
        self,
        user_message: str,
        node: Dict[str, Any],
        chat_session: ChatSession,
        knowledge_base_document_ids: Optional[list[str]],
        agent: Agent,
    ) -> tuple[str, bool]:
        """
        Generic handler for AI nodes.
        Returns: (response_text, should_transition)
        """
        from backend.app.prompts.workflow_prompts import (
            GENERAL_SYSTEM_PROMPT,
            LEAD_EXTRACTION_PROMPT,
            PRODUCT_QA_PROMPT,
        )

        node_type = self._get_node_type(node)
        node_name = node.get("data", {}).get("label") or node.get("name") or node_type

        system_prompt = GENERAL_SYSTEM_PROMPT
        user_prompt = f"User Message: {user_message}\n"

        # --- 1. Construct Prompt based on Node Type ---
        if node_type == "lead_extraction":
            lead_config = LeadExtractionConfig(**node.get("data", {}))

            # Format fields description
            fields_desc = "\n".join(
                [
                    f"- {f.name}: {f.description} (Required: {f.required})"
                    for f in lead_config.fields
                ]
            )

            # Get current state
            current_data = chat_session.lead_collection_state.get("collected_data", {})
            context_str = json.dumps(current_data, indent=2)

            node_prompt = LEAD_EXTRACTION_PROMPT.format(
                fields_description=fields_desc, context=context_str, node_name=node_name
            )
            system_prompt += "\n" + node_prompt

        elif node_type == "product_qa":
            # Retrieve context
            context_text = ""
            if knowledge_base_document_ids:
                chunks = await self.retrieval_service.retrieve_relevant_chunks(
                    query=user_message,
                    user_id="system",
                    document_ids=knowledge_base_document_ids,
                )
                context_text = "\n".join([c.document for c in chunks])

            node_prompt = PRODUCT_QA_PROMPT.format(
                kb_context=context_text, node_name=node_name
            )
            system_prompt += "\n" + node_prompt

        # --- 2. AI Generation Loop (Validation Gate) ---
        max_retries = 3
        attempt = 0
        last_error = ""

        while attempt < max_retries:
            attempt += 1

            if last_error:
                user_prompt += (
                    f"\n\nSYSTEM ERROR: {last_error}\nPlease correct your response."
                )

            # Call AI
            ai_raw_response = await self.ai_service.generate_response(
                prompt=user_prompt, system_prompt=system_prompt
            )

            # --- 3. Parse Response ---
            # Extract JSON
            extracted_json = {}
            clean_response = ai_raw_response

            if "```json" in ai_raw_response:
                try:
                    json_str = (
                        ai_raw_response.split("```json")[1].split("```")[0].strip()
                    )
                    extracted_json = json.loads(json_str)
                    # Remove JSON from response text to show user
                    # Regex or split might be safer, but for now simple replace
                    # (Assuming JSON block is at the end or beginning)
                    # Actually, we want to strip the JSON block from the text we send to the user.
                    clean_response = ai_raw_response.replace(
                        f"```json\n{json_str}\n```", ""
                    ).strip()
                    clean_response = clean_response.replace(
                        f"```json{json_str}```", ""
                    ).strip()
                except Exception as e:
                    logger.warning(f"Failed to parse JSON: {e}")

            # Extract END tag
            should_transition = False
            end_tag = f"END {node_name}"
            if end_tag in clean_response:
                should_transition = True
                clean_response = clean_response.replace(end_tag, "").strip()

            # --- 4. Update State (Lead Extraction) ---
            if node_type == "lead_extraction" and extracted_json:
                # Update collected data
                collected_data = chat_session.lead_collection_state.get(
                    "collected_data", {}
                )
                for k, v in extracted_json.items():
                    # We assume AI extracts valid values.
                    # For stricter validation, we could check regex/types here.
                    collected_data[k] = {
                        "value": v,
                        "validated": True,
                    }  # AI implies validation by extracting it

                chat_session.lead_collection_state["collected_data"] = collected_data
                # Persist immediately so we don't lose data if we error later
                self.chat_session_crud.session.add(chat_session)
                await self.chat_session_crud.session.flush()

            # --- 5. Validation Gate ---
            if should_transition:
                if node_type == "lead_extraction":
                    # Check required fields
                    lead_config = LeadExtractionConfig(**node.get("data", {}))
                    collected_data = chat_session.lead_collection_state.get(
                        "collected_data", {}
                    )
                    missing = []
                    for field in lead_config.fields:
                        if field.required:
                            field_data = collected_data.get(field.name, {})
                            if not field_data.get("value"):
                                missing.append(field.name)

                    if missing:
                        # Validation Failed
                        last_error = f"You cannot end the {node_name} phase yet. Missing required fields: {', '.join(missing)}. Please ask the user for this information."
                        logger.info(f"Validation failed: {last_error}")
                        continue  # Retry loop

                    # Validation Passed
                    # Persist Lead
                    await self._persist_lead(chat_session, collected_data)

                elif node_type == "product_qa":
                    # No strict validation for QA
                    pass

            # If we got here, we are good (either no transition, or transition valid)
            return clean_response, should_transition

        # If retries exhausted
        return "I'm having trouble processing that. Could you please repeat?", False

    async def _persist_lead(self, chat_session: ChatSession, collected_data: Dict):
        """Helper to save lead data to DB"""
        final_data = {
            k: v["value"] for k, v in collected_data.items() if v.get("value")
        }
        existing_lead = await self.lead_crud.get_lead_by_chat_session_id(
            chat_session.id
        )

        if existing_lead:
            await self.lead_crud.update_lead(
                existing_lead.id, LeadUpdate(contact_info=final_data)
            )
        else:
            await self.lead_crud.create_lead(
                LeadCreate(contact_info=final_data),
                user_id=chat_session.user_id,
                agent_id=chat_session.agent_id,
                chat_session_id=chat_session.id,
            )

    def _check_node_completion(
        self,
        workflow_context: dict[str, Any],
        completion_requirements: dict[str, Any],
    ) -> Optional[str]:
        missing_fields = []
        for field, details in completion_requirements.items():
            # Check if the field exists in the context and is not empty
            if not workflow_context.get(field):
                missing_fields.append(details.get("desc", field))
            # Optionally, add more complex validation here based on 'validated: bool' or other rules
            # For now, just checking for presence and non-emptiness

        if missing_fields:
            return f"I need more information to proceed. Please provide the following: {', '.join(missing_fields)}."
        return None

    def _get_node_type(self, node: dict[str, Any]) -> str:
        """
        Helper to extract the node type, handling both direct 'type'
        and 'custom' type with 'data.type' (frontend structure).
        """
        node_type = node.get("type")
        if node_type == "custom":
            return node.get("data", {}).get("type", "unknown")
        return node_type or "unknown"

    def _find_start_node(self, nodes: dict[str, Any]) -> Optional[str]:
        for node_id, node in nodes.items():
            if self._get_node_type(node) == "start":
                return node_id
        return None

    def _find_next_node(
        self,
        current_node_id: str,
        edges: list[dict[str, Any]],
    ) -> Optional[str]:
        for edge in edges:
            if edge.get("source") == current_node_id:
                return edge.get("target")
        return None

    async def _handle_response_and_credits(
        self,
        agent: Agent,
        chat_session: ChatSession,
        workflow_run: WorkflowRun,
        response: str,
        send_response: bool = True,
    ):
        credits_decremented = await self._decrement_message_credits(agent)
        if not credits_decremented:
            final_response = "I'm sorry, but this agent has run out of message credits. Please top up to continue."
        else:
            final_response = response.strip()

        await self.message_crud.create_message(
            MessageCreate(
                chat_session_id=chat_session.id,
                role="agent",
                content=final_response,
            )
        )

        if send_response:
            if workflow_run.credential_id:
                credential_model = await self.credential_service.get_credential_by_id(
                    workflow_run.credential_id
                )
                if credential_model:
                    decrypted_creds = (
                        await self.credential_service.get_decrypted_credential_data(
                            credential_model
                        )
                    )
                    if decrypted_creds:
                        await self.messaging_service.send_message(
                            to=chat_session.external_id,
                            body=final_response,
                            credential_model=credential_model,
                        )
                    else:
                        logger.warning(
                            "Could not decrypt credentials for Credential ID %s for WorkflowRun %s. Cannot send message.",
                            workflow_run.credential_id,
                            workflow_run.id,
                        )
                else:
                    logger.warning(
                        "Credential with ID %s not found for WorkflowRun %s. Cannot send message.",
                        workflow_run.credential_id,
                        workflow_run.id,
                    )
            else:
                logger.warning(
                    "No credential_id specified for WorkflowRun %s. Cannot send message.",
                    workflow_run.id,
                )

    async def _decrement_message_credits(self, agent: Agent, amount: int = 1) -> bool:
        if agent.message_credits >= amount:
            agent.message_credits -= amount
            self.workflow_run_crud.session.add(agent)
            await self.workflow_run_crud.session.flush()
            return True
        else:
            logger.info("Agent %s has insufficient credits.", agent.id)
            return False

    async def _answer_product_question(
        self,
        user_message: str,
        knowledge_base_document_ids: Optional[list[str]],
    ) -> str:
        # This method is deprecated but kept for reference if needed,
        # though the new logic handles it in _process_ai_node.
        # We can safely remove it or leave it as dead code for now.
        pass

    async def associate_workflow_with_agent(
        self,
        agent_id: str,
        workflow_id: str,
        user_id: str,
    ) -> bool:
        return await self.agent_crud.associate_workflow_with_agent(
            agent_id, workflow_id, user_id
        )

    async def remove_workflow_from_agent(
        self,
        agent_id: str,
        workflow_id: str,
        user_id: str,
    ) -> bool:
        return await self.agent_crud.remove_workflow_from_agent(
            agent_id, workflow_id, user_id
        )

    async def get_workflow_runs(
        self,
        user_id: str,
        agent_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ):
        return await self.workflow_run_crud.get_workflow_runs_for_user(
            user_id, agent_id, workflow_id, skip, limit
        )
