"use client";

import React, { useState } from "react";
import { useUpdateAgent } from "../../hooks/useAgents";
import { AgentRead, AgentUpdate } from "../../types/agent";

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentRead
}

export default function EditAgentModal({ isOpen, onClose, agent }: EditAgentModalProps) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || "");
  const [persona, setPersona] = useState(agent.persona || "");
  const [initialPrompts, setInitialPrompts] = useState(agent.initial_prompts || "");

  const updateAgentMutation = useUpdateAgent();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          onClose();
        },
        onError: (error) => {
          console.error("Failed to update agent:", error.message);
          // TODO: Display user-friendly error message
        },
      }
    );
  };

  return (
    <div key={agent.id} className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
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
          Edit Agent: {agent.name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
        </form>
      </div>
    </div>
  );
}
