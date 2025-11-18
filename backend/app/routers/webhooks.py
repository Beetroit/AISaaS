import hashlib
import hmac
import json

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import Response
from twilio.request_validator import RequestValidator

from backend.app.config import logger, settings
from backend.app.dependencies import (
    AgentWorkflowServiceDep,
    ChatSessionCRUDDep,
    CredentialServiceDep,
    LeadCRUDDep,
    MessageCRUDDep,
    StripeServiceDep,  # Added StripeServiceDep
    WorkflowRunCRUDDep,
    get_db,
)
from backend.app.models.agent import Agent
from backend.app.models.credential import Credential
from backend.app.models.workflow import Workflow
from backend.app.schemas.chat_session import ChatSessionCreate
from backend.app.schemas.enums import WorkflowRunStatus
from backend.app.schemas.lead import LeadCreate
from backend.app.schemas.message import MessageCreate
from backend.app.schemas.workflow_run import WorkflowRunCreate

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/twilio-callback")
async def twilio_status_callback(request: Request):
    """
    Handles WhatsApp message status callbacks from Twilio.
    Logs the full received status update.
    """
    form_params = await request.form()
    form_params_dict = {key: value for key, value in form_params.items()}

    logger.info(f"Twilio status callback received: {form_params_dict}")

    return {"status": "received"}


@router.post("/twilio")
async def twilio_whatsapp_webhook(
    request: Request,
    credential_service: CredentialServiceDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    chat_session_crud: ChatSessionCRUDDep,
    lead_crud: LeadCRUDDep,
    message_crud: MessageCRUDDep,
    workflow_run_crud: WorkflowRunCRUDDep,
    db: AsyncSession = Depends(get_db),
):
    """
    Handles incoming WhatsApp messages from Twilio.
    This endpoint is multi-tenant and routes messages to the correct agent
    based on the 'To' phone number.
    """
    form_params = await request.form()
    logger.info(f"Twilio webhook received: {form_params}")
    form_params_dict = {key: value for key, value in form_params.items()}
    to_number = form_params_dict.get("To")

    if not to_number:
        raise HTTPException(
            status_code=400, detail="Missing 'To' phone number in webhook data."
        )

    # Find the agent associated with this Twilio phone number
    agent_stmt = (
        select(Agent)
        .join(Credential, Agent.user_id == Credential.user_id)
        .where(
            Credential.credential_type == "twilio",
            Credential.phone_number == to_number,
        )
    )
    agent = (await db.execute(agent_stmt)).scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"No agent found for Twilio phone number: {to_number}",
        )

    # Get the specific Twilio credential used for this incoming message
    (
        twilio_credential_data,
        twilio_credential_model,
    ) = await credential_service.get_credential_and_model(agent.user_id, "twilio")
    if not twilio_credential_data or not twilio_credential_model:
        raise HTTPException(
            status_code=403,
            detail="Twilio credentials are not configured for this agent.",
        )

    twilio_auth_token = twilio_credential_data["twilio_auth_token"]
    validator = RequestValidator(twilio_auth_token)
    request_url = str(request.url)

    x_twilio_signature = request.headers.get("x-twilio-signature")
    if not x_twilio_signature or not validator.validate(
        request_url, form_params_dict, x_twilio_signature
    ):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature.")

    incoming_message = form_params_dict.get("Body")
    from_number = form_params_dict.get("From")

    if not incoming_message or not from_number:
        raise HTTPException(status_code=400, detail="Missing message body or sender.")

    chat_session = await chat_session_crud.get_chat_session_by_external_id(
        agent.id, from_number
    )

    if not chat_session:
        chat_session_create = ChatSessionCreate(
            user_id=agent.user_id, agent_id=agent.id, external_id=from_number
        )
        chat_session = await chat_session_crud.create_chat_session(chat_session_create)

    # Ensure a lead exists for this chat session
    lead = await lead_crud.get_lead_by_chat_session_id(chat_session.id)
    if not lead:
        lead_create = LeadCreate(
            name="New Lead from WhatsApp",
            contact_info={"phone": from_number},
            qualification_status="new",
        )
        lead = await lead_crud.create_lead(
            lead=lead_create,
            user_id=agent.user_id,
            agent_id=agent.id,
            chat_session_id=chat_session.id,
        )

    await message_crud.create_message(
        MessageCreate(
            chat_session_id=chat_session.id, role="user", content=incoming_message
        )
    )

    # --- Workflow Selection and WorkflowRun Creation ---
    # For simplicity, pick the first associated workflow. In a real scenario,
    # there might be logic to select a specific workflow.
    agent_workflows = (
        (
            await db.execute(
                select(Workflow).join(Agent.workflows).where(Agent.id == agent.id)
            )
        )
        .scalars()
        .all()
    )
    if not agent_workflows:
        raise HTTPException(
            status_code=404, detail="Agent has no workflows associated."
        )

    selected_workflow = agent_workflows[0]  # Pick the first one

    # Check and mark Twilio credential as in use
    if not await credential_service.mark_credential_in_use(
        twilio_credential_model.id, chat_session.id
    ):  # Using chat_session.id as a temporary run_id
        raise HTTPException(
            status_code=409, detail="Twilio credential is currently in use."
        )

    workflow_run_create = WorkflowRunCreate(
        agent_id=agent.id,
        workflow_id=selected_workflow.id,
        chat_session_id=chat_session.id,
        lead_id=lead.id,
        credential_id=twilio_credential_model.id,
        user_id=agent.user_id,  # Added user_id
        status=WorkflowRunStatus.IN_PROGRESS,
        initial_data={
            "from_number": from_number,
            "to_number": to_number,
            "user_message": incoming_message,
        },
    )
    workflow_run = await workflow_run_crud.create_workflow_run(
        workflow_run_data=workflow_run_create
    )

    agent_response = await agent_workflow_service.execute_workflow(
        workflow_run_id=workflow_run.id,
        user_message=incoming_message,
    )

    # Mark credential as available after workflow execution (or handle in agent_workflow_service)
    await credential_service.mark_credential_available(
        twilio_credential_model.id, workflow_run.id
    )

    await message_crud.create_message(
        MessageCreate(
            chat_session_id=chat_session.id, role="agent", content=agent_response
        )
    )

    twiml_response = f"<Response><Message>{agent_response}</Message></Response>"
    return Response(content=twiml_response, media_type="application/xml")


@router.post("/lead/{client_id}")
async def lead_intake_webhook(
    client_id: str,
    request: Request,
    credential_service: CredentialServiceDep,
    lead_crud: LeadCRUDDep,
    workflow_run_crud: WorkflowRunCRUDDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    db: AsyncSession = Depends(get_db),
):
    lead_webhook_secret = await credential_service.get_webhook_secret(
        client_id, "lead_webhook_secret"
    )

    if not lead_webhook_secret:
        raise HTTPException(
            status_code=403,
            detail="Lead webhook secret not configured for this client.",
        )

    body = await request.body()

    x_signature = request.headers.get("X-Signature")
    if not x_signature:
        raise HTTPException(status_code=403, detail="X-Signature header missing.")

    expected_signature = hmac.new(
        lead_webhook_secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_signature):
        raise HTTPException(status_code=403, detail="Invalid lead webhook signature.")

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

    mapped_lead_data = {}
    for webhook_field, lead_field in lead_mapping_config.get("field_map", {}).items():
        if webhook_field in webhook_data:
            mapped_lead_data[lead_field] = webhook_data[webhook_field]

    mapped_lead_data.update(lead_mapping_config.get("default_values", {}))

    try:
        # Assuming user_id, agent_id, chat_session_id are available or can be derived
        # For now, using placeholders or deriving from client_id if possible
        # This part needs careful consideration based on how leads are associated
        # with users/agents/chat_sessions from external webhooks.
        # For demonstration, let's assume we can get agent_id from client_id and user_id from agent.
        agent_stmt = select(Agent).where(Agent.id == client_id)
        agent = (await db.execute(agent_stmt)).scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=404, detail="Agent not found for client_id."
            )

        lead_create = LeadCreate(**mapped_lead_data)
        new_lead = await lead_crud.create_lead(
            lead=lead_create,
            user_id=agent.user_id,
            agent_id=agent.id,
            chat_session_id=None,  # No chat session for direct lead intake
        )

        # --- Workflow Selection and WorkflowRun Creation for Lead Intake ---
        # For simplicity, pick the first associated workflow.
        agent_workflows = (
            (
                await db.execute(
                    select(Workflow).join(Agent.workflows).where(Agent.id == agent.id)
                )
            )
            .scalars()
            .all()
        )
        if not agent_workflows:
            raise HTTPException(
                status_code=404,
                detail="Agent has no workflows associated for lead intake.",
            )

        selected_workflow = agent_workflows[0]  # Pick the first one

        workflow_run_create = WorkflowRunCreate(
            agent_id=agent.id,
            workflow_id=selected_workflow.id,
            lead_id=new_lead.id,
            user_id=agent.user_id,  # Added user_id
            status=WorkflowRunStatus.IN_PROGRESS,
            initial_data=webhook_data,  # Store the raw webhook data as initial data
        )
        workflow_run = await workflow_run_crud.create_workflow_run(
            workflow_run_data=workflow_run_create
        )

        # Initiate workflow execution (e.g., for lead qualification)
        # The user_message here could be a generic trigger or derived from the lead data
        await agent_workflow_service.execute_workflow(
            workflow_run_id=workflow_run.id,
            user_message="Lead received via webhook. Initiate qualification workflow.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid lead data after mapping: {e}"
        )

    return {
        "message": f"Lead webhook received and mapped for client {client_id}",
        "lead_data": mapped_lead_data,
        "new_lead_id": new_lead.id if new_lead else None,
    }


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_service: StripeServiceDep,  # Added StripeServiceDep
    db: AsyncSession = Depends(get_db),  # Added db dependency
):
    stripe_webhook_secret = settings.stripe_webhook_secret

    if not stripe_webhook_secret:
        raise HTTPException(
            status_code=500,
            detail="Stripe webhook secret not configured in application settings.",
        )

    body = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=403, detail="Stripe-Signature header missing.")

    try:
        event = stripe.Webhook.construct_event(
            payload=body, sig_header=sig_header, secret=stripe_webhook_secret
        )
        logger.info(f"Stripe webhook event received: {event}")  # Added logging
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")
    except stripe.SignatureVerificationError as e:
        raise HTTPException(status_code=403, detail=f"Invalid signature: {e}")

    if event["type"] == "customer.subscription.created":
        # TODO: Handle subscription creation
        print(f"Subscription created: {event['data']['object']}")
    elif event["type"] == "customer.subscription.updated":
        # TODO: Handle subscription update
        print(f"Subscription updated: {event['data']['object']}")
    elif event["type"] == "customer.subscription.deleted":
        # TODO: Handle subscription cancellation
        print(f"Subscription deleted: {event['data']['object']}")
    elif event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        logger.info(f"Checkout session completed: {session}")
        await stripe_service.handle_checkout_session_completed(session, db)
    else:
        print(f"Unhandled event type: {event['type']}")

    return {"status": "success"}
