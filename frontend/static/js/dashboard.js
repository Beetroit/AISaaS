import { isLoggedIn, logout } from "./auth.js";
import { fetchDocuments, uploadDocuments } from "./documentManager.js";
import {
    connectGoogleCalendar,
    saveTwilioCredentials,
    fetchAndDisplayLeadWebhookUrl,
    generateNewLeadWebhookUrl,
} from "./integrations.js";
import {
    fetchAppointments,
    fetchLeadHistory,
    fetchMessageUsage,
} from "./reports.js";
import { api } from "./api.js";
import { openModal, closeModal } from "./modal.js";

// UI Elements
const userEmailSpan = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-button");

const documentUploadInput = document.getElementById("document-upload-input");
const documentUploadButton = document.getElementById("document-upload-button");
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
const totalMessagesSentSpan = document.getElementById("total-messages-sent");
const remainingCreditsSpan = document.getElementById("remaining-credits");

const agentManagementModal = document.getElementById("agent-management-modal");
const closeAgentManagementModalButton = document.getElementById(
    "close-agent-management-modal"
);
const agentSelectionSection = document.getElementById(
    "agent-selection-section"
);
const agentSelect = document.getElementById("agent-select");
const setActiveAgentButton = document.getElementById("set-active-agent-button");
const agentCreationSection = document.getElementById("agent-creation-section");
const createAgentForm = document.getElementById("create-agent-form");
const newAgentNameInput = document.getElementById("new-agent-name");
const newAgentPersonaInput = document.getElementById("new-agent-persona");

let currentUserAgents = []; // To store agent IDs fetched from user info
let activeAgentId = null;

function enableDashboardFeatures(enable) {
    const dashboardSections = document.querySelectorAll(
        "#dashboard-container > div"
    ); // Adjust selector as needed
    dashboardSections.forEach((section) => {
        if (enable) {
            section.classList.remove("opacity-50", "pointer-events-none");
        } else {
            section.classList.add("opacity-50", "pointer-events-none");
        }
    });
}

async function initializeDashboard() {
    if (!isLoggedIn()) {
        window.location.href = "/"; // Redirect to landing if not logged in
        return;
    }

    // Fetch user info to get agent_ids
    try {
        const user = await api.fetchUserMe();
        userEmailSpan.textContent = user.email;
        currentUserAgents = user.agent_ids; // Assuming agent_ids is a list of agent IDs

        if (currentUserAgents.length === 0) {
            // No agents, prompt to create one
            enableDashboardFeatures(false);
            agentSelectionSection.classList.add("hidden");
            agentCreationSection.classList.remove("hidden");
            openModal(agentManagementModal);
        } else {
            // User has agents, try to set active agent
            populateAgentSelect(currentUserAgents);
            const storedAgentId = localStorage.getItem("active_agent_id");

            if (storedAgentId && currentUserAgents.includes(storedAgentId)) {
                activeAgentId = storedAgentId;
                agentSelect.value = activeAgentId;
                enableDashboardFeatures(true);
                closeModal(agentManagementModal);
                loadAgentSpecificData(activeAgentId);
            } else {
                // No valid active agent, prompt to select one
                enableDashboardFeatures(false);
                agentSelectionSection.classList.remove("hidden");
                agentCreationSection.classList.add("hidden");
                openModal(agentManagementModal);
            }
        }
    } catch (error) {
        console.error("Failed to fetch user info or agents:", error);
        logout(); // Log out if user info can't be fetched
        return;
    }
}

function populateAgentSelect(agentIds) {
    agentSelect.innerHTML = '<option value="">-- Select an Agent --</option>';
    agentIds.forEach((agentId) => {
        const option = document.createElement("option");
        option.value = agentId;
        option.textContent = `Agent ${agentId}`; // TODO: Fetch agent names for better display
        agentSelect.appendChild(option);
    });
}

async function loadAgentSpecificData(agentId) {
    // Initial data fetches for dashboard
    fetchDocuments(agentId, documentList);
    fetchAndDisplayLeadWebhookUrl(agentId, leadWebhookUrlDisplay);
    fetchAppointments(agentId, appointmentsList);
    fetchLeadHistory(agentId, leadHistoryList);
    fetchMessageUsage(agentId, remainingCreditsSpan, totalMessagesSentSpan);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", initializeDashboard);
logoutButton.addEventListener("click", logout);
closeAgentManagementModalButton.addEventListener("click", () =>
    closeModal(agentManagementModal)
);

setActiveAgentButton.addEventListener("click", () => {
    const selectedAgent = agentSelect.value;
    if (selectedAgent) {
        activeAgentId = selectedAgent;
        localStorage.setItem("active_agent_id", activeAgentId);
        enableDashboardFeatures(true);
        closeModal(agentManagementModal);
        loadAgentSpecificData(activeAgentId);
    } else {
        alert("Please select an agent.");
    }
});

createAgentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const agentName = newAgentNameInput.value;
    const agentPersona = newAgentPersonaInput.value;

    if (!agentName) {
        alert("Agent Name is required.");
        return;
    }

    try {
        const newAgent = await api.createAgent({
            name: agentName,
            persona: agentPersona,
        });
        alert(`Agent '${newAgent.name}' created successfully!`);
        newAgentNameInput.value = "";
        newAgentPersonaInput.value = "";

        // Refresh user agents and set new agent as active
        const user = await api.fetchUserMe();
        currentUserAgents = user.agent_ids;
        activeAgentId = newAgent.id; // Set the newly created agent as active
        localStorage.setItem("active_agent_id", activeAgentId);

        populateAgentSelect(currentUserAgents);
        agentSelect.value = activeAgentId;
        enableDashboardFeatures(true);
        closeModal(agentManagementModal);
        loadAgentSpecificData(activeAgentId);
    } catch (error) {
        alert(`Failed to create agent: ${error.message}`);
    }
});

// Setup Event Listeners for dashboard features (these now rely on activeAgentId)
documentUploadButton.addEventListener("click", () =>
    uploadDocuments(activeAgentId, documentUploadInput, documentList)
);
connectGoogleCalendarButton.addEventListener("click", connectGoogleCalendar);
twilioConfigForm.addEventListener("submit", (e) =>
    saveTwilioCredentials(e, activeAgentId)
);
generateLeadWebhookButton.addEventListener("click", () =>
    generateNewLeadWebhookUrl(activeAgentId, leadWebhookUrlDisplay)
);
