from typing import Any, Dict

from pydantic import BaseModel


class RelevantChunk(BaseModel):
    document: str
    metadata: Dict[str, Any]
