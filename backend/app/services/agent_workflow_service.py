from typing import Any, Dict, List, Optional

from backend.app.config import logger
from backend.app.crud.chat_session_crud import ChatSessionCRUD
from backend.app.crud.lead_crud import LeadCRUD
from backend.app.crud.message_crud import MessageCRUD
from backend.app.models.agent import Agent
from backend.app.models.chat_session import ChatSession
from backend.app.schemas.message import MessageCreate
from backend.app.services.ai_service import AIService
from backend.app.services.credential_service import CredentialService
from backend.app.services.messaging_service import MessagingService
from backend.app.services.workflow_actions.factory import ActionFactory


class AgentWorkflowService:
    def __init__(
        self,
        lead_crud: LeadCRUD,
        chat_session_crud: ChatSessionCRUD,
        message_crud: MessageCRUD,
        ai_service: AIService,
        credential_service: CredentialService,
        messaging_service: MessagingService,
    ):
        self.lead_crud = lead_crud
        self.chat_session_crud = chat_session_crud
        self.message_crud = message_crud
        self.ai_service = ai_service
        self.credential_service = credential_service
        self.messaging_service = messaging_service
        self.action_factory = ActionFactory()

    async def execute_workflow(
        self, agent: Agent, chat_session: ChatSession, user_message: str
    ) -> str:
        if not agent.workflow_schema:
            return "Error: Agent has no workflow schema defined."

        nodes = {node["id"]: node for node in agent.workflow_schema.get("nodes", [])}
        edges = agent.workflow_schema.get("edges", [])

        current_node_id = chat_session.current_workflow_step or self._find_start_node(
            nodes
        )
        if not current_node_id:
            return "Error: Workflow has no start node."

        workflow_context = {"user_message": user_message}
        response = ""

        while current_node_id:
            current_node = nodes.get(current_node_id)
            if not current_node:
                logger.error(
                    "Workflow error: Node ID %s not found in schema.", current_node_id
                )
                return "Error: Workflow execution failed."

            action_class = self.action_factory.get_action(current_node["type"])
            action_instance = action_class()

            # This context will be expanded to include all necessary services and data
            action_result = await action_instance.execute(
                context=workflow_context, node_data=current_node.get("data", {})
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
                logger.info("Workflow path completed for session %s.", chat_session.id)
                break

        if not response:
            response = "Workflow completed."  # Default response if no question is asked

        await self._handle_response_and_credits(agent, chat_session, response)
        return response

    def _find_start_node(self, nodes: Dict[str, Any]) -> Optional[str]:
        for node_id, node in nodes.items():
            if node.get("type") == "start":
                return node_id
        return None

    def _find_next_node(
        self, current_node_id: str, edges: List[Dict[str, Any]]
    ) -> Optional[str]:
        for edge in edges:
            if edge.get("source") == current_node_id:
                return edge.get("target")
        return None

    async def _handle_response_and_credits(
        self, agent: Agent, chat_session: ChatSession, response: str
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

        twilio_credentials = await self.credential_service.get_credential(
            agent.user_id, "twilio"
        )
        if twilio_credentials:
            await self.messaging_service.send_message(
                to=chat_session.external_id,
                body=final_response,
                creds=twilio_credentials,
            )
        else:
            logger.warning(
                "Messaging credentials not configured for agent %s. Cannot send message.",
                agent.id,
            )

    async def _decrement_message_credits(self, agent: Agent, amount: int = 1) -> bool:
        if agent.message_credits >= amount:
            agent.message_credits -= amount
            self.lead_crud.session.add(agent)
            await self.lead_crud.session.flush()
            return True
        else:
            logger.info("Agent %s has insufficient credits.", agent.id)
            return False
