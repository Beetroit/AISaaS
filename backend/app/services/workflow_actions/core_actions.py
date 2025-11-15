from typing import Any, Dict
from backend.app.services.workflow_actions.base import BaseAction


class StartAction(BaseAction):
    type = "start"
    name = "Start"
    description = "The entry point of the workflow."
    inputs = {}
    outputs = {"start_data": "any"}

    async def execute(
        self, context: Dict[str, Any], node_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # The start node typically initializes data or simply passes through.
        # For now, it returns an empty dictionary.
        return {"start_data": {}}


class EndAction(BaseAction):
    type = "end"
    name = "End"
    description = "The termination point of the workflow."
    inputs = {"end_data": "any"}
    outputs = {}

    async def execute(
        self, context: Dict[str, Any], node_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # The end node signifies the completion of a workflow path.
        # It might perform cleanup or logging in the future.
        # Returning an empty dict as it produces no new data for other nodes.
        return {}


class AskQuestionAction(BaseAction):
    type = "ask_question"
    name = "Ask a Question"
    description = "Pauses the workflow and asks the user a question."
    inputs = {"context": "any"}
    outputs = {"answer": "string"}

    async def execute(
        self, context: Dict[str, Any], node_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # In the refactored engine, the service will handle the pausing.
        # This action's role is to format the question.
        question = node_data.get("question", "No question configured.")
        # The workflow service will see this output and know to send it to the user.
        return {"question_to_ask": question}
