"use client";

import React from 'react';
import { useMessageUsageReport } from '../../../hooks/useReports';
import { useAgents } from '../../../hooks/useAgents'; // To get agent names

export default function ReportsPage() {
  const { data: report, isLoading, isError, error } = useMessageUsageReport();
  const { data: agents } = useAgents(); // Fetch agents to map IDs to names

  const getAgentName = (agentId: string) => {
    return agents?.find(agent => agent.id === agentId)?.name || agentId;
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Message Usage Reports</h1>
        <p>Loading report data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Message Usage Reports</h1>
        <p className="text-red-500">Error loading report: {error?.message}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Message Usage Reports</h1>
        <p>No report data available.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Message Usage Reports</h1>

      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-2">Overall Usage</h2>
        <p className="text-3xl font-semibold">{report.total_messages}</p>
        <p className="text-gray-600 dark:text-gray-400">Total Messages Sent</p>
      </div>

      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-2">Messages Per Agent</h2>
        {Object.keys(report.messages_per_agent).length > 0 ? (
          <ul className="list-disc pl-5">
            {Object.entries(report.messages_per_agent).map(([agentId, count]) => (
              <li key={agentId}>
                <strong>{getAgentName(agentId)}:</strong> {count} messages
              </li>
            ))}
          </ul>
        ) : (
          <p>No messages sent by agents yet.</p>
        )}
      </div>

      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-2">Messages Over Time (Last 30 Days)</h2>
        {report.messages_over_time.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
              <thead>
                <tr className="w-full bg-gray-200 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-300 uppercase text-sm">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Messages</th>
                </tr>
              </thead>
              <tbody>
                {report.messages_over_time.map((entry) => (
                  <tr key={entry.date} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">{entry.date}</td>
                    <td className="py-3 px-4">{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No message activity in the last 30 days.</p>
        )}
      </div>
    </div>
  );
}