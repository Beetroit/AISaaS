"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import React, { useState } from "react";
import { useSaveTwilioCredentials } from "../../hooks/useAgents";
import { TwilioCredentials } from "../../types/agent";

interface TwilioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Added onSave to props
}

export default function TwilioConfigModal({
  isOpen,
  onClose,
  onSave, // Changed destructuring from agentId:_agentId to onSave
}: TwilioConfigModalProps) {
  const [sid, setSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "facebook" | "instagram">("whatsapp");

  const saveTwilioCredentialsMutation = useSaveTwilioCredentials();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const credentials: TwilioCredentials = {
      twilio_account_sid: sid,
      twilio_auth_token: authToken,
      identifier: identifier,
      channel: channel,
    };

    saveTwilioCredentialsMutation.mutate(
      { credentials },
      {
        onSuccess: () => {
          onClose();
          setSid("");
          setAuthToken("");
          setIdentifier("");
          setChannel("whatsapp");
          // TODO: Show success feedback
        },
        onError: (error: Error) => { // Explicitly type error
          console.error("Failed to save Twilio credentials:", error.message);
          // TODO: Display user-friendly error message
        },
      }
    );
  };

  const getIdentifierLabel = () => {
    switch (channel) {
      case "whatsapp":
        return "Twilio Phone Number (e.g., +1234567890)";
      case "facebook":
        return "Facebook Page ID";
      case "instagram":
        return "Instagram User ID / Handle";
      default:
        return "Identifier";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Configure Twilio Credentials</AlertDialogTitle>
          <AlertDialogDescription>
            Enter your Twilio Account SID, Auth Token, and Identifier for this agent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label
              htmlFor="channel"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Channel
            </label>
            <select
              id="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as "whatsapp" | "facebook" | "instagram")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook Messenger</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="sid"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account SID
            </label>
            <input
              type="text"
              id="sid"
              value={sid}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSid(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="authToken"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Auth Token
            </label>
            <input
              type="text"
              id="authToken"
              value={authToken}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthToken(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {getIdentifierLabel()}
            </label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button type="button" onClick={onClose}>Cancel</button>
            </AlertDialogCancel>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={saveTwilioCredentialsMutation.isPending}
            >
              {saveTwilioCredentialsMutation.isPending ? "Saving..." : "Save Credentials"}
            </button>
          </AlertDialogFooter>
          {saveTwilioCredentialsMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              Error: {saveTwilioCredentialsMutation.error?.message}
            </p>
          )}
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
