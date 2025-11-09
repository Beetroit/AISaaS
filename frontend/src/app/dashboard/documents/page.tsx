"use client";

import React, { useState } from 'react';
import { useDocuments, useUploadDocument, useRemoveDocument } from '../../../hooks/useDocuments'; // Adjust path as needed

export default function DocumentsPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { data: documents, isLoading: isLoadingDocuments, isError: isErrorDocuments, error: errorDocuments } = useDocuments();
  const uploadDocumentMutation = useUploadDocument();
  const removeDocumentMutation = useRemoveDocument();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length > 0) {
      uploadDocumentMutation.mutate(selectedFiles, {
        onSuccess: (data) => {
          console.log("Upload successful:", data);
          setSelectedFiles([]);
        },
        onError: (error) => {
          console.error("Upload failed:", error.message);
          // TODO: Display user-friendly error message
        },
      });
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      removeDocumentMutation.mutate(documentId, {
        onSuccess: () => {
          console.log(`Document ${documentId} deleted successfully.`);
        },
        onError: (err) => {
          console.error(`Failed to delete document ${documentId}:`, err.message);
          // TODO: Display user-friendly error message
        },
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Documents Management</h2>

      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h3 className="text-xl font-bold mb-2">Upload New Documents</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="document-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select files to upload
            </label>
            <input
              type="file"
              id="document-upload"
              multiple
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-900 dark:text-gray-100
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            disabled={uploadDocumentMutation.isPending || selectedFiles.length === 0}
          >
            {uploadDocumentMutation.isPending ? "Uploading..." : "Upload Documents"}
          </button>
          {uploadDocumentMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              Error: {uploadDocumentMutation.error?.message}
            </p>
          )}
          {uploadDocumentMutation.isSuccess && (
            <p className="text-green-500 text-sm mt-2">
              Documents uploaded successfully!
            </p>
          )}
        </form>
      </div>

      <div className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h3 className="text-xl font-bold mb-2">Uploaded Documents</h3>
        {isLoadingDocuments && <p>Loading documents...</p>}
        {isErrorDocuments && <p className="text-red-500">Error loading documents: {errorDocuments?.message}</p>}
        {documents && documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
              <thead>
                <tr className="w-full bg-gray-200 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-300 uppercase text-sm">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">{doc.filename}</td>
                    <td className="py-3 px-4">{new Date(doc.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                        disabled={removeDocumentMutation.isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoadingDocuments && <p>No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
