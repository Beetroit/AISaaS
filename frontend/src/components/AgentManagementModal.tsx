"use client";

import React from "react";

interface AgentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentManagementModal({
  isOpen,
  onClose,
}: AgentManagementModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="agent-management-modal"
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center"
    >
      <div className="relative mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="text-right">
          <button
            id="close-agent-management-modal"
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Manage Your Agents
        </h2>

        <div id="agent-selection-section" className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            Select Active Agent
          </h3>
          <select
            id="agent-select"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select an Agent --</option>
          </select>
          <button
            id="set-active-agent-button"
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
          >
            Set Active Agent
          </button>
        </div>

        <div id="agent-creation-section">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            Create New Agent
          </h3>
          <form id="create-agent-form" className="space-y-4">
            <div>
              <label
                htmlFor="new-agent-name"
                className="block text-sm font-medium text-gray-700"
              >
                Agent Name
              </label>
              <input
                type="text"
                id="new-agent-name"
                placeholder="e.g., Sales Bot, Support Assistant"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="new-agent-persona"
                className="block text-sm font-medium text-gray-700"
              >
                Agent Persona (Optional)
              </label>
              <textarea
                id="new-agent-persona"
                placeholder="e.g., A friendly and helpful sales assistant."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition duration-150"
            >
              Create Agent
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
