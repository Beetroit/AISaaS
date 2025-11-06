import hashlib
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from backend.app.dependencies import (
    get_document_processor_service,
    get_knowledge_base_document_crud,
    get_current_user,
)
from backend.app.models.user import User
from backend.app.schemas.knowledge_base_document import KnowledgeBaseDocumentCreate

from backend.app.services.document_processor_service import DocumentProcessorService
from backend.app.crud.knowledge_base_document_crud import KnowledgeBaseDocumentCRUD

router = APIRouter()


@router.post("/upload-document/")
async def upload_document(
    current_user: User = Depends(get_current_user),
    knowledge_base_document_crud: KnowledgeBaseDocumentCRUD = Depends(
        get_knowledge_base_document_crud
    ),
    document_processor_service: DocumentProcessorService = Depends(
        get_document_processor_service
    ),
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

        # Check if document with same hash already exists for this user
        existing_doc = await knowledge_base_document_crud.get_knowledge_base_document_by_content_hash_and_user_id(
            content_hash, current_user.id
        )
        if existing_doc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Document {file.filename} already exists for this user.",
            )

        # Create metadata entry in PostgreSQL
        doc_create = KnowledgeBaseDocumentCreate(
            filename=file.filename,
            content_hash=content_hash,
            user_id=current_user.id,
            agent_id=None,  # Agent association will be handled later
        )
        db_doc = await knowledge_base_document_crud.create_knowledge_base_document(
            doc_create
        )

        # Process and store embeddings in ChromaDB
        await document_processor_service.process_document(
            document_content=content.decode("utf-8"),  # Assuming text content
            document_id=db_doc.id,
            user_id=current_user.id,
            agent_id=None,  # Agent association will be handled later
        )
        uploaded_filenames.append(file.filename)

    return {
        "message": "Documents uploaded successfully",
        "filenames": uploaded_filenames,
        "user_id": current_user.id,
    }


@router.delete("/remove-document/{document_id}")
async def remove_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    knowledge_base_document_crud: KnowledgeBaseDocumentCRUD = Depends(
        get_knowledge_base_document_crud
    ),
    document_processor_service: DocumentProcessorService = Depends(
        get_document_processor_service
    ),
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

    # Delete embeddings from ChromaDB
    await document_processor_service.delete_document_embeddings(
        document_id, current_user.id
    )

    # Delete metadata from PostgreSQL
    await knowledge_base_document_crud.delete_knowledge_base_document(db_doc)

    return {"message": f"Document {document_id} removed successfully."}
