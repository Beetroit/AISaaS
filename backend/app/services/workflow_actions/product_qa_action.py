from typing import Any, Dict, Optional
from backend.app.services.workflow_actions.base import BaseAction


class ProductQAAction(BaseAction):
    type = "product_qa"
    name = "Product Q&A"
    description = "Answers product-related questions using knowledge base."
    inputs = {"user_message": "string"}
    outputs = {"answer": "string"}

    async def execute(
        self,
        context: Dict[str, Any],
        node_data: Dict[str, Any],
        knowledge_base_document_ids: Optional[list[str]] = None,
    ) -> Dict[str, Any]:
        # The actual product Q&A logic is handled by AgentWorkflowService.
        # This action primarily defines the node's interface and type.
        # It can optionally pass through relevant context data.
        return {"answer": "I am processing your product question."}
