import { callApi } from "./core";
import { KnowledgeBaseDocumentResponse } from "../../types/document";

export async function getDocuments(): Promise<KnowledgeBaseDocumentResponse[]> {
  return callApi<KnowledgeBaseDocumentResponse[]>("/documents/");
}

export async function uploadDocument(files: File[]): Promise<{ message: string; filenames: string[]; user_id: string }> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  return callApi<{ message: string; filenames: string[]; user_id: string }>(
    "/documents/upload-document/",
    {
      method: "POST",
      body: formData,
      isFormData: true,
    }
  );
}

export async function removeDocument(documentId: string): Promise<{ message: string }> {
  return callApi<{ message: string }>(`/documents/remove-document/${documentId}`, {
    method: "DELETE",
  });
}

export async function processSelectedDocuments(documentIds: string[]): Promise<{ message: string; document_ids: string[] }> {
  return callApi<{ message: string; document_ids: string[] }>(
    "/documents/process-selected/",
    {
      method: "POST",
      body: documentIds,
    }
  );
}
