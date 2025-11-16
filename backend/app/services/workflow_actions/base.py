from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseAction(ABC):
    """
    Abstract base class for all workflow actions.

    Each action must define its type, name, description, and I/O signature.
    The I/O signature is crucial for validating workflow graphs and for
    providing metadata to the frontend UI.
    """

    type: str
    name: str
    description: str
    inputs: Dict[str, str] = {}
    outputs: Dict[str, str] = {}

    @abstractmethod
    async def execute(
        self,
        context: Dict[str, Any],
        node_data: Dict[str, Any],
        knowledge_base_document_ids: Optional[list[str]] = None,
        # Add other necessary parameters like db_session, services, etc.
    ) -> Dict[str, Any]:
        """
        Executes the action.

        Args:
            context: A dictionary containing the current state of the workflow,
                     including outputs from previous nodes.
            node_data: The specific data associated with this node in the
                       workflow schema (e.g., the question to ask).

        Returns:
            A dictionary containing the outputs of this action, which will be
            merged back into the main workflow context.
        """
        pass

    @classmethod
    def get_schema(cls) -> Dict[str, Any]:
        """Returns the JSON schema for the action."""
        return {
            "type": cls.type,
            "name": cls.name,
            "description": cls.description,
            "inputs": cls.inputs,
            "outputs": cls.outputs,
        }
