import hashlib
import os
import uuid
from typing import List

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    HTTPException,
    UploadFile,
    status,
)

from backend.app.dependencies import (
    CurrentUser,
    DBSession,
    DocumentProcessorServiceDep,
    KnowledgeBaseDocumentCRUDDep,
)
from backend.app.models.knowledge_base_document import DocumentStatus
from backend.app.schemas.knowledge_base_document import (
    KnowledgeBaseDocumentCreate,
    KnowledgeBaseDocumentResponse,
)

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def _process_document_background(
    document_id: str,
    user_id: str,
    document_processor_service: DocumentProcessorServiceDep,
    knowledge_base_document_crud: KnowledgeBaseDocumentCRUDDep,
    db: DBSession,
):
    """
    Background task to process a document (generate embeddings).
    """
    try:
        db_doc = await knowledge_base_document_crud.get_knowledge_base_document_by_id(
            document_id
        )
        if not db_doc or db_doc.user_id != user_id:
            raise ValueError(
                f"Document {document_id} not found or unauthorized for user {user_id}"
            )

        if not db_doc.file_path:
            raise ValueError(f"Document {document_id} has no file path to process.")

        file_full_path = os.path.join(UPLOAD_DIR, db_doc.file_path)
        if not os.path.exists(file_full_path):
            raise FileNotFoundError(f"File not found at {file_full_path}")

        with open(file_full_path, "rb") as f:
            content_bytes = f.read()

        await document_processor_service.process_document(
            document_content=content_bytes,
            document_id=document_id,
            user_id=user_id,
            agent_id=None,
        )
        await knowledge_base_document_crud.update_document_status(
            document_id, user_id, DocumentStatus.PROCESSED
        )
        await db.commit()
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        try:
            await knowledge_base_document_crud.update_document_status(
                document_id, user_id, DocumentStatus.FAILED
            )
            await db.commit()
        except Exception as commit_e:
            print(
                f"Error updating document status to FAILED for {document_id}: {commit_e}"
            )
    finally:
        await db.close()


@router.get("/", response_model=List[KnowledgeBaseDocumentResponse])
async def get_documents(
    current_user: CurrentUser,
    knowledge_base_document_crud: KnowledgeBaseDocumentCRUDDep,
):
    documents = (
        await knowledge_base_document_crud.get_knowledge_base_documents_by_user_id(
            current_user.id
        )
    )
    return documents


@router.post("/upload-document/")
async def upload_document(
    background_tasks: BackgroundTasks,
    db: DBSession,
    current_user: CurrentUser,
    knowledge_base_document_crud: KnowledgeBaseDocumentCRUDDep,
    document_processor_service: DocumentProcessorServiceDep,
    files: List[UploadFile] = File(...),
):
    uploaded_filenames = []
    for file in files:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Filename not provided."
            )

        content = await file.read()
        content_hash = hashlib.sha256(content).hexdigest()

        existing_doc = await knowledge_base_document_crud.get_knowledge_base_document_by_content_hash_and_user_id(
            content_hash, current_user.id
        )
        if existing_doc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Document {file.filename} already exists for this user.",
            )

        if file.content_type not in ["application/pdf", "text/plain", "text/markdown"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}. Only PDF, plain text, and Markdown are supported.",
            )

        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_full_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_full_path, "wb") as f:
            f.write(content)

        doc_create = KnowledgeBaseDocumentCreate(
            filename=file.filename,
            content_hash=content_hash,
            user_id=current_user.id,
            agent_id=None,
            status=DocumentStatus.UNPROCESSED,
            file_path=unique_filename,
        )
        db_doc = await knowledge_base_document_crud.create_knowledge_base_document(
            doc_create
        )
        await db.refresh(db_doc)

        background_tasks.add_task(
            _process_document_background,
            document_id=db_doc.id,
            user_id=current_user.id,
            document_processor_service=document_processor_service,
            knowledge_base_document_crud=knowledge_base_document_crud,
            db=db,
        )

        uploaded_filenames.append(file.filename)

    return {
        "message": "Documents uploaded successfully. Processing in background.",
        "filenames": uploaded_filenames,
        "user_id": current_user.id,
    }


@router.post("/process-selected/")
async def process_selected_documents(
    document_ids: List[str],
    background_tasks: BackgroundTasks,
    db: DBSession,
    current_user: CurrentUser,
    knowledge_base_document_crud: KnowledgeBaseDocumentCRUDDep,
    document_processor_service: DocumentProcessorServiceDep,
):
    processed_docs = []
    for doc_id in document_ids:
        db_doc = await knowledge_base_document_crud.get_knowledge_base_document_by_id(
            doc_id
        )

        if not db_doc:
            print(f"Document {doc_id} not found.")
            continue
        if db_doc.user_id != current_user.id:
            print(
                f"User {current_user.id} not authorized to process document {doc_id}."
            )
            continue
        if db_doc.status == DocumentStatus.PROCESSING:
            print(f"Document {doc_id} is already processing.")
            continue
        if db_doc.status == DocumentStatus.PROCESSED:
            print(f"Document {doc_id} is already processed.")
            continue
        if not db_doc.file_path:
            print(f"Document {doc_id} has no file path to process.")
            await knowledge_base_document_crud.update_document_status(
                doc_id, current_user.id, DocumentStatus.FAILED
            )
            await db.commit()
            continue

        await knowledge_base_document_crud.update_document_status(
            doc_id, current_user.id, DocumentStatus.PROCESSING
        )
        await db.refresh(db_doc)

        background_tasks.add_task(
            _process_document_background,
            document_id=db_doc.id,
            user_id=current_user.id,
            document_processor_service=document_processor_service,
            knowledge_base_document_crud=knowledge_base_document_crud,
            db=db,
        )
        processed_docs.append(doc_id)

    return {
        "message": "Documents processing initiated for selected documents.",
        "document_ids": processed_docs,
    }


@router.delete("/remove-document/{document_id}")
async def remove_document(
    document_id: str,
    current_user: CurrentUser,
    knowledge_base_document_crud: KnowledgeBaseDocumentCRUDDep,
    document_processor_service: DocumentProcessorServiceDep,
):
    db_doc = await knowledge_base_document_crud.get_knowledge_base_document_by_id(
        document_id
    )

    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        )

    if db_doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this document.",
        )

    await document_processor_service.delete_document_embeddings(
        document_id, current_user.id
    )

    if db_doc.file_path:
        file_full_path = os.path.join(UPLOAD_DIR, db_doc.file_path)
        if os.path.exists(file_full_path):
            os.remove(file_full_path)

    await knowledge_base_document_crud.delete_knowledge_base_document(db_doc)

    return {"message": f"Document {document_id} removed successfully."}
