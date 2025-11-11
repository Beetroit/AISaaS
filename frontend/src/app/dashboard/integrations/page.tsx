"use client";

import React from 'react';
import { TwilioConfigForm } from '@/components/integrations/TwilioConfigForm';
import { LeadWebhookConfig } from '@/components/integrations/LeadWebhookConfig';

export default function IntegrationsPage() {
  const handleConnectGoogleCalendar = () => {
    // Redirect to the backend's Google OAuth initiation endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google/authorize`;
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Integrations</h1>

      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-2">Google Calendar Integration</h2>
        <p className="mb-4">Connect your Google Calendar to allow agents to schedule appointments.</p>
        <button
          onClick={handleConnectGoogleCalendar}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Connect Google Calendar
        </button>
      </div>

      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-2">Twilio Integration</h2>
        <p className="mb-4">Configure your Twilio account to enable WhatsApp messaging for your agents.</p>
        <TwilioConfigForm />
      </div>

      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-2">Lead Webhook Configuration</h2>
        <p className="mb-4">Manage and display your personal lead intake webhook URLs.</p>
        <LeadWebhookConfig />
      </div>
    </div>
  );
}
