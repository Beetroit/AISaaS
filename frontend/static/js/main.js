document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const logoutButton = document.getElementById("logout-button");
    const authContainer = document.getElementById("auth-container");
    const dashboardContainer = document.getElementById("dashboard-container");
    const userEmailSpan = document.getElementById("user-email");
    const documentUploadInput = document.getElementById(
        "document-upload-input"
    );
    const documentUploadButton = document.getElementById(
        "document-upload-button"
    );
    const documentList = document.getElementById("document-list");
    const connectGoogleCalendarButton = document.getElementById(
        "connect-google-calendar-button"
    );
    const leadWebhookUrlDisplay = document.getElementById("lead-webhook-url");
    const generateLeadWebhookButton = document.getElementById(
        "generate-lead-webhook-button"
    );
    const appointmentsList = document.getElementById("appointments-list");
    const leadHistoryList = document.getElementById("lead-history-list");
    const totalMessagesSentSpan = document.getElementById(
        "total-messages-sent"
    );
    const remainingCreditsSpan = document.getElementById("remaining-credits");

    const API_BASE_URL = ""; // FastAPI is served from the same origin

    // Function to check if user is logged in
    function isLoggedIn() {
        return localStorage.getItem("access_token") !== null;
    }

    // Function to update UI based on login status
    function updateUI() {
        if (isLoggedIn()) {
            authContainer.style.display = "none";
            dashboardContainer.style.display = "block";
            fetchUserMe();
            fetchDocuments();
            fetchLeadWebhookUrl();
            fetchAppointments();
            fetchLeadHistory();
            fetchMessageUsage();
        } else {
            authContainer.style.display = "block";
            dashboardContainer.style.display = "none";
        }
    }

    // Fetch user info
    async function fetchUserMe() {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const user = await response.json();
                userEmailSpan.textContent = user.email;
            } else if (response.status === 401) {
                logout();
            } else {
                console.error("Failed to fetch user info");
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        }
    }

    // Fetch and display documents
    async function fetchDocuments() {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/documents/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const documents = await response.json();
                documentList.innerHTML = ""; // Clear existing list
                documents.forEach((doc) => {
                    const li = document.createElement("li");
                    li.textContent = doc.filename;
                    const removeButton = document.createElement("button");
                    removeButton.textContent = "Remove";
                    removeButton.onclick = () => removeDocument(doc.id);
                    li.appendChild(removeButton);
                    documentList.appendChild(li);
                });
            } else {
                console.error("Failed to fetch documents");
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    }

    // Handle document upload
    documentUploadButton.addEventListener("click", async () => {
        const files = documentUploadInput.files;
        if (files.length === 0) {
            alert("Please select files to upload.");
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        const token = localStorage.getItem("access_token");
        if (!token) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/documents/upload-document/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (response.ok) {
                alert("Documents uploaded successfully!");
                documentUploadInput.value = ""; // Clear input
                fetchDocuments(); // Refresh document list
            } else {
                const errorData = await response.json();
                alert(`Upload failed: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error during document upload:", error);
            alert("An error occurred during document upload.");
        }
    });

    // Handle document removal
    async function removeDocument(documentId) {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        if (!confirm("Are you sure you want to remove this document?")) {
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/documents/remove-document/${documentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                alert("Document removed successfully!");
                fetchDocuments(); // Refresh document list
            } else {
                const errorData = await response.json();
                alert(`Removal failed: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error during document removal:", error);
            alert("An error occurred during document removal.");
        }
    }

    // Handle Google Calendar Connection
    connectGoogleCalendarButton.addEventListener("click", async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Please log in to connect Google Calendar.");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/google/authorize`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                // The backend redirects to Google's OAuth consent screen
                // We need to follow that redirect
                window.location.href = response.url;
            } else {
                const errorData = await response.json();
                alert(
                    `Failed to initiate Google Calendar connection: ${errorData.detail}`
                );
            }
        } catch (error) {
            console.error(
                "Error initiating Google Calendar connection:",
                error
            );
            alert("An error occurred while trying to connect Google Calendar.");
        }
    });

    // Handle Twilio Configuration
    const twilioConfigForm = document.getElementById("twilio-config-form");
    twilioConfigForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const sid = e.target.elements["twilio-sid"].value;
        const authToken = e.target.elements["twilio-auth-token"].value;
        const phoneNumber = e.target.elements["twilio-phone-number"].value;

        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Please log in to save Twilio credentials.");
            return;
        }

        // Assuming an agent is selected or a default agent exists for the user
        // For now, we'll use a placeholder agent_id. This needs to be dynamic.
        const agentId = "agt_placeholder_agent_id";

        try {
            const response = await fetch(
                `${API_BASE_URL}/agents/${agentId}/twilio-credentials`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        sid,
                        auth_token: authToken,
                        phone_number: phoneNumber,
                    }),
                }
            );

            if (response.ok) {
                alert("Twilio credentials saved successfully!");
            } else {
                const errorData = await response.json();
                alert(`Failed to save Twilio credentials: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error saving Twilio credentials:", error);
            alert("An error occurred while saving Twilio credentials.");
        }
    });

    // Fetch and display Lead Webhook URL
    async function fetchLeadWebhookUrl() {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Assuming an agent is selected or a default agent exists for the user
        const agentId = "agt_placeholder_agent_id";

        try {
            const response = await fetch(
                `${API_BASE_URL}/agents/${agentId}/lead-webhook`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.ok) {
                const webhookUrl = await response.json();
                leadWebhookUrlDisplay.textContent = `${window.location.origin}${webhookUrl}`;
            } else {
                console.error("Failed to fetch lead webhook URL");
                leadWebhookUrlDisplay.textContent = "Error loading URL.";
            }
        } catch (error) {
            console.error("Error fetching lead webhook URL:", error);
            leadWebhookUrlDisplay.textContent = "Error loading URL.";
        }
    }

    // Handle Generate New Webhook URL
    generateLeadWebhookButton.addEventListener("click", async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Please log in to generate a new webhook URL.");
            return;
        }

        // Assuming an agent is selected or a default agent exists for the user
        const agentId = "agt_placeholder_agent_id";

        try {
            const response = await fetch(
                `${API_BASE_URL}/agents/${agentId}/lead-webhook`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const webhookUrl = await response.json();
                leadWebhookUrlDisplay.textContent = `${window.location.origin}${webhookUrl}`;
                alert("New webhook URL generated successfully!");
            } else {
                const errorData = await response.json();
                alert(
                    `Failed to generate new webhook URL: ${errorData.detail}`
                );
            }
        } catch (error) {
            console.error("Error generating new webhook URL:", error);
            alert("An error occurred while generating a new webhook URL.");
        }
    });

    // Fetch and display appointments
    async function fetchAppointments() {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const agentId = "agt_placeholder_agent_id"; // Placeholder, replace with actual agent ID from user context

        try {
            const response = await fetch(
                `${API_BASE_URL}/appointments/?agent_id=${agentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.ok) {
                const appointments = await response.json();
                appointmentsList.innerHTML = "";
                if (appointments.length === 0) {
                    appointmentsList.innerHTML =
                        "<li>No scheduled appointments.</li>";
                    return;
                }
                appointments.forEach((appt) => {
                    const li = document.createElement("li");
                    li.textContent = `Time: ${new Date(appt.appointment_time).toLocaleString()}, Status: ${appt.status}, Lead: ${appt.lead_id}`;
                    appointmentsList.appendChild(li);
                });
            } else {
                console.error("Failed to fetch appointments");
                appointmentsList.innerHTML =
                    "<li>Error loading appointments.</li>";
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            appointmentsList.innerHTML = "<li>Error loading appointments.</li>";
        }
    }

    // Fetch and display lead history
    async function fetchLeadHistory() {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const agentId = "agt_placeholder_agent_id"; // Placeholder

        try {
            const response = await fetch(
                `${API_BASE_URL}/leads/?agent_id=${agentId}`,
                {
                    // Assuming a /leads/ endpoint exists for fetching leads by agent_id
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.ok) {
                const leads = await response.json();
                leadHistoryList.innerHTML = "";
                if (leads.length === 0) {
                    leadHistoryList.innerHTML = "<li>No lead history.</li>";
                    return;
                }
                leads.forEach((lead) => {
                    const li = document.createElement("li");
                    li.textContent = `ID: ${lead.id}, Status: ${lead.qualification_status}, Contact: ${lead.contact_info?.email || "N/A"}`;
                    leadHistoryList.appendChild(li);
                });
            } else {
                console.error("Failed to fetch lead history");
                leadHistoryList.innerHTML =
                    "<li>Error loading lead history.</li>";
            }
        } catch (error) {
            console.error("Error fetching lead history:", error);
            leadHistoryList.innerHTML = "<li>Error loading lead history.</li>";
        }
    }

    // Fetch and display message usage
    async function fetchMessageUsage() {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const agentId = "agt_placeholder_agent_id"; // Placeholder

        try {
            // Fetch agent details to get message credits
            const agentResponse = await fetch(
                `${API_BASE_URL}/agents/${agentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (agentResponse.ok) {
                const agent = await agentResponse.json();
                remainingCreditsSpan.textContent = agent.message_credits;
                // For total messages sent, you might need a separate endpoint or calculate from chat sessions.
                totalMessagesSentSpan.textContent = "N/A"; // Placeholder for now
            } else {
                console.error("Failed to fetch agent message usage");
                remainingCreditsSpan.textContent = "Error";
                totalMessagesSentSpan.textContent = "Error";
            }
        } catch (error) {
            console.error("Error fetching message usage:", error);
            remainingCreditsSpan.textContent = "Error";
            totalMessagesSentSpan.textContent = "Error";
        }
    }

    // Handle Login
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = e.target.elements["login-email"].value;
        const password = e.target.elements["login-password"].value;

        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("access_token", data.access_token);
                updateUI();
            } else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("An error occurred during login.");
        }
    });

    // Handle Registration
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = e.target.elements["register-email"].value;
        const password = e.target.elements["register-password"].value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                alert("Registration successful! Please log in.");
                e.target.reset(); // Clear form
            } else {
                const errorData = await response.json();
                alert(`Registration failed: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error during registration:", error);
            alert("An error occurred during registration.");
        }
    });

    // Handle Logout
    logoutButton.addEventListener("click", () => {
        logout();
    });

    function logout() {
        localStorage.removeItem("access_token");
        updateUI();
    }

    // Initial UI update
    updateUI();
});
