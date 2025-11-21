"use client";

import { useAgents } from '../../../hooks/useAgents';
import { useMessageUsageReport } from '../../../hooks/useReports';

export default function ReportsPage() {
  const { data: report, isLoading, isError, error } = useMessageUsageReport();
  const { data: agents } = useAgents()

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Message Usage Reports</h1>
        <a
          href="/dashboard/reports/sessions"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          View Chat Sessions
        </a>
      </div>

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


    </div>
  );
}