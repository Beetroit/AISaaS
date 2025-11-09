"use client";

import React, { useState } from 'react';
import { useAgents } from '../../../hooks/useAgents';
import AddAgentModal from '../../../components/agents/AddAgentModal'; // Import AddAgentModal

export default function AgentsPage() {
  const { data: agents, isLoading, isError, error } = useAgents();
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Agents Management</h2>
        <p>Loading agents...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Agents Management</h2>
        <p className="text-red-500">Error loading agents: {error?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Agents Management</h2>
        <button
          onClick={() => setIsAddAgentModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Agent
        </button>
      </div>

      {agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-xl font-bold">{agent.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{agent.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Credits: {agent.message_credits}</p>
              {/* TODO: Add edit/delete buttons */}
            </div>
          ))}
        </div>
      ) : (
        <p>No agents found. Click "Add New Agent" to create one.</p>
      )}

      {isAddAgentModalOpen && (
        <AddAgentModal
          isOpen={isAddAgentModalOpen}
          onClose={() => setIsAddAgentModalOpen(false)}
        />
      )}
    </div>
  );
}
