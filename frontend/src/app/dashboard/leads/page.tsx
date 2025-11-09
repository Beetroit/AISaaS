"use client";

import React from 'react';
import { useLeads, useDeleteLead } from '../../../hooks/useLeads'; // Adjust path as needed

export default function LeadsPage() {
  const { data: leads, isLoading, isError, error } = useLeads();
  const deleteLeadMutation = useDeleteLead();

  const handleDeleteLead = (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate(leadId, {
        onSuccess: () => {
          console.log(`Lead ${leadId} deleted successfully.`);
          // Invalidate leads query to refetch the list
        },
        onError: (err) => {
          console.error(`Failed to delete lead ${leadId}:`, err.message);
          // TODO: Display user-friendly error message
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Leads Management</h2>
        <p>Loading leads...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Leads Management</h2>
        <p className="text-red-500">Error loading leads: {error?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Leads Management</h2>

      {leads && leads.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead>
              <tr className="w-full bg-gray-200 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-300 uppercase text-sm">
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">{lead.email || 'N/A'}</td>
                  <td className="py-3 px-4">{lead.phone_number || 'N/A'}</td>
                  <td className="py-3 px-4">{lead.name || 'N/A'}</td>
                  <td className="py-3 px-4">{lead.qualification_status || 'unqualified'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                      disabled={deleteLeadMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No leads found.</p>
      )}
    </div>
  );
}
