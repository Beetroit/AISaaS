"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useSaveTwilioCredentials } from "../../hooks/useAgents"; // Corrected relative import
import { TwilioCredentials } from "../../types/agent"; // Corrected relative import

interface TwilioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export default function TwilioConfigModal({
  isOpen,
  onClose,
  agentId,
}: TwilioConfigModalProps) {
  const [sid, setSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const saveTwilioCredentialsMutation = useSaveTwilioCredentials();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const credentials: TwilioCredentials = {
      sid,
      auth_token: authToken,
      phone_number: phoneNumber,
    };

    saveTwilioCredentialsMutation.mutate(
      { agentId, credentials },
      {
        onSuccess: () => {
          onClose();
          setSid("");
          setAuthToken("");
          setPhoneNumber("");
          // TODO: Show success feedback
        },
        onError: (error: Error) => { // Explicitly type error
          console.error("Failed to save Twilio credentials:", error.message);
          // TODO: Display user-friendly error message
        },
      }
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Configure Twilio Credentials</AlertDialogTitle>
          <AlertDialogDescription>
            Enter your Twilio Account SID, Auth Token, and Phone Number for this agent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Twilio Phone Number (e.g., +1234567890)
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
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
