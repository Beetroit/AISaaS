import hashlib
import hmac
import json

import stripe
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import Response
from twilio.request_validator import RequestValidator

from backend.app.dependencies import (
    CredentialServiceDep,
    AgentWorkflowServiceDep,
    ChatSessionCRUDDep,
    LeadCRUDDep,
)
from backend.app.schemas.lead import LeadCreate
from backend.app.schemas.chat_session import ChatSessionCreate
from backend.app.models.agent import Agent
from sqlalchemy import select


router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/twilio/{client_id}")
async def twilio_whatsapp_webhook(
    client_id: str,
    request: Request,
    credential_service: CredentialServiceDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    chat_session_crud: ChatSessionCRUDDep,
    lead_crud: LeadCRUDDep,
):
    twilio_auth_token = await credential_service.get_webhook_secret(
        client_id, "twilio_webhook_secret"
    )

    if not twilio_auth_token:
        raise HTTPException(
            status_code=403,
            detail="Twilio webhook secret not configured for this client.",
        )

    validator = RequestValidator(twilio_auth_token)

    form_params = await request.form()
    form_params_dict = {key: value for key, value in form_params.items()}

    request_url = str(request.url)

    if not validator.validate(
        request_url, form_params_dict, request.headers.get("X-Twilio-Signature", "")
    ):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature.")

    incoming_message = form_params_dict.get("Body")
    from_number = form_params_dict.get("From")

    if not incoming_message or not from_number:
        raise HTTPException(status_code=400, detail="Missing message body or sender.")

    # Retrieve the agent
    agent_stmt = select(Agent).where(Agent.id == client_id)
    agent = (
        await lead_crud.session.execute(agent_stmt)
    ).scalar_one_or_none()  # Using lead_crud.session for agent retrieval

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    # Retrieve or create chat session
    chat_session = await chat_session_crud.get_chat_session_by_external_id(
        agent.id, from_number
    )

    if not chat_session:
        chat_session_create = ChatSessionCreate(
            user_id=agent.user_id, agent_id=agent.id, external_id=from_number
        )
        chat_session = await chat_session_crud.create_chat_session(chat_session_create)

    # Add user message to chat history
    await chat_session_crud.add_message_to_chat_history(
        chat_session.id, "user", incoming_message
    )

    # Execute agent workflow
    agent_response = await agent_workflow_service.execute_workflow(
        agent=agent,
        chat_session=chat_session,
        user_message=incoming_message,
    )

    # Add agent response to chat history
    await chat_session_crud.add_message_to_chat_history(
        chat_session.id, "agent", agent_response
    )

    # For now, just acknowledge receipt with agent's response
    # In a real scenario, you'd use Twilio's messaging API to send this response
    # For this example, we'll return it in a TwiML-like format
    twiml_response = f"<Response><Message>{agent_response}</Message></Response>"
    return Response(content=twiml_response, media_type="application/xml")


@router.post("/lead/{client_id}")
async def lead_intake_webhook(
    client_id: str,
    request: Request,
    credential_service: CredentialServiceDep,
    lead_crud: LeadCRUDDep,
):
    lead_webhook_secret = await credential_service.get_webhook_secret(
        client_id, "lead_webhook_secret"
    )

    if not lead_webhook_secret:
        raise HTTPException(
            status_code=403,
            detail="Lead webhook secret not configured for this client.",
        )

    # Read raw request body
    body = await request.body()

    # Get signature from header
    x_signature = request.headers.get("X-Signature")
    if not x_signature:
        raise HTTPException(status_code=403, detail="X-Signature header missing.")

    # Calculate expected signature (HMAC-SHA256)
    expected_signature = hmac.new(
        lead_webhook_secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_signature):
        raise HTTPException(status_code=403, detail="Invalid lead webhook signature.")

    # Retrieve lead mapping configuration
    lead_mapping_config = await credential_service.get_credential(
        client_id, "lead_mapping"
    )
    if not lead_mapping_config:
        # Default mapping or raise error if mapping is mandatory
        lead_mapping_config = {"field_map": {}, "default_values": {}}

    try:
        webhook_data = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    # Apply mapping
    mapped_lead_data = {}
    for webhook_field, lead_field in lead_mapping_config.get("field_map", {}).items():
        if webhook_field in webhook_data:
            mapped_lead_data[lead_field] = webhook_data[webhook_field]

    # Apply default values
    mapped_lead_data.update(lead_mapping_config.get("default_values", {}))

    # Create Lead object
    try:
        # Assuming user_id, agent_id, chat_session_id are available or can be derived
        # For now, using placeholders or deriving from client_id if possible
        # This part needs careful consideration based on how leads are associated
        # with users/agents/chat_sessions from external webhooks.
        # For demonstration, let's assume we can get agent_id from client_id and user_id from agent.
        agent_stmt = select(Agent).where(Agent.id == client_id)
        agent = (await lead_crud.session.execute(agent_stmt)).scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=404, detail="Agent not found for client_id."
            )

        lead_create = LeadCreate(**mapped_lead_data)
        new_lead = await lead_crud.create_lead(
            lead=lead_create,
            user_id=agent.user_id,
            agent_id=agent.id,
            chat_session_id="",  # This might need to be null or derived differently for webhooks
        )

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid lead data after mapping: {e}"
        )

    # TODO: Store lead in database (requires a CRUD operation for Lead)
    # For now, just acknowledge receipt
    return {
        "message": f"Lead webhook received and mapped for client {client_id}",
        "lead_data": mapped_lead_data,
        "new_lead_id": new_lead.id if new_lead else None,
    }


@router.post("/stripe/{client_id}")
async def stripe_webhook(
    client_id: str,
    request: Request,
    credential_service: CredentialServiceDep,
):
    stripe_webhook_secret = await credential_service.get_webhook_secret(
        client_id, "stripe_webhook_secret"
    )

    if not stripe_webhook_secret:
        raise HTTPException(
            status_code=403,
            detail="Stripe webhook secret not configured for this client.",
        )

    # Read raw request body
    body = await request.body()
    # Get signature from header
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=403, detail="Stripe-Signature header missing.")

    try:
        event = stripe.Webhook.construct_event(
            payload=body, sig_header=sig_header, secret=stripe_webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")
    except stripe.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=403, detail=f"Invalid signature: {e}")

    # Handle the event
    if event["type"] == "customer.subscription.created":
        # TODO: Handle subscription creation
        print(f"Subscription created: {event['data']['object']}")
    elif event["type"] == "customer.subscription.updated":
        # TODO: Handle subscription update
        print(f"Subscription updated: {event['data']['object']}")
    elif event["type"] == "customer.subscription.deleted":
        # TODO: Handle subscription cancellation
        print(f"Subscription deleted: {event['data']['object']}")
    else:
        print(f"Unhandled event type: {event['type']}")

    return {"status": "success"}
