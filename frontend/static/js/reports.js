import { api } from "./api.js";

export async function fetchAppointments(agentId, appointmentsListElement) {
    try {
        const appointments = await api.fetchAppointments(agentId);
        appointmentsListElement.innerHTML = "";
        if (appointments.length === 0) {
            appointmentsListElement.innerHTML =
                '<li class="text-gray-500">No scheduled appointments.</li>';
            return;
        }
        appointments.forEach((appt) => {
            const li = document.createElement("li");
            li.className = "bg-gray-50 p-2 rounded-md";
            li.textContent = `Time: ${new Date(appt.appointment_time).toLocaleString()}, Status: ${appt.status}, Lead: ${appt.lead_id}`;
            appointmentsListElement.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to fetch appointments:", error);
        appointmentsListElement.innerHTML =
            '<li class="text-red-500">Error loading appointments.</li>';
    }
}

export async function fetchLeadHistory(agentId, leadHistoryListElement) {
    try {
        const leads = await api.fetchLeads(agentId);
        leadHistoryListElement.innerHTML = "";
        if (leads.length === 0) {
            leadHistoryListElement.innerHTML =
                '<li class="text-gray-500">No lead history.</li>';
            return;
        }
        leads.forEach((lead) => {
            const li = document.createElement("li");
            li.className = "bg-gray-50 p-2 rounded-md";
            li.textContent = `ID: ${lead.id}, Status: ${lead.qualification_status}, Contact: ${lead.contact_info?.email || "N/A"}`;
            leadHistoryListElement.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to fetch lead history:", error);
        leadHistoryListElement.innerHTML =
            '<li class="text-red-500">Error loading lead history.</li>';
    }
}

export async function fetchMessageUsage(
    agentId,
    remainingCreditsElement,
    totalMessagesSentElement
) {
    try {
        const agent = await api.fetchAgentDetails(agentId);
        remainingCreditsElement.textContent = agent.message_credits;
        // For total messages sent, you might need a separate endpoint or calculate from chat sessions.
        totalMessagesSentElement.textContent = "N/A"; // Placeholder for now
    } catch (error) {
        console.error("Failed to fetch agent message usage:", error);
        remainingCreditsElement.textContent = "Error";
        totalMessagesSentElement.textContent = "Error";
    }
}
