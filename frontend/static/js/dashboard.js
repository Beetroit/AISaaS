import { api } from "./api.js";
import { isLoggedIn, logout } from "./auth.js";
import { fetchDocuments, uploadDocuments } from "./documentManager.js";
import {
    connectGoogleCalendar,
    fetchAndDisplayLeadWebhookUrl,
    generateNewLeadWebhookUrl,
    saveTwilioCredentials,
} from "./integrations.js";
import {
    fetchAppointments,
    fetchLeadHistory,
    fetchMessageUsage,
} from "./reports.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (!isLoggedIn()) {
        window.location.href = "/"; // Redirect to landing if not logged in
        return;
    }

    const userEmailSpan = document.getElementById("user-email");
    const logoutButton = document.getElementById("logout-button");

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
    const twilioConfigForm = document.getElementById("twilio-config-form");
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

    const agentId = localStorage.getItem("active_agent_id");
    if (!agentId) {
        console.error("No active agent ID found. Redirecting to landing page.");
        logout();
        return;
    }

    // Fetch user info
    try {
        const user = await api.fetchUserMe();
        console.log('User info fetched successfully on dashboard:', user);
        userEmailSpan.textContent = user.email;
    } catch (error) {
        console.error("Error fetching user info on dashboard:", error);
        logout(); // Log out if user info can't be fetched
        return;
    }

    // Setup Event Listeners
    logoutButton.addEventListener("click", logout);

    documentUploadButton.addEventListener("click", () =>
        uploadDocuments(agentId, documentUploadInput, documentList)
    );
    connectGoogleCalendarButton.addEventListener(
        "click",
        connectGoogleCalendar
    );
    twilioConfigForm.addEventListener("submit", (e) =>
        saveTwilioCredentials(e, agentId)
    );
    generateLeadWebhookButton.addEventListener("click", () =>
        generateNewLeadWebhookUrl(agentId, leadWebhookUrlDisplay)
    );

    // Initial data fetches for dashboard
    fetchDocuments(agentId, documentList);
    fetchAndDisplayLeadWebhookUrl(agentId, leadWebhookUrlDisplay);
    fetchAppointments(agentId, appointmentsList);
    fetchLeadHistory(agentId, leadHistoryList);
    fetchMessageUsage(agentId, remainingCreditsSpan, totalMessagesSentSpan);
});
