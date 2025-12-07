"use client";

import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useLead, useUpdateLead } from '../../../../hooks/useLeads';
import { LeadRead, LeadUpdate } from '../../../../types/lead';

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.lead_id as string;

  const { data: lead, isLoading, isError, error } = useLead(leadId);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Lead Details</h2>
        <p>Loading lead details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Lead Details</h2>
        <p className="text-red-500">Error loading lead: {error?.message}</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Lead Details</h2>
        <p>Lead not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold">
          Lead: {String(lead.contact_info?.name || lead.contact_info?.email || lead.id.slice(0, 12))}
        </h1>
      </div>

      <LeadEditForm lead={lead} />
    </div>
  );
}

function LeadEditForm({ lead }: { lead: LeadRead }) {
  const updateLeadMutation = useUpdateLead();

  const [source, setSource] = useState(lead.source || "");
  const [qualificationStatus, setQualificationStatus] = useState(lead.qualification_status || "unqualified");
  const [notes, setNotes] = useState(lead.notes || "");
  const [contactInfo, setContactInfo] = useState<Record<string, unknown>>(lead.contact_info || {});
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const handleContactInfoChange = (key: string, value: string) => {
    setContactInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteField = (key: string) => {
    setContactInfo(prev => {
      const newInfo = { ...prev };
      delete newInfo[key];
      return newInfo;
    });
  };

  const handleAddField = () => {
    if (newFieldKey.trim() && newFieldValue.trim()) {
      setContactInfo(prev => ({ ...prev, [newFieldKey.trim()]: newFieldValue.trim() }));
      setNewFieldKey("");
      setNewFieldValue("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedLead: LeadUpdate = {
      source: source || null,
      qualification_status: qualificationStatus || null,
      contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : null,
      notes: notes || null,
    };

    updateLeadMutation.mutate(
      { leadId: lead.id, lead: updatedLead },
      {
        onSuccess: () => {
          console.log("Lead updated successfully!");
        },
        onError: (err) => {
          console.error("Failed to update lead:", err.message);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
      {/* Fixed Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Source
          </label>
          <input
            type="text"
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., whatsapp, website, referral"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="qualificationStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Qualification Status
          </label>
          <select
            id="qualificationStatus"
            value={qualificationStatus}
            onChange={(e) => setQualificationStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Dynamic Contact Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Contact Information
        </h3>
        <div className="space-y-2 mb-4">
          {Object.entries(contactInfo).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <input
                type="text"
                value={key}
                disabled
                className="w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold"
              />
              <input
                type="text"
                value={String(value)}
                onChange={(e) => handleContactInfoChange(key, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => handleDeleteField(key)}
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                title="Delete field"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add New Field */}
        <div className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <input
            type="text"
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
            placeholder="Field name"
            className="w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            placeholder="Field value"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleAddField}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add notes about this lead..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-150 disabled:bg-gray-400"
        disabled={updateLeadMutation.isPending}
      >
        {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
      </button>

      {updateLeadMutation.isError && (
        <p className="text-red-500 text-sm mt-2">
          Error: {updateLeadMutation.error?.message}
        </p>
      )}
      {updateLeadMutation.isSuccess && (
        <p className="text-green-500 text-sm mt-2">Lead updated successfully!</p>
      )}
    </form>
  );
}
