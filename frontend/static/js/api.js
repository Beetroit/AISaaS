const API_BASE_URL = ""; // FastAPI is served from the same origin

async function callApi(
    endpoint,
    method = "GET",
    body = null,
    isFormData = false
) {
    const token = localStorage.getItem("access_token");
    const headers = {};

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (body && !isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const config = {
        method,
        headers: isFormData ? {} : headers,
        body: isFormData ? body : body ? JSON.stringify(body) : null,
    };

    if (isFormData) {
        delete config.headers["Content-Type"]; // Browser sets Content-Type for FormData
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (response.status === 401) {
            // Handle unauthorized - e.g., redirect to login
            console.error("Unauthorized: Token might be expired or invalid.");
            // Optionally, trigger a global logout event or redirect
            // window.location.href = '/login'; // Example redirect
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "API call failed");
        }
        return response.json();
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
}

export const api = {
    login: (email, password) => {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);
        return callApi("/auth/token", "POST", formData, true); // Use true for isFormData
    },
    register: (email, password) =>
        callApi("/auth/register", "POST", { email, password }),
    fetchUserMe: () => callApi("/users/me"),
    fetchDocuments: (agentId) => callApi(`/agents/${agentId}/documents/`), // Assuming agent-specific documents
    uploadDocuments: (agentId, formData) =>
        callApi(
            `/agents/${agentId}/documents/upload-document/`,
            "POST",
            formData,
            true
        ),
    removeDocument: (agentId, documentId) =>
        callApi(
            `/agents/${agentId}/documents/remove-document/${documentId}`,
            "DELETE"
        ),
    googleCalendarAuthorize: () => callApi("/auth/google/authorize"),
    saveTwilioCredentials: (agentId, credentials) =>
        callApi(`/agents/${agentId}/twilio-credentials`, "POST", credentials),
    fetchLeadWebhookUrl: (agentId) =>
        callApi(`/agents/${agentId}/lead-webhook`),
    generateLeadWebhookUrl: (agentId) =>
        callApi(`/agents/${agentId}/lead-webhook`, "POST"),
    fetchAppointments: (agentId) =>
        callApi(`/appointments/?agent_id=${agentId}`),
    fetchLeads: (agentId) => callApi(`/leads/?agent_id=${agentId}`),
    fetchAgentDetails: (agentId) => callApi(`/agents/${agentId}`),
};
