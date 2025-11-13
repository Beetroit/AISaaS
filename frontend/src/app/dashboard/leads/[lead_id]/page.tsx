"use client";

import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { useLead, useUpdateLead } from '../../../../hooks/useLeads';
import { LeadUpdate } from '../../../../types/lead';

export default function LeadDetailsPage() {
  const params = useParams();
  const leadId = params.lead_id as string;

  const { data: lead, isLoading, isError, error } = useLead(leadId);
  const updateLeadMutation = useUpdateLead();

  const [email, setEmail] = useState(lead?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(lead?.phone_number || "");
  const [name, setName] = useState(lead?.name || "");
  const [source, setSource] = useState(lead?.source || "");
  const [qualificationStatus, setQualificationStatus] = useState(lead?.qualification_status || "");
  const [contactInfo, setContactInfo] = useState(lead?.contact_info || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    const updatedLead: LeadUpdate = {
      email: email || undefined,
      phone_number: phoneNumber || undefined,
      name: name || undefined,
      source: source || undefined,
      qualification_status: qualificationStatus || undefined,
      contact_info: contactInfo || undefined,
    };

    updateLeadMutation.mutate(
      { leadId: lead.id, lead: updatedLead },
      {
        onSuccess: () => {
          console.log("Lead updated successfully!");
          // Optionally, show a success message
        },
        onError: (err) => {
          console.error("Failed to update lead:", err.message);
          // TODO: Display user-friendly error message
        },
      }
    );
  };

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
    <div key={lead?.id || "loading-lead-details"}>
      <h1 className="text-3xl font-bold mb-6">Lead: {lead.name || lead.email}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Source
          </label>
          <input
            type="text"
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="qualificationStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Qualification Status
          </label>
          <input
            type="text"
            id="qualificationStatus"
            value={qualificationStatus}
            onChange={(e) => setQualificationStatus(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contact Info
          </label>
          <textarea
            id="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
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
    </div>
  );
}
