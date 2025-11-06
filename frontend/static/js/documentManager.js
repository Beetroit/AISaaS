import { api } from "./api.js";

export async function fetchDocuments(agentId, documentListElement) {
    try {
        const documents = await api.fetchDocuments(agentId);
        documentListElement.innerHTML = ""; // Clear existing list
        if (documents.length === 0) {
            documentListElement.innerHTML =
                '<li class="text-gray-500">No documents uploaded yet.</li>';
            return;
        }
        documents.forEach((doc) => {
            const li = document.createElement("li");
            li.className =
                "flex justify-between items-center bg-gray-50 p-2 rounded-md";
            li.innerHTML = `<span>${doc.filename}</span>`;
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.className =
                "ml-4 px-3 py-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition duration-150";
            removeButton.onclick = async () => {
                if (confirm("Are you sure you want to remove this document?")) {
                    await removeDocument(agentId, doc.id, documentListElement);
                }
            };
            li.appendChild(removeButton);
            documentListElement.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to fetch documents:", error);
        documentListElement.innerHTML =
            '<li class="text-red-500">Error loading documents.</li>';
    }
}

export async function uploadDocuments(
    agentId,
    inputElement,
    documentListElement
) {
    const files = inputElement.files;
    if (files.length === 0) {
        alert("Please select files to upload.");
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }

    try {
        await api.uploadDocuments(agentId, formData);
        alert("Documents uploaded successfully!");
        inputElement.value = ""; // Clear input
        fetchDocuments(agentId, documentListElement); // Refresh document list
    } catch (error) {
        alert(`Upload failed: ${error.message}`);
    }
}

async function removeDocument(agentId, documentId, documentListElement) {
    try {
        await api.removeDocument(agentId, documentId);
        alert("Document removed successfully!");
        fetchDocuments(agentId, documentListElement); // Refresh document list
    } catch (error) {
        alert(`Removal failed: ${error.message}`);
    }
}
