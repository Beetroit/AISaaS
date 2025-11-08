"use client";

import React, { useState } from "react";
import AgentManagementModal from "../../components/AgentManagementModal";

export default function DashboardPage() {
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  return (
    <div
      id="dashboard-container"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Welcome to AgentSync Pro Dashboard!
      </h1>
      <p className="text-lg text-gray-700 mb-4">
        Welcome, <span id="user-email" className="font-semibold"></span>!
      </p>
      <button
        id="logout-button"
        className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition duration-150"
      >
        Logout
      </button>

      {/* Agent Management Button */}
      <button
        onClick={() => setIsAgentModalOpen(true)}
        className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition duration-150"
      >
        Manage Agents
      </button>

      {/* Document Management Section */}
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
        Document Management
      </h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <input
          type="file"
          id="document-upload-input"
          multiple
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          id="document-upload-button"
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-150"
        >
          Upload Documents
        </button>
        <ul id="document-list" className="mt-4 space-y-2 text-gray-700"></ul>
      </div>

      {/* Integrations Section */}
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
        Integrations
      </h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <button
          id="connect-google-calendar-button"
          className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-green-700 transition duration-150"
        >
          Connect Google Calendar
        </button>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
          Twilio Configuration
        </h3>
        <form id="twilio-config-form" className="space-y-4">
          <div>
            <label
              htmlFor="twilio-sid"
              className="block text-sm font-medium text-gray-700"
            >
              Twilio Account SID
            </label>
            <input
              type="text"
              id="twilio-sid"
              placeholder="Twilio Account SID"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="twilio-auth-token"
              className="block text-sm font-medium text-gray-700"
            >
              Twilio Auth Token
            </label>
            <input
              type="text"
              id="twilio-auth-token"
              placeholder="Twilio Auth Token"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="twilio-phone-number"
              className="block text-sm font-medium text-gray-700"
            >
              Twilio Phone Number (e.g., +1234567890)
            </label>
            <input
              type="text"
              id="twilio-phone-number"
              placeholder="Twilio Phone Number (e.g., +1234567890)"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-150"
          >
            Save Twilio Credentials
          </button>
        </form>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
          Lead Intake Webhook
        </h3>
        <p className="text-gray-700">
          Your personal lead intake webhook URL:
        </p>
        <p>
          <code
            id="lead-webhook-url"
            className="block bg-gray-100 p-2 rounded-md text-sm text-gray-800 mt-2"
          >
            Loading...
          </code>
        </p>
        <button
          id="generate-lead-webhook-button"
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition duration-150"
        >
          Generate New Webhook URL
        </button>
      </div>

      {/* Reports Section */}
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Reports</h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Scheduled Appointments
        </h3>
        <ul id="appointments-list" className="space-y-2 text-gray-700"></ul>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
          Lead Qualification History
        </h3>
        <ul id="lead-history-list" className="space-y-2 text-gray-700"></ul>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
          Message Usage Reports
        </h3>
        <p className="text-gray-700">
          Total Messages Sent:
          <span id="total-messages-sent" className="font-semibold">
            0
          </span>
        </p>
        <p className="text-gray-700">
          Remaining Credits:
          <span id="remaining-credits" className="font-semibold">0</span>
        </p>
      </div>

      {/* Billing & Subscriptions Section */}
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
        Billing & Subscriptions
      </h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <p className="text-gray-700">
          Current Subscription:
          <span id="current-subscription" className="font-semibold">
            None
          </span>
        </p>
        <button
          id="manage-subscription-button"
          className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition duration-150"
        >
          Manage Subscription
        </button>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
          Purchase Message Packages
        </h3>
        <ul id="message-packages-list" className="space-y-2 text-gray-700"></ul>
      </div>

      <AgentManagementModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />
    </div>
  );
}

