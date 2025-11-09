import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadDocument, removeDocument } from "../lib/api/documents";
import { KnowledgeBaseDocumentResponse } from "../types/document";

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
      // Invalidate queries that list documents, if any
      // queryClient.invalidateQueries({ queryKey: ["documents"] });
      console.log("Documents uploaded successfully.");
    },
  });
}

export function useRemoveDocument() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (documentId: string) => removeDocument(documentId),
    onSuccess: () => {
      // Invalidate queries that list documents, if any
      // queryClient.invalidateQueries({ queryKey: ["documents"] });
      console.log("Document removed successfully.");
    },
  });
}
