from typing import Any, Dict, Optional

from backend.app.crud.chat_session_crud import ChatSessionCRUD
from backend.app.crud.lead_crud import LeadCRUD
from backend.app.models.agent import Agent
from backend.app.models.chat_session import ChatSession
from backend.app.models.lead import Lead
from backend.app.schemas.lead import LeadCreate, LeadUpdate
from backend.app.services.ai_service import AIService
from backend.app.services.google_calendar_service import GoogleCalendarService
from backend.app.services.retrieval_service import RetrievalService


class AgentWorkflowService:
    def __init__(
        self,
        lead_crud: LeadCRUD,
        chat_session_crud: ChatSessionCRUD,
        ai_service: AIService,
        google_calendar_service: GoogleCalendarService,
        retrieval_service: RetrievalService,
    ):
        self.lead_crud = lead_crud
        self.chat_session_crud = chat_session_crud
        self.ai_service = ai_service
        self.google_calendar_service = google_calendar_service
        self.retrieval_service = retrieval_service

    async def execute_workflow(
        self, agent: Agent, chat_session: ChatSession, user_message: str
    ) -> str:
        # Retrieve the lead associated with the chat session
        lead = await self.lead_crud.get_lead_by_chat_session_id(chat_session.id)

        if not lead:
            # If no lead exists, create one (this might be part of an initial workflow step)
            # For now, we'll just raise an error or handle it as a generic chat.
            return "Error: No lead associated with this chat session."

        response = ""
        if agent.workflow_schema:
            for step_key, step_data in agent.workflow_schema.items():
                # Evaluate each step in the workflow
                step_response = await self._evaluate_step(
                    agent=agent,
                    chat_session=chat_session,
                    lead=lead,
                    step_data=step_data,
                    user_message=user_message,
                )
                if step_response:
                    response += step_response + "\n"

        if not response:
            # If no workflow step generated a response, use a generic AI response
            response = await self.ai_service.generate_response(
                prompt=f"User said: {user_message}. Agent persona: {agent.persona}"
            )

        # Decrement message credits after generating a response
        credits_decremented = await self._decrement_message_credits(agent)
        if not credits_decremented:
            return "I'm sorry, but this agent has run out of message credits. Please top up to continue."

        return response.strip()

    async def _evaluate_step(
        self,
        agent: Agent,
        chat_session: ChatSession,
        lead: Lead,
        step_data: Dict[str, Any],
        user_message: str,
    ) -> Optional[str]:
        # Placeholder for evaluating a single step in the workflow.
        # This would involve checking conditions, making AI calls, or triggering actions.
        step_type = step_data.get("type")
        step_action = step_data.get("action")
        step_condition = step_data.get("condition")

        # Example: Lead Qualification Step
        if step_type == "lead_qualification" and step_action == "update_status":
            if step_condition and eval(
                step_condition, {"user_message": user_message, "lead": lead}
            ):
                new_status = step_data.get("new_status")
                if new_status:
                    await self.lead_crud.update_lead_status(lead.id, new_status)
                    return f"Lead status updated to {new_status}."

        # Example: Ask a question
        if step_type == "ask_question":
            question = step_data.get("question")
            return question

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
