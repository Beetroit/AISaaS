"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAgent, useUpdateAgent } from '../../../../hooks/useAgents';
import { AgentUpdate } from '../../../../types/agent';

export default function AgentDetailsPage() {
  const params = useParams();
  const agentId = params.agent_id as string;

  const { data: agent, isLoading, isError, error } = useAgent(agentId);
  const updateAgentMutation = useUpdateAgent();

  const [name, setName] = useState(agent?.name || "");
  const [description, setDescription] = useState(agent?.description || "");
  const [persona, setPersona] = useState(agent?.persona || "");
  const [initialPrompts, setInitialPrompts] = useState(agent?.initial_prompts || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    const updatedAgent: AgentUpdate = {
      name,
      description: description || undefined,
      persona: persona || undefined,
      initial_prompts: initialPrompts || undefined,
    };

    updateAgentMutation.mutate(
      { agentId: agent.id, agent: updatedAgent },
      {
        onSuccess: () => {
          console.log("Agent updated successfully!");
          // Optionally, show a success message
        },
        onError: (err) => {
          console.error("Failed to update agent:", err.message);
          // TODO: Display user-friendly error message
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Agent Details</h2>
        <p>Loading agent details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Agent Details</h2>
        <p className="text-red-500">Error loading agent: {error?.message}</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Agent Details</h2>
        <p>Agent not found.</p>
      </div>
    );
  }

  return (
    <div key={agent?.id || "loading-agent-details"}>
      <h1 className="text-3xl font-bold mb-6">Agent: {agent.name}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
        <div>
          <label htmlFor="persona" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Persona
          </label>
          <textarea
            id="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
        <div>
          <label htmlFor="initialPrompts" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Initial Prompts
          </label>
          <textarea
            id="initialPrompts"
            value={initialPrompts}
            onChange={(e) => setInitialPrompts(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
          disabled={updateAgentMutation.isPending}
        >
          {updateAgentMutation.isPending ? "Updating..." : "Update Agent"}
        </button>
        {updateAgentMutation.isError && (
          <p className="text-red-500 text-sm mt-2">
            Error: {updateAgentMutation.error?.message}
          </p>
        )}
        {updateAgentMutation.isSuccess && (
          <p className="text-green-500 text-sm mt-2">Agent updated successfully!</p>
        )}
      </form>
    </div>
  );
}
