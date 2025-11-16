from datetime import datetime, timezone
from typing import Any, Optional

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
from backend.app.schemas.message import MessageCreate
from backend.app.services.ai_service import AIService
from backend.app.services.credential_service import CredentialService
from backend.app.services.messaging_service import MessagingService
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
        self.action_factory = ActionFactory()

    async def execute_workflow(self, workflow_run_id: str, user_message: str) -> str:
        workflow_run = await self.workflow_run_crud.get_workflow_run(workflow_run_id)
        if not workflow_run:
            logger.error("WorkflowRun with ID %s not found.", workflow_run_id)
            return "Error: Workflow run not found."

        agent = await self.lead_crud.session.get(
            Agent, workflow_run.agent_id
        )  # Assuming lead_crud.session is the main session
        workflow = await self.workflow_crud.get_workflow(workflow_run.workflow_id)
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

                action_class = self.action_factory.get_action(current_node["type"])
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
        self, workflow_context: dict[str, Any], completion_requirements: dict[str, Any]
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

    def _find_start_node(self, nodes: dict[str, Any]) -> Optional[str]:
        for node_id, node in nodes.items():
            if node.get("type") == "start":
                return node_id
        return None

    def _find_next_node(
        self, current_node_id: str, edges: list[dict[str, Any]]
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

    async def associate_workflow_with_agent(
        self, agent_id: str, workflow_id: str, user_id: str
    ) -> bool:
        return await self.agent_crud.associate_workflow_with_agent(
            agent_id, workflow_id, user_id
        )

    async def remove_workflow_from_agent(
        self, agent_id: str, workflow_id: str, user_id: str
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
