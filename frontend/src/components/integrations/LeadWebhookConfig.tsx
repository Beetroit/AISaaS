"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFeedback } from "@/context/FeedbackContext";
import {
  getLeadWebhookUrl,
  generateNewLeadWebhookUrl,
  deleteLeadWebhookUrl,
  LeadWebhookSecretData, // New import
} from "@/lib/api/credentials";
import { ApiError } from "@/lib/api/core";

export function LeadWebhookConfig() {
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedback();

  const { data: webhookCredential, isLoading: isLoadingWebhook } = useQuery({
    queryKey: ["leadWebhookUrl"],
    queryFn: getLeadWebhookUrl,
  });

  const generateMutation = useMutation({
    mutationFn: generateNewLeadWebhookUrl,
    onSuccess: (data) => {
      showFeedback("success", "New lead webhook URL generated successfully!");
      queryClient.setQueryData(["leadWebhookUrl"], data);
    },
    onError: (error: unknown) => { // Changed from any
      let message = "Failed to generate new webhook URL.";
      if (error instanceof ApiError) {
        message = `Failed to generate new webhook URL: ${error.message}`;
      } else if (error instanceof Error) {
        message = `Failed to generate new webhook URL: ${error.message}`;
      }
      showFeedback("failed", message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLeadWebhookUrl,
    onSuccess: () => {
      showFeedback("success", "Lead webhook URL deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["leadWebhookUrl"] });
    },
    onError: (error: unknown) => { // Changed from any
      let message = "Failed to delete lead webhook URL.";
      if (error instanceof ApiError) {
        message = `Failed to delete lead webhook URL: ${error.message}`;
      } else if (error instanceof Error) {
        message = `Failed to delete lead webhook URL: ${error.message}`;
      }
      showFeedback("failed", message);
    },
  });

  const webhookUrl = (webhookCredential?.credentials_data as LeadWebhookSecretData)?.url || "No URL generated yet.";

  if (isLoadingWebhook) {
    return <div>Loading lead webhook configuration...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="lead-webhook-url">Your Lead Intake Webhook URL</Label>
        <Input
          id="lead-webhook-url"
          value={webhookUrl}
          readOnly
          className="mt-1"
        />
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? "Generating..." : "Generate New URL"}
        </Button>
        {webhookCredential && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete URL"}
          </Button>
        )}
      </div>
    </div>
  );
}
