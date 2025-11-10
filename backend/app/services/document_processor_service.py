from io import BytesIO

from chromadb.api import ClientAPI
from chromadb.utils import embedding_functions
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from backend.app.config import settings
from backend.app.services.ai_service import AIService


class DocumentProcessorService:
    def __init__(
        self,
        ai_service: AIService,
        chroma_client: ClientAPI,
        embedding_model: str = settings.embedding_model,
    ):
        self.ai_service: AIService = ai_service
        self.chroma_client: ClientAPI = chroma_client
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key, model_name=embedding_model
        )

    async def process_document(
        self,
        document_content: bytes,
        document_id: str,
        user_id: str,
        agent_id: str | None = None,
        collection_name: str = "knowledge_base",
    ):
        text_content: str
        # Attempt to decode as UTF-8 first, if it fails, assume PDF
        try:
            text_content = document_content.decode("utf-8")
        except UnicodeDecodeError:
            # If UTF-8 decoding fails, assume it's a PDF
            try:
                pdf_reader = PdfReader(BytesIO(document_content))
                text_content = ""
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
            except PdfReadError:
                raise ValueError(
                    f"Could not process document {document_id}: Not a valid UTF-8 text or PDF file."
                )
            except Exception as e:
                raise ValueError(
                    f"An unexpected error occurred during PDF processing for document {document_id}: {e}"
                )
        except Exception as e:
            raise ValueError(
                f"An unexpected error occurred while processing document {document_id}: {e}"
            )

        chunks = [
            chunk.strip() for chunk in text_content.split("\n\n") if chunk.strip()
        ]

        embeddings = self.embedding_function.embed_query(chunks)

        collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_function,
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
