import asyncio
from typing import Any, Dict, List, Literal, Optional, Union

from openai import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    AsyncOpenAI,
    AsyncStream,
    RateLimitError,
)
from openai.lib.streaming.responses import ResponseStreamEvent
from openai.types.responses import FunctionToolParam, Response

from backend.app.config import logger, settings


class OpenAIService:
    """Service for interacting with the OpenAI GPT-5 Responses API."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=60.0)
        self.max_retries = 3
        self.retry_delay = 1.0

    async def create_gpt5_response(
        self,
        input: Union[str, List[Dict[str, Any]]],
        model: str = settings.gpt5_mini_model,
        system_prompt: Optional[str] = None,
        context_documents: Optional[List[str]] = None,
        previous_response_id: Optional[str] = None,
        reasoning_effort: Optional[
            Literal["minimal", "low", "medium", "high"]
        ] = "minimal",
        text_verbosity: Optional[Literal["low", "medium", "high"]] = "low",
        text_format: Optional[Dict] = None,
        tools: Optional[List[Dict]] = None,
        tool_choice: str = "auto",
        max_output_tokens: Optional[int] = 3000,
        stream: bool = False,
        parallel_tool_calls: bool = False,
    ):
        """
        Generates a response using the OpenAI GPT-5 Responses API.

        Args:
            input: The main input message for the model.
            model: The GPT-5 model to use (e.g., "gpt-5", "gpt-5-mini", "gpt-5-nano").
            system_prompt: An optional system prompt to guide the model's behavior.
            context_documents: Optional list of relevant document chunks to provide as context.
            previous_response_id: ID of a previous response for Chain of Thought (CoT).
            reasoning_effort: Controls how many reasoning tokens the model generates.
            text_verbosity: Controls how many output tokens are generated.
            text_format: For structured outputs like JSON schema.
            tools: A list of tool definitions the model can use.
            tool_choice: Controls how the model uses tools.
            max_output_tokens: The maximum number of output tokens to generate.

        Returns:
            The response object from the OpenAI API.

        Raises:
            Exception: If response generation fails after retries.
        """
        full_input = input
        if context_documents:
            context_str = "\n\n".join(context_documents)
            full_input = f"Context:\n{context_str}\n\nUser Query: {input}"

        payload = {
            "model": model,
            "store": False,
            "stream": stream,
            "parallel_tool_calls": parallel_tool_calls,
        }

        if previous_response_id:
            payload["previous_response_id"] = previous_response_id
        if reasoning_effort:
            payload["reasoning"] = {"effort": reasoning_effort}
        if text_verbosity:
            payload["text"] = {"verbosity": text_verbosity}
        if text_format:
            if "text" not in payload:
                payload["text"] = {}
            payload["text"]["format"] = text_format
        if tool_choice:
            payload["tool_choice"] = tool_choice
        if max_output_tokens:
            payload["max_output_tokens"] = max_output_tokens
        logger.debug(f"OpenAI API payload: {payload}")
        if tools:
            converted_tools = self._convert_tools_to_gpt5_format(tools)
            payload["tools"] = converted_tools
        if system_prompt:
            payload["instructions"] = system_prompt
        payload["input"] = full_input
        logger.debug(f"Input: {full_input[:50]}...")
        for attempt in range(self.max_retries):
            try:
                response: (
                    Response | AsyncStream[ResponseStreamEvent]
                ) = await self.client.responses.create(**payload)
                logger.info(
                    f"Successfully generated GPT-5 response for input: {full_input[:50]}..."
                )
                return response
            except RateLimitError as e:
                logger.warning(f"Rate limit hit on attempt {attempt + 1}: {e}")
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2**attempt)  # Exponential backoff
                    await asyncio.sleep(delay)
                    continue
                raise
            except APITimeoutError as e:
                logger.warning(f"API timeout on attempt {attempt + 1}: {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay)
                    continue
                raise
            except APIConnectionError as e:
                logger.warning(f"Connection error on attempt {attempt + 1}: {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay)
                    continue
                raise
            except APIError as e:
                logger.error(f"OpenAI API error on attempt {attempt + 1}: {e}")
                # Safely check e.code before converting to int
                if (
                    attempt < self.max_retries - 1
                    and hasattr(e, "code")
                    and isinstance(e.code, str)
                    and e.code.isdigit()
                    and int(e.code) >= 500
                ):
                    await asyncio.sleep(self.retry_delay)
                    continue
                raise
            except Exception as e:
                logger.error(f"Unexpected error generating GPT-5 response: {e}")
                raise

        raise Exception("Failed to generate GPT-5 response after all retries")

    async def generate_response(
        self,
        prompt: str,
        model: str = settings.gpt5_mini_model,
        system_prompt: Optional[str] = None,
        context_documents: Optional[List[str]] = None,
        **kwargs,
    ) -> tuple[str, list]:
        response = await self.create_gpt5_response(
            input=prompt,
            model=model,
            system_prompt=system_prompt,
            context_documents=context_documents,
            stream=False,
            **kwargs,
        )
        if isinstance(response, AsyncStream):
            raise TypeError("Expected a non-streaming response, but received a stream.")

        # Extract tool calls from response.output
        tool_calls = []
        for item in response.output:
            if hasattr(item, "type") and item.type == "function_call":
                # Parse the arguments JSON
                import json

                try:
                    arguments = json.loads(item.arguments)
                    tool_calls.append({"name": item.name, "arguments": arguments})
                except (json.JSONDecodeError, AttributeError):
                    continue

        return response.output_text, tool_calls

    def _convert_tools_to_gpt5_format(
        self, tools: List[Dict]
    ) -> List[FunctionToolParam]:
        """
        Converts tool definitions from old Chat Completions format to new GPT-5 Responses API format.
        Handles both single and multiple tool definitions.
        """
        converted_tools = []
        for tool in tools:
            if "function" in tool and "type" in tool and tool["type"] == "function":
                # Old format: {'type': 'function', 'function': {'name': '...', ...}}
                converted_tools.append(
                    {
                        "type": "function",
                        "name": tool["function"]["name"],
                        "description": tool["function"].get("description"),
                        "parameters": tool["function"].get("parameters"),
                        "strict": tool["function"].get("strict", True),
                    }
                )
            else:
                # Assume it's already in the new format or a custom tool
                converted_tools.append(tool)
        return [FunctionToolParam(**tool) for tool in converted_tools]
