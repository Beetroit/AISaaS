from typing import Any, Dict, Optional

from backend.app.crud.chat_session_crud import ChatSessionCRUD
from backend.app.crud.lead_crud import LeadCRUD
from backend.app.crud.message_crud import MessageCRUD
from backend.app.models.agent import Agent
from backend.app.models.chat_session import ChatSession
from backend.app.models.lead import Lead
from backend.app.schemas.lead import LeadCreate, LeadUpdate
from backend.app.schemas.message import MessageCreate
from backend.app.services.ai_service import AIService
from backend.app.services.credential_service import CredentialService
from backend.app.services.google_calendar_service import GoogleCalendarService
from backend.app.services.messaging_service import MessagingService
from backend.app.services.retrieval_service import RetrievalService


class AgentWorkflowService:
    def __init__(
        self,
        lead_crud: LeadCRUD,
        chat_session_crud: ChatSessionCRUD,
        message_crud: MessageCRUD,
        ai_service: AIService,
        google_calendar_service: GoogleCalendarService,
        retrieval_service: RetrievalService,
        credential_service: CredentialService,
        messaging_service: MessagingService,
    ):
        self.lead_crud = lead_crud
        self.chat_session_crud = chat_session_crud
        self.message_crud = message_crud
        self.ai_service = ai_service
        self.google_calendar_service = google_calendar_service
        self.retrieval_service = retrieval_service
        self.credential_service = credential_service
        self.messaging_service = messaging_service

    async def execute_workflow(
        self, agent: Agent, chat_session: ChatSession, user_message: str
    ) -> str:
        lead = await self.lead_crud.get_lead_by_chat_session_id(chat_session.id)

        if not lead:
            return "Error: No lead associated with this chat session."

        response = ""
        current_step_key = (
            chat_session.current_workflow_step or "1"
        )  # Start at step 1 or current

        if agent.workflow_schema and current_step_key in agent.workflow_schema:
            step_data = agent.workflow_schema[current_step_key]
            step_response, next_step_key = await self._process_workflow_step(
                agent=agent,
                chat_session=chat_session,
                lead=lead,
                step_key=current_step_key,
                step_data=step_data,
                user_message=user_message,
            )
            if step_response:
                response += step_response

            chat_session.current_workflow_step = next_step_key
            await self.chat_session_crud.session.flush()

        if not response:
            # If no workflow step generated a response, use a generic AI response
            ai_response_content = await self.ai_service.generate_response(
                prompt=f"User said: {user_message}. Agent persona: {agent.persona}"
            )
            response = ai_response_content
            await self.message_crud.create_message(
                MessageCreate(
                    chat_session_id=chat_session.id,
                    role="agent",
                    content=ai_response_content,
                )
            )

        # Decrement message credits after generating a response
        credits_decremented = await self._decrement_message_credits(agent)
        if not credits_decremented:
            # Even if credits run out, we should inform the user.
            final_response = "I'm sorry, but this agent has run out of message credits. Please top up to continue."
        else:
            final_response = response.strip()

        # Send the response via the messaging service
        twilio_credentials = await self.credential_service.get_credential(
            agent.user_id, "twilio"
        )
        if twilio_credentials:
            await self.messaging_service.send_message(
                to=chat_session.external_id,  # The user's phone number
                body=final_response,
                creds=twilio_credentials,
            )
        else:
            # Log that credentials are not configured for this agent
            print(
                f"Warning: Messaging credentials not configured for agent {agent.id}. Cannot send message."
            )

        return final_response

    async def _process_workflow_step(
        self,
        agent: Agent,
        chat_session: ChatSession,
        lead: Lead,
        step_key: str,
        step_data: Dict[str, Any],
        user_message: str,
    ) -> tuple[Optional[str], Optional[str]]:
        step_type = step_data.get("type")
        response = None
        next_step_key = str(int(step_key) + 1)  # Default to next step

        if step_type == "ask_question":
            # If we are asking a question, the response is the question itself.
            # The next step remains the current step until an answer is processed.
            response = step_data.get("question")
            next_step_key = step_key
        elif step_type == "process_answer":
            # Evaluate user's message against conditions to determine next action/status
            for condition_key, condition_data in step_data.get(
                "next_step_if_match", {}
            ).items():
                if await self._evaluate_condition(
                    condition_data["condition"],
                    {"user_message": user_message, "lead": lead},
                ):
                    # Execute the action associated with the matched condition
                    action_response = await self._execute_action(
                        agent=agent,
                        chat_session=chat_session,
                        lead=lead,
                        step_data=condition_data,  # Use condition_data as step_data for action
                        user_message=user_message,
                    )
                    if action_response:
                        response = action_response
                    next_step_key = condition_data.get(
                        "next_step", str(int(step_key) + 1)
                    )
                    break
            if not response:
                response = "I didn't understand your answer. Could you please rephrase?"
                next_step_key = step_key
        else:
            # For other step types, execute the action directly
            response = await self._execute_action(
                agent=agent,
                chat_session=chat_session,
                lead=lead,
                step_data=step_data,
                user_message=user_message,
            )

        return response, next_step_key

    async def _execute_action(
        self,
        agent: Agent,
        chat_session: ChatSession,
        lead: Lead,
        step_data: Dict[str, Any],
        user_message: str,
    ) -> Optional[str]:
        step_type = step_data.get("type")

        # Example: Schedule Appointment Step
        if step_type == "schedule_appointment":
            # This is a simplified example. In a real scenario, you'd extract
            # appointment details (summary, start_time, end_time) from the user_message
            # or other context, possibly using the AI service.
            appointment_details = {
                "summary": "Meeting with Lead",
                "start_time": "2025-12-01T10:00:00Z",  # Example: needs to be dynamic
                "end_time": "2025-12-01T11:00:00Z",  # Example: needs to be dynamic
                "attendees": [{"email": lead.contact_info.get("email")}],
            }
            try:
                await self.google_calendar_service.create_calendar_event(
                    user_id=agent.user_id, event_details=appointment_details
                )
                return "Appointment scheduled successfully!"
            except Exception as e:
                return f"Failed to schedule appointment: {e}"

        # Example: Product Discussion Step
        if step_type == "product_discussion":
            product_query = step_data.get("query", user_message)
            # Retrieve relevant product information from the knowledge base
            retrieved_docs = await self.retrieval_service.retrieve_relevant_chunks(
                query=product_query, user_id=agent.user_id, agent_id=agent.id
            )
            product_info = "\n".join([doc.document for doc in retrieved_docs])

            if product_info:
                ai_prompt = (
                    f"Based on the following product information:\n{product_info}\n"
                    f"and the user's query: {user_message},\n"
                    f"provide a detailed response about the product."
                )
                response = await self.ai_service.generate_response(prompt=ai_prompt)
                return response
            else:
                return "I couldn't find information about that product."

        # Example: Create Lead Step (if not already created)
        if step_type == "create_lead":
            if not lead.id:  # Check if lead already exists
                # This is a simplified example. In a real scenario, you'd extract
                # lead details from the user_message or other context.
                lead_create_data = {
                    "user_id": agent.user_id,
                    "agent_id": agent.id,
                    "chat_session_id": chat_session.id,
                    "name": "New Lead from Chat",
                    "qualification_status": "new",
                }
                new_lead = await self.lead_crud.create_lead(
                    lead=LeadCreate(**lead_create_data),
                    user_id=agent.user_id,
                    agent_id=agent.id,
                    chat_session_id=chat_session.id,
                )
                if new_lead:
                    return f"New lead created: {new_lead.id}"
                else:
                    return "Failed to create new lead."

        # Example: Update Lead Step
        if step_type == "update_lead":
            # This is a simplified example. In a real scenario, you'd extract
            # update details from the user_message or other context.
            update_data = {"qualification_status": "qualified"}
            updated_lead = await self.lead_crud.update_lead(
                lead.id, LeadUpdate(**update_data)
            )
            if updated_lead:
                return f"Lead {updated_lead.id} updated."
            else:
                return "Failed to update lead."

        return None

    async def _decrement_message_credits(self, agent: Agent, amount: int = 1) -> bool:
        if agent.message_credits >= amount:
            agent.message_credits -= amount
            self.lead_crud.session.add(agent)
            await self.lead_crud.session.flush()

            return True
        else:
            # Handle insufficient credits (e.g., log, raise error, notify user)
            print(f"Agent {agent.id} has insufficient credits.")
            return False

    async def _evaluate_condition(
        self, condition: str, context: Dict[str, Any]
    ) -> bool:
        # Basic and safe condition evaluation. Extend as needed with a proper expression parser.
        # Avoids `eval()` for security reasons.
        user_message = context.get("user_message", "").lower()
        lead = context.get("lead")

        if "user_message contains 'yes'" in condition.lower():
            return "yes" in user_message
        if "user_message contains 'no'" in condition.lower():
            return "no" in user_message
        if "lead.qualification_status == 'qualified'" in condition.lower() and lead:
            return lead.qualification_status == "qualified"
        # Add more safe conditions as needed
        return False
