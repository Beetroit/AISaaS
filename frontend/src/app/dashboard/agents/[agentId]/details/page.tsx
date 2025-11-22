"use client";

import LeadMappingModal from '@/components/agents/LeadMappingModal';
import TwilioConfigModal from '@/components/agents/TwilioConfigModal';
import { useAgent, useLeadWebhookUrl, useUpdateAgent } from '@/hooks/useAgents';
import { AgentUpdate } from '@/types/agent';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';

export default function AgentDetailsPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const { data: agent, isLoading, isError, error } = useAgent(agentId);
  const updateAgentMutation = useUpdateAgent();
  const { data: leadWebhookUrl, isLoading: isLoadingLeadWebhookUrl } = useLeadWebhookUrl(agentId);

  const [name, setName] = useState(agent?.name || "");
  const [description, setDescription] = useState(agent?.description || "");
  const [persona, setPersona] = useState(agent?.persona || "");
  const [initialPrompts, setInitialPrompts] = useState(agent?.initial_prompts || "");
  const [isTwilioConfigModalOpen, setIsTwilioConfigModalOpen] = useState(false);
  const [isLeadMappingModalOpen, setIsLeadMappingModalOpen] = useState(false);

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
        onError: (err: Error) => { // Explicitly type err
          console.error("Failed to update agent:", err.message);
          // TODO: Display user-friendly error message
        },
      }
    );
  };

  const handleCopyWebhookUrl = () => {
    if (leadWebhookUrl) {
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_BASE_URL}${leadWebhookUrl}`);
      // TODO: Show a temporary success message (e.g., using FeedbackContext)
      alert("Webhook URL copied to clipboard!");
    }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPersona(e.target.value)}
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInitialPrompts(e.target.value)}
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

      {/* New section for Lead Webhook URL */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Lead Intake Webhook</h2>
        {isLoadingLeadWebhookUrl ? (
          <p>Loading webhook URL...</p>
        ) : (
          leadWebhookUrl && (
            <div className="flex items-center space-x-2">
              <p className="break-all bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm">
                {`${process.env.NEXT_PUBLIC_API_BASE_URL}${leadWebhookUrl}`}
              </p>
              <button
                onClick={handleCopyWebhookUrl}
                className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Copy
              </button>
            </div>
          )
        )}
      </div>

      {/* New section for Lead Mapping Configuration */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Lead Mapping Configuration</h2>
        <button
          onClick={() => setIsLeadMappingModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Configure Lead Mapping
        </button>
      </div>

      {/* Existing section for Twilio Configuration */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Twilio Configuration</h2>
        <button
          onClick={() => setIsTwilioConfigModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Configure Twilio Credentials
        </button>
      </div>

      {isTwilioConfigModalOpen && agent && (
        <TwilioConfigModal
          isOpen={isTwilioConfigModalOpen}
          onClose={() => setIsTwilioConfigModalOpen(false)}
          onSave={() => {
            console.log("Twilio credentials saved");
          }}
        />
      )}

      {isLeadMappingModalOpen && agent && (
        <LeadMappingModal
          isOpen={isLeadMappingModalOpen}
          onClose={() => setIsLeadMappingModalOpen(false)}
          agentId={agent.id}
        />
      )}
    </div>
  );
}