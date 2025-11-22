"use client";

import React, { useState } from "react";
import { useAgents } from "../../hooks/useAgents";
import { useCreateAppointment } from "../../hooks/useAppointments";
import { useLeads } from "../../hooks/useLeads";
import { AppointmentCreate } from "../../types/appointment";

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAppointmentModal({ isOpen, onClose }: AddAppointmentModalProps) {
  const [appointmentTime, setAppointmentTime] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [notes, setNotes] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");

  const createAppointmentMutation = useCreateAppointment();
  const { data: agents } = useAgents()
  const { data: leads } = useLeads()

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !selectedLeadId || !appointmentTime) {
      alert("Please fill all required fields.");
      return;
    }

    const newAppointment: AppointmentCreate = {
      appointment_time: new Date(appointmentTime),
      status,
      notes: notes || undefined,
      user_id: "current_user_id_placeholder",
      agent_id: selectedAgentId,
      lead_id: selectedLeadId,
    };

    createAppointmentMutation.mutate(newAppointment, {
      onSuccess: () => {
        onClose();
        setAppointmentTime("");
        setStatus("scheduled");
        setNotes("");
        setSelectedAgentId("");
        setSelectedLeadId("");
      },
      onError: (error) => {
        console.error("Failed to create appointment:", error.message);
        // TODO: Display user-friendly error message
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="text-right">
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
          Schedule New Appointment
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Appointment Time
            </label>
            <input
              type="datetime-local"
              id="appointmentTime"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            ></textarea>
          </div>
          <div>
            <label htmlFor="agent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Agent
            </label>
            <select
              id="agent"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select an Agent</option>
              {agents?.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lead" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Lead
            </label>
            <select
              id="lead"
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select a Lead</option>
              {leads?.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {(lead.contact_info?.name as string) || (lead.contact_info?.email as string) || "Unknown Lead"}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
            disabled={createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
          </button>
          {createAppointmentMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              Error: {createAppointmentMutation.error?.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
