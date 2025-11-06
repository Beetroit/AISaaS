from typing import List

from chromadb.api import ClientAPI
from chromadb.utils import embedding_functions

from backend.app.config import settings
from backend.app.schemas.retrieval import RelevantChunk
from backend.app.services.ai_service import AIService


class RetrievalService:
    def __init__(
        self,
        ai_service: AIService,
        chroma_client: ClientAPI,
        embedding_model: str = settings.gpt5_mini_model,
    ):
        self.ai_service = ai_service
        self.chroma_client = chroma_client
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key, model_name=embedding_model
        )

    async def retrieve_relevant_chunks(
        self,
        query: str,
        user_id: str,
        agent_id: str | None = None,
        n_results: int = 5,
        collection_name: str = "knowledge_base",
    ) -> List[RelevantChunk]:
        # 1. Generate embedding for the query
        query_embedding = self.embedding_function.embed_query(query)

        # 2. Query ChromaDB
        collection = self.chroma_client.get_or_create_collection(
            name=collection_name, embedding_function=self.embedding_function
        )

        where_clause = {"user_id": user_id}
        if agent_id:
            where_clause["agent_id"] = agent_id

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_clause,
            include=["documents", "metadatas"],
        )

        # Format results
        relevant_chunks = []
        if results and results["documents"] and results["metadatas"]:
            for i in range(len(results["documents"][0])):
                relevant_chunks.append(
                    RelevantChunk(
                        document=results["documents"][0][i],
                        metadata=results["metadatas"][0][i],
                    )
                )
        return relevant_chunks
