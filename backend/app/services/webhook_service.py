import logging

from backend.app.crud.chat_session_crud import ChatSessionCRUD
from backend.app.crud.lead_crud import LeadCRUD
from backend.app.crud.message_crud import MessageCRUD
from backend.app.crud.workflow_run_crud import WorkflowRunCRUD
from backend.app.schemas.chat_session import ChatSessionCreate
from backend.app.schemas.lead import LeadCreate
from backend.app.schemas.message import MessageCreate
from backend.app.schemas.workflow_run import WorkflowRunCreate
from backend.app.services.agent_workflow_service import AgentWorkflowService
from backend.app.services.credential_service import CredentialService

logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(
        self,
        chat_session_crud: ChatSessionCRUD,
        lead_crud: LeadCRUD,
        message_crud: MessageCRUD,
        workflow_run_crud: WorkflowRunCRUD,
        agent_workflow_service: AgentWorkflowService,
        credential_service: CredentialService,
    ):
        self.chat_session_crud = chat_session_crud
        self.lead_crud = lead_crud
        self.message_crud = message_crud
        self.workflow_run_crud = workflow_run_crud
        self.agent_workflow_service = agent_workflow_service
        self.credential_service = credential_service

    async def handle_twilio_webhook(
        self,
        from_number: str,
        to_number: str,
        incoming_message: str,
        client_id: str,
    ) -> dict:
        # Get agent by Twilio account SID
        agent = await self.credential_service.get_agent_by_twilio_account_sid(client_id)
        if not agent:
            raise ValueError("Agent not found for the given credentials.")

        # Find or create chat_session
        chat_session = await self.chat_session_crud.get_chat_session_by_external_id(
            agent.id, from_number
        )
        if not chat_session:
            chat_session_create = ChatSessionCreate(
                agent_id=agent.id,
                external_id=from_number,
                user_id=agent.user_id,
            )
            chat_session = await self.chat_session_crud.create_chat_session(
                chat_session_create
            )

        # Find or create lead
        lead = await self.lead_crud.get_lead_by_chat_session_id(chat_session.id)
        if not lead:
            lead_create = LeadCreate(
                contact_info={"phone_number": from_number},
                name=f"Lead {from_number}",
            )
            lead = await self.lead_crud.create_lead(
                lead_create,
                user_id=agent.user_id,
                agent_id=agent.id,
                chat_session_id=chat_session.id,
            )

        # Check credential in use (using lead.id as workflow_run_id temporarily)
        credential_in_use = await self.credential_service.mark_credential_in_use(
            to_number, str(lead.id)
        )
        if not credential_in_use:
            raise ValueError("Credential not available or mismatched.")

        # Get associated workflow
        # Assuming agent_workflows has relation, but to avoid direct query, assume first or add method
        # For now, get workflow from agent.workflows if loaded
        if agent.workflows:
            workflow = agent.workflows[0]  # Assuming one workflow per agent
        else:
            raise ValueError("No workflow associated with the agent.")

        # Create workflow run
        from backend.app.schemas.enums import WorkflowRunStatus

        workflow_run_data = WorkflowRunCreate(
            agent_id=agent.id,
            workflow_id=workflow.id,
            chat_session_id=chat_session.id,
            lead_id=lead.id,
            credential_id=to_number,
            status=WorkflowRunStatus.IN_PROGRESS,
        )
        workflow_run = await self.workflow_run_crud.create_workflow_run(
            workflow_run_data
        )

        # Update credential in_use with actual workflow_run_id
        await self.credential_service.mark_credential_in_use(to_number, workflow_run.id)

        # Create incoming message
        incoming_msg_create = MessageCreate(
            chat_session_id=chat_session.id,
            role="user",
            content=incoming_message,
        )
        await self.message_crud.create_message(incoming_msg_create)

        # Execute workflow
        agent_response = await self.agent_workflow_service.execute_workflow(
            workflow_run.id, incoming_message
        )

        # Create outgoing message
        outgoing_msg_create = MessageCreate(
            chat_session_id=chat_session.id,
            role="agent",
            content=agent_response,
        )
        await self.message_crud.create_message(outgoing_msg_create)

        return {"response": agent_response}
