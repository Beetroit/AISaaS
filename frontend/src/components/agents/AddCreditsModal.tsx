"use client";

import React, { useState } from "react";
import { useAgents, useAddAgentCredits } from "../../hooks/useAgents";

interface AddCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCreditsModal({ isOpen, onClose }: AddCreditsModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [amount, setAmount] = useState(0);

  const { data: agents } = useAgents();
  const addAgentCreditsMutation = useAddAgentCredits();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || amount <= 0) {
      alert("Please select an agent and enter a valid amount.");
      return;
    }

    addAgentCreditsMutation.mutate(
      { agentId: selectedAgentId, amount },
      {
        onSuccess: () => {
          onClose();
          setSelectedAgentId("");
          setAmount(0);
        },
        onError: (error) => {
          console.error("Failed to add credits:", error.message);
          // TODO: Display user-friendly error message
        },
      }
    );
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
          Add Credits to Agent
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="agent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Agent
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
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (Credits)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              required
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
            disabled={addAgentCreditsMutation.isPending}
          >
            {addAgentCreditsMutation.isPending ? "Adding Credits..." : "Add Credits"}
          </button>
          {addAgentCreditsMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              Error: {addAgentCreditsMutation.error?.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
