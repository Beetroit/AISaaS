from typing import Any, Dict, Optional
from backend.app.services.workflow_actions.base import BaseAction


class LeadExtractionAction(BaseAction):
    type = "lead_extraction"
    name = "Lead Extraction"
    description = "Extracts lead information from user messages."
    inputs = {"user_message": "string"}
    outputs = {"extracted_lead_data": "object", "follow_up_question": "string"}

    async def execute(
        self,
        context: Dict[str, Any],
        node_data: Dict[str, Any],
        knowledge_base_document_ids: Optional[list[str]] = None,
    ) -> Dict[str, Any]:
        # The actual lead extraction logic is handled by AgentWorkflowService.
        # This action primarily defines the node's interface and type.
        # It can optionally pass through relevant context data.
        return {"extracted_lead_data": {}, "follow_up_question": None}
