import hashlib
import hmac
import json
import logging

import stripe
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select
from starlette.responses import Response
from twilio.request_validator import RequestValidator

from backend.app.config import logger, settings
from backend.app.dependencies import (
    AdminCommandHandlerDep,
    AdminMessageEvaluatorDep,
    AgentWorkflowServiceDep,
    ChatSessionCRUDDep,
    CredentialServiceDep,
    DBSession,
    LeadCRUDDep,
    MessageCRUDDep,
    MessageRouterDep,
    StripeServiceDep,
    WorkflowRunCRUDDep,
)
from backend.app.models.agent import Agent
from backend.app.models.credential import Credential
from backend.app.models.user import User
from backend.app.models.workflow import Workflow
from backend.app.models.workflow_run import WorkflowRun
from backend.app.schemas.chat_session import ChatSessionCreate
from backend.app.schemas.enums import WorkflowRunStatus
from backend.app.schemas.lead import LeadCreate
from backend.app.schemas.message import MessageCreate
from backend.app.schemas.workflow_run import WorkflowRunCreate

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger.setLevel(logging.DEBUG)


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


async def _process_twilio_webhook(
    request: Request,
    channel: str,
    credential_service: CredentialServiceDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    chat_session_crud: ChatSessionCRUDDep,
    lead_crud: LeadCRUDDep,
    message_crud: MessageCRUDDep,
    workflow_run_crud: WorkflowRunCRUDDep,
    admin_message_evaluator: AdminMessageEvaluatorDep,
    message_router: MessageRouterDep,
    db: DBSession,
    admin_handler: AdminCommandHandlerDep,
):
    form_params = await request.form()
    logger.info(f"Twilio {channel} webhook received: {form_params}")
    form_params_dict = {key: value for key, value in form_params.items()}

    to_number = form_params_dict.get("To")
    from_number = form_params_dict.get("From")
    incoming_message = form_params_dict.get("Body")

    if not to_number or not from_number or not incoming_message:
        raise HTTPException(
            status_code=400,
            detail="Missing 'To', 'From', or 'Body' field in webhook data.",
        )

    # Clean up identifier based on channel prefix
    identifier = str(to_number)
    if channel == "whatsapp":
        identifier = identifier.replace("whatsapp:", "")
    elif channel == "facebook":
        identifier = identifier.replace("messenger:", "")
    elif channel == "instagram":
        identifier = identifier.replace("instagram:", "")

    # Find the credential
    credential_stmt = select(Credential).where(
        Credential.credential_type == "twilio",
        Credential.identifier == identifier,
        Credential.channel == channel,
    )
    credential = (await db.execute(credential_stmt)).scalar_one_or_none()

    logger.info(f"Credential found: {credential}")
    # Fallback for backward compatibility (if channel is null/default) or if user hasn't migrated yet
    if not credential and channel == "whatsapp":
        credential_stmt = select(Credential).where(
            Credential.credential_type == "twilio",
            Credential.identifier == identifier,
        )
        credential = (await db.execute(credential_stmt)).scalar_one_or_none()

    logger.info(f"Credential found via fallback: {credential}")
    if not credential:
        raise HTTPException(
            status_code=404,
            detail=f"No credential found for {channel} identifier: {identifier}",
        )

    # TEMPORARY: Fetch user for admin checks early
    # In a proper setup, this user would be passed with the credential
    user_stmt = select(User).where(User.id == credential.user_id)
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found for credential.")

    # --- Admin Command Evaluation ---
    is_admin_command = await admin_message_evaluator.evaluate_message(
        from_number=from_number, message_body=incoming_message, user=user
    )

    # --- Message Routing ---
    if is_admin_command:
        admin_response = await admin_handler.handle_command(
            incoming_message, from_number, user
        )
        # admin_response = await message_router.route_message(
        #     from_number=from_number,
        #     message_body=incoming_message,
        #     is_admin_command=True,
        #     workflow_run=None,
        #     user=user,
        #     credential_service=credential_service,
        # )
        twiml_response = f"<Response><Message>{admin_response}</Message></Response>"
        return Response(content=twiml_response, media_type="application/xml")

    # If not an admin command, proceed with normal workflow processing
    # Enforce the new routing architecture: Find an active WorkflowRun for this Credential
    workflow_run_stmt = (
        select(WorkflowRun)
        .where(
            WorkflowRun.credential_id == credential.id,
            WorkflowRun.status == WorkflowRunStatus.IN_PROGRESS.value,
        )
        .order_by(WorkflowRun.updated_at.desc())
        .limit(1)
    )
    workflow_run = (await db.execute(workflow_run_stmt)).scalar_one_or_none()

    if not workflow_run:
        # No active run found - try to clone from default template
        logger.info(
            f"No active run found for credential {credential.id}. Looking for default template..."
        )

        # First, get the agent for this credential
        agent_stmt = select(Agent).where(Agent.user_id == credential.user_id)
        agent = (await db.execute(agent_stmt)).scalar_one_or_none()

        if not agent:
            raise HTTPException(
                status_code=404,
                detail=f"No agent found for user associated with credential {identifier}",
            )

        # Look for a template run for this agent
        template_stmt = (
            select(WorkflowRun)
            .where(
                WorkflowRun.agent_id == agent.id,
                WorkflowRun.user_id == credential.user_id,
                WorkflowRun.is_template,
            )
            .limit(1)
        )
        template_run = (await db.execute(template_stmt)).scalar_one_or_none()

        if template_run:
            # Clone the template run
            logger.info(f"Found template run {template_run.id}. Cloning...")
            workflow_run_data = WorkflowRunCreate(
                agent_id=template_run.agent_id,
                workflow_id=template_run.workflow_id,
                user_id=template_run.user_id,
                credential_id=credential.id,
                status=WorkflowRunStatus.IN_PROGRESS,
                initial_data=template_run.initial_data or {},
            )
            workflow_run = await workflow_run_crud.create_workflow_run(
                workflow_run_data
            )
            logger.info(f"Created new run {workflow_run.id} from template")
        else:
            # Fallback: create from agent's first workflow
            logger.info("No template found. Creating from agent's first workflow...")
            agent_workflows_stmt = (
                select(Workflow).join(Agent.workflows).where(Agent.id == agent.id)
            )
            agent_workflows = (await db.execute(agent_workflows_stmt)).scalars().all()

            if not agent_workflows:
                raise HTTPException(
                    status_code=404,
                    detail=f"Agent {agent.id} has no workflows configured",
                )

            # Create new run from first workflow
            workflow_run_data = WorkflowRunCreate(
                agent_id=agent.id,
                workflow_id=agent_workflows[0].id,
                user_id=credential.user_id,
                credential_id=credential.id,
                status=WorkflowRunStatus.IN_PROGRESS,
                initial_data={},
            )
            workflow_run = await workflow_run_crud.create_workflow_run(
                workflow_run_data
            )
            logger.info(f"Created new run {workflow_run.id} from first workflow")

    # Get the decrypted credential data to extract twilio_auth_token
    twilio_credential_data = await credential_service.get_decrypted_credential_data(
        credential
    )
    if not twilio_credential_data:
        raise HTTPException(
            status_code=403,
            detail="Twilio credentials data could not be decrypted.",
        )

    twilio_auth_token = twilio_credential_data.get("twilio_auth_token")
    if not twilio_auth_token:
        raise HTTPException(
            status_code=403,
            detail="Twilio auth token not found in credential data.",
        )

    validator = RequestValidator(twilio_auth_token)
    request_url = str(request.url)
    # Handle reverse proxy/tunnel case where app sees http but Twilio sent https
    forwarded_proto = request.headers.get("x-forwarded-proto")
    forwarded_port = request.headers.get("x-forwarded-port")
    if (
        forwarded_proto == "https" or forwarded_port == "443"
    ) and request_url.startswith("http://"):
        request_url = request_url.replace("http://", "https://", 1)

    x_twilio_signature = request.headers.get("x-twilio-signature")
    if not x_twilio_signature or not validator.validate(
        request_url, form_params_dict, x_twilio_signature
    ):
        raise HTTPException(
            status_code=403, detail=f"Invalid Twilio signature. {x_twilio_signature}"
        )

    incoming_message = form_params_dict.get("Body")

    if not incoming_message or not from_number:
        raise HTTPException(status_code=400, detail="Missing message body or sender.")

    # Ensure ChatSession exists for this run
    if not workflow_run.chat_session_id:
        chat_session_create = ChatSessionCreate(
            user_id=workflow_run.user_id,
            agent_id=workflow_run.agent_id,
            external_id=from_number,
        )
        chat_session = await chat_session_crud.create_chat_session(chat_session_create)
        workflow_run.chat_session_id = chat_session.id
        await db.flush()
    else:
        chat_session = await chat_session_crud.get_chat_session(
            workflow_run.chat_session_id
        )
        if not chat_session:
            chat_session_create = ChatSessionCreate(
                user_id=workflow_run.user_id,
                agent_id=workflow_run.agent_id,
                external_id=from_number,
            )
            chat_session = await chat_session_crud.create_chat_session(
                chat_session_create
            )
            workflow_run.chat_session_id = chat_session.id
            await db.flush()

    if not workflow_run.lead_id:
        lead = await lead_crud.get_lead_by_chat_session_id(chat_session.id)
        if not lead:
            profile_name = form_params_dict.get("ProfileName")
            lead_name = profile_name if profile_name else from_number

            lead_create = LeadCreate(
                name=lead_name,
                contact_info={"phone": from_number, "channel": channel},
                qualification_status="new",
                source=channel,
            )
            lead = await lead_crud.create_lead(
                lead=lead_create,
                user_id=workflow_run.user_id,
                agent_id=workflow_run.agent_id,
                chat_session_id=chat_session.id,
            )
        workflow_run.lead_id = lead.id
        await db.flush()

    await message_crud.create_message(
        MessageCreate(
            chat_session_id=chat_session.id, role="user", content=incoming_message
        )
    )

    agent_response = await agent_workflow_service.execute_workflow(
        workflow_run_id=workflow_run.id,
        user_message=incoming_message,
        send_response=False,
    )

    await message_crud.create_message(
        MessageCreate(
            chat_session_id=chat_session.id, role="agent", content=agent_response
        )
    )

    twiml_response = f"<Response><Message>{agent_response}</Message></Response>"
    return Response(content=twiml_response, media_type="application/xml")


@router.post("/twilio")
async def twilio_whatsapp_webhook(
    request: Request,
    credential_service: CredentialServiceDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    chat_session_crud: ChatSessionCRUDDep,
    lead_crud: LeadCRUDDep,
    message_crud: MessageCRUDDep,
    workflow_run_crud: WorkflowRunCRUDDep,
    admin_message_evaluator: AdminMessageEvaluatorDep,
    message_router: MessageRouterDep,
    db: DBSession,
    admin_handler: AdminCommandHandlerDep,
):
    return await _process_twilio_webhook(
        request=request,
        channel="whatsapp",
        credential_service=credential_service,
        agent_workflow_service=agent_workflow_service,
        chat_session_crud=chat_session_crud,
        lead_crud=lead_crud,
        message_crud=message_crud,
        workflow_run_crud=workflow_run_crud,
        admin_message_evaluator=admin_message_evaluator,
        message_router=message_router,
        db=db,
        admin_handler=admin_handler,
    )


@router.post("/twilio/facebook")
async def twilio_facebook_webhook(
    request: Request,
    credential_service: CredentialServiceDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    chat_session_crud: ChatSessionCRUDDep,
    lead_crud: LeadCRUDDep,
    message_crud: MessageCRUDDep,
    workflow_run_crud: WorkflowRunCRUDDep,
    admin_message_evaluator: AdminMessageEvaluatorDep,
    message_router: MessageRouterDep,
    db: DBSession,
    admin_handler: AdminCommandHandlerDep,
):
    return await _process_twilio_webhook(
        request=request,
        channel="facebook",
        credential_service=credential_service,
        agent_workflow_service=agent_workflow_service,
        chat_session_crud=chat_session_crud,
        lead_crud=lead_crud,
        message_crud=message_crud,
        workflow_run_crud=workflow_run_crud,
        admin_message_evaluator=admin_message_evaluator,
        message_router=message_router,
        db=db,
        admin_handler=admin_handler,
    )


@router.post("/twilio/instagram")
async def twilio_instagram_webhook(
    request: Request,
    credential_service: CredentialServiceDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    chat_session_crud: ChatSessionCRUDDep,
    lead_crud: LeadCRUDDep,
    message_crud: MessageCRUDDep,
    workflow_run_crud: WorkflowRunCRUDDep,
    admin_message_evaluator: AdminMessageEvaluatorDep,
    message_router: MessageRouterDep,
    db: DBSession,
    admin_handler: AdminCommandHandlerDep,
):
    return await _process_twilio_webhook(
        request=request,
        channel="instagram",
        credential_service=credential_service,
        agent_workflow_service=agent_workflow_service,
        chat_session_crud=chat_session_crud,
        lead_crud=lead_crud,
        message_crud=message_crud,
        workflow_run_crud=workflow_run_crud,
        admin_message_evaluator=admin_message_evaluator,
        message_router=message_router,
        db=db,
        admin_handler=admin_handler,
    )


@router.post("/lead/{client_id}")
async def lead_intake_webhook(
    client_id: str,
    request: Request,
    credential_service: CredentialServiceDep,
    lead_crud: LeadCRUDDep,
    workflow_run_crud: WorkflowRunCRUDDep,
    agent_workflow_service: AgentWorkflowServiceDep,
    db: DBSession,
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
            chat_session_id=None,
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
            user_id=agent.user_id,
            status=WorkflowRunStatus.IN_PROGRESS,
            initial_data=webhook_data,
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
    stripe_service: StripeServiceDep,
    db: DBSession,
):
    logger.info(f"Stripe webhook received. Method: {request.method}")
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
        logger.info(f"Stripe webhook event received: {event}")
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
