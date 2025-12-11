from typing import Optional

from backend.app.models.user import User
from backend.app.models.workflow_run import WorkflowRun
from backend.app.services.admin_command_handler import AdminCommandHandler
from backend.app.services.agent_workflow_service import (
    AgentWorkflowService,
)


class MessageRouter:
    """
    Routes incoming messages based on evaluation results.
    """

    def __init__(
        self,
        admin_command_handler: AdminCommandHandler,
        agent_workflow_service: AgentWorkflowService,
    ):
        self.admin_command_handler = admin_command_handler
        self.agent_workflow_service = agent_workflow_service

    async def route_message(
        self,
        from_number: str,
        message_body: str,
        is_admin_command: bool,
        workflow_run: Optional[WorkflowRun],
        user: Optional[User],
        **kwargs,
    ) -> str:
        """
        Routes the message to the appropriate handler.

        Args:
            from_number: The phone number the message originated from.
            message_body: The content of the message.
            is_admin_command: Result from AdminMessageEvaluator.
            workflow_run: The active WorkflowRun model instance, if any.
            user: The User object.
            db_session: Database session.

        Returns:
            The response message as a string.
        """
        if is_admin_command:
            return await self.admin_command_handler.handle_command(
                message_body, from_number, user, **kwargs
            )
        else:
            # Route to existing workflow processing
            # This part will be modified in _process_twilio_webhook
            # For now, just return a generic message
            if workflow_run:
                # This will be replaced by actual workflow execution
                # The workflow_run is now the model, so access its id directly
                return f"Processing regular message for workflow {workflow_run.id}: '{message_body}'"
            else:
                return (
                    f"No active workflow, processing regular message: '{message_body}'"
                )
