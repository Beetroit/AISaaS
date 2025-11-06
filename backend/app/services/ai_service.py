from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict


class AIService(ABC):
    @abstractmethod
    async def stream_response(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Streams a response from the AI model."""
        pass

    @abstractmethod
    async def generate_response(self, prompt: str, **kwargs) -> str:
        """Generates a single response from the AI model."""
        pass

    @abstractmethod
    async def call_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Calls a specific tool with provided arguments."""
        pass
