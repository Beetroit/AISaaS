"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AddAgentModal from '../../../components/agents/AddAgentModal';
import AddCreditsModal from '../../../components/agents/AddCreditsModal'; // Import AddCreditsModal
import { useAgents, useDeleteAgent } from '../../../hooks/useAgents';
import { AgentRead } from '../../../types/agent';

export default function AgentsPage() {
  const router = useRouter();
  const { data: agents, isLoading, isError, error } = useAgents();
  const deleteAgentMutation = useDeleteAgent();
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false); // State for AddCreditsModal

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

  const handleEditClick = (agent: AgentRead) => {
    router.push(`/dashboard/agents/${agent.id}`);
  };

  const handleDeleteClick = (agentId: string) => {


    if (confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      deleteAgentMutation.mutate(agentId, {
        onSuccess: () => {
          console.log(`Agent ${agentId} deleted successfully.`);
          // Invalidate agents query to refetch the list
        },
        onError: (err) => {
          console.error(`Failed to delete agent ${agentId}:`, err.message);
          // TODO: Display user-friendly error message
        },
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Agents Management</h2>
        <div className="space-x-2">
          <button
            onClick={() => setIsAddAgentModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add New Agent
          </button>
          <button
            onClick={() => setIsAddCreditsModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Add Credits
          </button>
        </div>
      </div>

      {agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-xl font-bold">{agent.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{agent.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Credits: {agent.message_credits}</p>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleEditClick(agent)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(agent.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                  disabled={deleteAgentMutation.isPending}
                >
                  Delete
                </button>
              </div>
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

      {isAddCreditsModalOpen && (
        <AddCreditsModal
          isOpen={isAddCreditsModalOpen}
          onClose={() => setIsAddCreditsModalOpen(false)}
        />
      )}
    </div>
  );
}
