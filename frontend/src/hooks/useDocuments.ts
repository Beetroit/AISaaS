import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocuments, processSelectedDocuments, removeDocument, uploadDocument } from "../lib/api/documents";
import { KnowledgeBaseDocumentResponse } from "../types/document";

// --- Queries ---

export function useDocuments() {
  return useQuery<KnowledgeBaseDocumentResponse[], Error>({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });
}

// --- Mutations ---

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; filenames: string[]; user_id: string },
    Error,
    File[]
  >({
    mutationFn: (files: File[]) => uploadDocument(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      console.log("Documents uploaded successfully.");
    },
  });
}

export function useRemoveDocument() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (documentId: string) => removeDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      console.log("Document removed successfully.");
    },
  });
}

export function useProcessDocuments() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; document_ids: string[] }, Error, string[]>({
    mutationFn: (documentIds: string[]) => processSelectedDocuments(documentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      console.log("Documents processing initiated.");
    },
  });
}
