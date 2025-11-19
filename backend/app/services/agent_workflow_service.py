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

    async def execute_workflow(self, workflow_run_id: str, user_message: str) -> str:
        # First, retrieve the workflow run by its ID (user_id is optional in the updated method)
        workflow_run = await self.workflow_run_crud.get_workflow_run(workflow_run_id)
        if not workflow_run:
            logger.error("WorkflowRun with ID %s not found.", workflow_run_id)
            return "Error: Workflow run not found."

        user_id = workflow_run.user_id

        agent = await self.lead_crud.session.get(
            Agent, workflow_run.agent_id
        )  # Assuming lead_crud.session is the main session
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
        current_node_id = chat_session.current_workflow_step or self._find_start_node(
            nodes
        )
        if not current_node_id:
            return "Error: Workflow has no start node."

        workflow_context = {"user_message": user_message}
        response = ""

        try:
            while current_node_id:
                current_node = nodes.get(current_node_id)
                if not current_node:
                    logger.error(
                        "Workflow error: Node ID %s not found in schema.",
                        current_node_id,
                    )
                    raise ValueError("Workflow execution failed: Node not found.")

                node_type = self._get_node_type(current_node)

                # Handle lead extraction node
                if node_type == "lead_extraction":
                    try:
                        lead_config = LeadExtractionConfig(
                            **current_node.get("data", {})
                        )
                    except Exception as e:
                        logger.error(
                            "Invalid LeadExtractionConfig for node %s: %s",
                            current_node_id,
                            e,
                        )
                        return "Error: Invalid lead extraction configuration."

                    if chat_session.lead_collection_state is None:
                        chat_session.lead_collection_state = {
                            "collected_data": {},
                        }

                    (
                        updated_lead_state,
                        ai_response,
                    ) = await self._extract_lead_info(
                        user_message=user_message,
                        current_lead_state=chat_session.lead_collection_state,
                        lead_config=lead_config,
                        chat_session_id=chat_session.id,
                    )
                    chat_session.lead_collection_state = updated_lead_state
                    self.chat_session_crud.session.add(chat_session)
                    await self.chat_session_crud.session.flush()

                    # Check if all required fields are collected AND validated
                    collected_data = updated_lead_state.get("collected_data", {})
                    missing_or_unvalidated = []
                    for field in lead_config.fields:
                        field_data = collected_data.get(field.name, {})
                        if field.required and (
                            not field_data.get("value")
                            or not field_data.get("validated")
                        ):
                            missing_or_unvalidated.append(field.name)

                    if missing_or_unvalidated:
                        response = ai_response  # AI provides the prompt for missing info/validation
                        chat_session.current_workflow_step = (
                            current_node_id  # Stay on this node
                        )
                        await self.chat_session_crud.session.flush()
                        break
                    else:
                        # All required fields collected and validated, proceed to next node
                        logger.info(
                            "All required lead fields collected and validated for session %s. Persisting lead.",
                            chat_session.id,
                        )
                        # Flatten data for storage: { "field": "value" }
                        final_lead_data = {
                            k: v["value"]
                            for k, v in collected_data.items()
                            if v.get("value")
                        }

                        existing_lead = (
                            await self.lead_crud.get_lead_by_chat_session_id(
                                chat_session.id
                            )
                        )

                        if existing_lead:
                            lead_update_data = LeadUpdate(contact_info=final_lead_data)
                            await self.lead_crud.update_lead(
                                existing_lead.id, lead_update_data
                            )
                        else:
                            lead_create_data = LeadCreate(
                                contact_info=final_lead_data,
                            )
                            await self.lead_crud.create_lead(
                                lead=lead_create_data,
                                user_id=chat_session.user_id,
                                agent_id=chat_session.agent_id,
                                chat_session_id=chat_session.id,
                            )
                        pass  # Continue to find next node

                # Handle product Q&A node
                elif node_type == "product_qa":
                    response = await self._answer_product_question(
                        user_message=user_message,
                        knowledge_base_document_ids=knowledge_base_document_ids,
                    )
                    # After answering, we typically want to move to the next node
                    # unless the answer itself implies a pause or further interaction.
                    # For now, we'll let it proceed to the next node.
                    # If the product_qa node should pause, it would return a "question_to_ask"
                    # which is handled by the generic question handling below.
                    pass

                action_class = self.action_factory.get_action(node_type)
                action_instance = action_class()

                # Check for node completion requirements before executing the action
                completion_requirements = current_node.get("data", {}).get(
                    "completion_requirements"
                )
                if completion_requirements:
                    missing_fields_prompt = self._check_node_completion(
                        workflow_context, completion_requirements
                    )
                    if missing_fields_prompt:
                        response = missing_fields_prompt
                        chat_session.current_workflow_step = (
                            current_node_id  # Stay on this node
                        )
                        await self.chat_session_crud.session.flush()
                        break  # Exit the loop to send the prompt for missing info

                # This context will be expanded to include all necessary services and data
                action_result = await action_instance.execute(
                    context=workflow_context,
                    node_data=current_node.get("data", {}),
                    knowledge_base_document_ids=knowledge_base_document_ids,
                )

                # Merge results into the main context
                workflow_context.update(action_result)

                # Special handling for questions that pause the workflow
                if "question_to_ask" in action_result:
                    response = action_result["question_to_ask"]
                    chat_session.current_workflow_step = (
                        current_node_id  # Stay on this node
                    )
                    await self.chat_session_crud.session.flush()
                    break  # Exit the loop to send the question

                # Find the next node
                next_node_id = self._find_next_node(current_node_id, edges)
                chat_session.current_workflow_step = next_node_id
                current_node_id = next_node_id

                if not current_node_id:  # Reached the end of a path
                    logger.info(
                        "Workflow path completed for session %s.", chat_session.id
                    )
                    workflow_run.status = "completed"
                    workflow_run.end_time = datetime.now(timezone.utc)
                    await self.workflow_run_crud.session.flush()
                    break

            if not response:
                response = (
                    "Workflow completed."  # Default response if no question is asked
                )

            await self._handle_response_and_credits(
                agent, chat_session, workflow_run, response
            )
            return response
        except Exception as e:
            logger.error("Error executing workflow run %s: %s", workflow_run_id, e)
            workflow_run.status = "failed"
            workflow_run.end_time = datetime.now(timezone.utc)
            await self.workflow_run_crud.session.flush()
            return "Error: An unexpected error occurred during workflow execution."

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

        if workflow_run.credential_id:
            twilio_credentials = await self.credential_service.get_credential_by_id(
                workflow_run.credential_id
            )
            if twilio_credentials:
                await self.messaging_service.send_message(
                    to_number=chat_session.external_id,
                    message_body=final_response,
                    creds=twilio_credentials,
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
        if not knowledge_base_document_ids:
            return "I don't have access to product information for this agent."

        # Retrieve relevant chunks from the knowledge base
        relevant_chunks = await self.retrieval_service.retrieve_relevant_chunks(
            query=user_message,
            user_id="system",  # Or the actual user_id if relevant for filtering
            document_ids=knowledge_base_document_ids,
        )

        if not relevant_chunks:
            return "I couldn't find any relevant product information for your question."

        context_text = "\n".join([chunk.document for chunk in relevant_chunks])

        system_prompt = (
            "You are a helpful AI assistant. Answer the user's question based "
            "only on the provided product information context. If the answer "
            "is not in the context, state that you don't have enough information."
        )
        user_prompt = (
            f"Product Information Context:\n{context_text}\n\n"
            f"User Question: {user_message}\n\n"
            "Answer:"
        )

        try:
            ai_response = await self.ai_service.generate_response(
                prompt=user_prompt, system_message=system_prompt
            )
            return ai_response
        except Exception as e:
            logger.error("Error generating product Q&A response: %s", e)
            return "An error occurred while trying to answer your question."

    async def _extract_lead_info(
        self,
        user_message: str,
        current_lead_state: Dict[str, Any],
        lead_config: LeadExtractionConfig,
        chat_session_id: str,
    ) -> tuple[Dict[str, Any], str]:
        collected_data = current_lead_state.get("collected_data", {})

        # Initialize data structure if empty
        # Structure: { "field_name": { "value": "some value", "validated": bool } }
        if not collected_data:
            for field in lead_config.fields:
                collected_data[field.name] = {"value": None, "validated": False}

        # Identify fields that need attention (missing or not validated)
        fields_to_process = []
        for field in lead_config.fields:
            field_data = collected_data.get(
                field.name, {"value": None, "validated": False}
            )
            if not field_data["value"] or not field_data["validated"]:
                fields_to_process.append(field)

        if not fields_to_process:
            return (
                {"collected_data": collected_data},
                "All information has been collected and validated.",
            )

        # Construct the prompt for the AI
        system_prompt = (
            "You are an AI assistant designed to extract and validate lead information "
            "from user conversations. Your goal is to identify values for specific fields "
            "and ensure they are valid based on the field description. "
            "For each field, you must determine if the user has provided a value "
            "and if that value is valid/confirmed.\n\n"
            "Output a JSON object with the following structure:\n"
            "{\n"
            '  "extracted_fields": {\n'
            '    "field_name": { "value": "extracted value", "validated": boolean }\n'
            "  },\n"
            '  "follow_up_question": "Question to ask the user if information is missing or needs validation",\n'
            '  "confirmation": "Message to send if all required fields are valid"\n'
            "}\n\n"
            "Rules:\n"
            "1. If a value is new or changed, set 'validated' to false unless the user explicitly confirms it.\n"
            "2. If you ask the user to confirm a value (e.g., 'Is your email x@y.com?') and they say yes, set 'validated' to true.\n"
            "3. If a value is missing, set 'value' to null.\n"
            "4. Prioritize required fields."
        )

        fields_desc = "\n".join(
            [
                f"- {f.name}: {f.description} (Required: {f.required})"
                for f in lead_config.fields
            ]
        )

        current_state_desc = json.dumps(collected_data, indent=2)

        user_prompt = (
            f"The user said: '{user_message}'.\n\n"
            f"Fields to extract:\n{fields_desc}\n\n"
            f"Current State:\n{current_state_desc}\n\n"
            "Update the state based on the user's message. "
            "If a value is present but not validated, you should probably ask for confirmation or check it against the description. "
            "Provide a follow-up question to get missing info or validate existing info."
        )

        try:
            ai_raw_response = await self.ai_service.generate_response(
                prompt=user_prompt, system_message=system_prompt
            )
            # Clean up potential markdown code blocks
            if "```json" in ai_raw_response:
                ai_raw_response = (
                    ai_raw_response.split("```json")[1].split("```")[0].strip()
                )
            elif "```" in ai_raw_response:
                ai_raw_response = (
                    ai_raw_response.split("```")[1].split("```")[0].strip()
                )

            ai_response_json = json.loads(ai_raw_response)

            extracted_fields = ai_response_json.get("extracted_fields", {})

            # Update collected data
            for field_name, data in extracted_fields.items():
                if field_name in collected_data:
                    # Only update if value is not None or if we are explicitly clearing it
                    if data.get("value") is not None:
                        collected_data[field_name]["value"] = data["value"]

                    # Update validation status if provided
                    if "validated" in data:
                        collected_data[field_name]["validated"] = data["validated"]

            # Determine AI's conversational response
            ai_conversational_response = (
                ai_response_json.get("follow_up_question")
                or ai_response_json.get("confirmation")
                or "Thank you."
            )

            updated_lead_state = {
                "collected_data": collected_data,
            }
            return updated_lead_state, ai_conversational_response

        except json.JSONDecodeError:
            logger.error(
                "AI response was not valid JSON for lead extraction: %s",
                ai_raw_response,
            )
            return (
                current_lead_state,
                "I apologize, I had trouble understanding that. Could you please rephrase?",
            )
        except Exception as e:
            logger.error(
                "Error during lead extraction for session %s: %s", chat_session_id, e
            )
            return (
                current_lead_state,
                "An error occurred during lead extraction. Please try again.",
            )

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
