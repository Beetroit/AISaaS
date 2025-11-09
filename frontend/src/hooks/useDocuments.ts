import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadDocument, removeDocument, getDocuments } from "../lib/api/documents";
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
      queryClient.invalidateQueries({ queryKey: ["documents"] }); // Invalidate to refetch list
      console.log("Documents uploaded successfully.");
    },
  });
}

export function useRemoveDocument() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (documentId: string) => removeDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] }); // Invalidate to refetch list
      console.log("Document removed successfully.");
    },
  });
}
