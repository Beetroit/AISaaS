import { api } from "./api.js";

export async function connectGoogleCalendar() {
    try {
        const response = await api.googleCalendarAuthorize();
        // The backend redirects to Google's OAuth consent screen
        // We need to follow that redirect
        window.location.href = response.authorization_url;
    } catch (error) {
        alert(
            `Failed to initiate Google Calendar connection: ${error.message}`
        );
    }
}

export async function saveTwilioCredentials(event, agentId) {
    event.preventDefault();
    const sid = event.target.elements["twilio-sid"].value;
    const authToken = event.target.elements["twilio-auth-token"].value;
    const phoneNumber = event.target.elements["twilio-phone-number"].value;

    try {
        await api.saveTwilioCredentials(agentId, {
            sid,
            auth_token: authToken,
            phone_number: phoneNumber,
        });
        alert("Twilio credentials saved successfully!");
    } catch (error) {
        alert(`Failed to save Twilio credentials: ${error.message}`);
    }
}

export async function fetchAndDisplayLeadWebhookUrl(
    agentId,
    leadWebhookUrlDisplayElement
) {
    try {
        const webhookUrl = await api.fetchLeadWebhookUrl(agentId);
        leadWebhookUrlDisplayElement.textContent = `${window.location.origin}${webhookUrl.url}`;
    } catch (error) {
        console.error("Failed to fetch lead webhook URL:", error);
        leadWebhookUrlDisplayElement.textContent = "Error loading URL.";
    }
}

export async function generateNewLeadWebhookUrl(
    agentId,
    leadWebhookUrlDisplayElement
) {
    try {
        const webhookUrl = await api.generateLeadWebhookUrl(agentId);
        leadWebhookUrlDisplayElement.textContent = `${window.location.origin}${webhookUrl.url}`;
        alert("New webhook URL generated successfully!");
    } catch (error) {
        alert(`Failed to generate new webhook URL: ${error.message}`);
    }
}
