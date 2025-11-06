from chromadb.api import ClientAPI
from chromadb.utils import embedding_functions

from backend.app.config import settings
from backend.app.services.ai_service import AIService


class DocumentProcessorService:
    def __init__(
        self,
        ai_service: AIService,
        chroma_client: ClientAPI,
        embedding_model: str = settings.gpt5_mini_model,  # Using a smaller model for embeddings
    ):
        self.ai_service: AIService = ai_service
        self.chroma_client: ClientAPI = chroma_client
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key, model_name=embedding_model
        )

    async def process_document(
        self,
        document_content: str,
        document_id: str,
        user_id: str,
        agent_id: str | None = None,
        collection_name: str = "knowledge_base",
    ):
        # 1. Chunk the text (simple split for now, can be improved)
        chunks = [
            chunk.strip() for chunk in document_content.split("\n\n") if chunk.strip()
        ]

        # 2. Generate embeddings for each chunk
        # Note: OpenAIEmbeddingFunction handles batching internally
        embeddings = self.embedding_function.embed_query(chunks)

        # 3. Store chunks and embeddings in ChromaDB
        collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_function,  # Pass the embedding function to the collection
        )

        metadatas = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "agent_id": agent_id,
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ]
        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]

        collection.add(
            documents=chunks, embeddings=embeddings, metadatas=metadatas, ids=ids
        )

        return len(chunks)

    async def delete_document_embeddings(
        self, document_id: str, user_id: str, collection_name: str = "knowledge_base"
    ) -> None:
        collection = self.chroma_client.get_or_create_collection(
            name=collection_name, embedding_function=self.embedding_function
        )
        collection.delete(where={"document_id": document_id, "user_id": user_id})
