"use client";

import React from 'react';
import { useUserMe } from '../../hooks/useAuth';
import { useAgents } from '../../hooks/useAgents';
import { useDocuments } from '../../hooks/useDocuments';
import { useLeads } from '../../hooks/useLeads';

export default function DashboardPage() {
  const { data: user, isLoading: isLoadingUser, isError: isErrorUser, error: errorUser } = useUserMe();
  const { data: agents, isLoading: isLoadingAgents, isError: isErrorAgents, error: errorAgents } = useAgents();
  const { data: documents, isLoading: isLoadingDocuments, isError: isErrorDocuments, error: errorDocuments } = useDocuments();
  const { data: leads, isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useLeads();

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to Your Dashboard!</h1>

      {/* User Info */}
      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-2">User Information</h2>
        {isLoadingUser && <p>Loading user info...</p>}
        {isErrorUser && <p className="text-red-500">Error loading user info: {errorUser?.message}</p>}
        {user && (
          <>
            <p>Email: {user.email}</p>
            <p>Message Credits: {user.message_credits}</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Agents Summary */}
        <div className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
          <h2 className="text-xl font-bold mb-2">Agents</h2>
          {isLoadingAgents && <p>Loading agents count...</p>}
          {isErrorAgents && <p className="text-red-500">Error loading agents: {errorAgents?.message}</p>}
          {agents && <p className="text-3xl font-semibold">{agents.length}</p>}
          <p className="text-gray-600 dark:text-gray-400">Total Agents</p>
        </div>

        {/* Documents Summary */}
        <div className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
          <h2 className="text-xl font-bold mb-2">Documents</h2>
          {isLoadingDocuments && <p>Loading documents count...</p>}
          {isErrorDocuments && <p className="text-red-500">Error loading documents: {errorDocuments?.message}</p>}
          {documents && <p className="text-3xl font-semibold">{documents.length}</p>}
          <p className="text-gray-600 dark:text-gray-400">Total Documents</p>
        </div>

        {/* Leads Summary */}
        <div className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
          <h2 className="text-xl font-bold mb-2">Leads</h2>
          {isLoadingLeads && <p>Loading leads count...</p>}
          {isErrorLeads && <p className="text-red-500">Error loading leads: {errorLeads?.message}</p>}
          {leads && <p className="text-3xl font-semibold">{leads.length}</p>}
          <p className="text-gray-600 dark:text-gray-400">Total Leads</p>
        </div>
      </div>
    </div>
  );
}