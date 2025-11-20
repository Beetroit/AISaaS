"use client";

import { useRouter } from 'next/navigation';
import { useDeleteLead, useLeads } from '../../../hooks/useLeads';
import { ApiError } from '../../../lib/api/core';

export default function LeadsPage() {
  const router = useRouter()
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

  const handleEditClick = (leadId: string) => {
    router.push(`/dashboard/leads/${leadId}`)
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
    const errorMessage =
      error instanceof ApiError && error.statusCode === 404
        ? "No leads available currently."
        : error?.message || "Error loading leads.";
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Leads Management</h2>
        <p className="text-red-500">{errorMessage}</p>
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
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">
                    {lead.contact_info && Object.keys(lead.contact_info).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(lead.contact_info).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-semibold capitalize">{key}:</span>{' '}
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No contact info</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {lead.source ? (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                        {lead.source}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${lead.qualification_status === 'qualified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {lead.qualification_status || 'new'}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(lead.id)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
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
