"use client";

import { useUser } from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TwilioCredentials } from "../../types/agent";
import { Credential } from "../../types/credential";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFeedback } from "@/context/FeedbackContext";
import { ApiError } from "@/lib/api/core";
import {
  deleteTwilioCredentials,
  getTwilioCredentials,
  saveTwilioCredentials,
} from "@/lib/api/credentials";

const formSchema = z.object({
  account_sid: z.string().min(1, "Account SID is required"),
  auth_token: z.string().min(1, "Auth Token is required"),
  identifier: z.string().min(1, "Identifier is required"),
  channel: z.enum(["whatsapp", "facebook", "instagram"]),
});

export function TwilioConfigForm() {
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedback();
  const { user } = useUser();
  const userId = user?.id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_sid: "",
      auth_token: "",
      identifier: "",
      channel: "whatsapp",
    },
  });

  const { data: existingCredentials, isLoading: isLoadingCredentials } = useQuery<Credential | null>({
    queryKey: ["twilioCredentials", userId],
    queryFn: () => getTwilioCredentials(),
    enabled: !!userId,
  });

  useEffect(() => {
    if (existingCredentials && existingCredentials.credentials_data) {
      const twilioData = existingCredentials.credentials_data as TwilioCredentials;
      form.reset({
        account_sid: twilioData.twilio_account_sid,
        auth_token: twilioData.twilio_auth_token,
        identifier: twilioData.identifier || (twilioData.twilio_phone_number as string), // Fallback for old data
        channel: (twilioData.channel as "whatsapp" | "facebook" | "instagram") || "whatsapp",
      });
    }
  }, [existingCredentials, form]);

  const saveMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const twilioCreds: TwilioCredentials = {
        twilio_account_sid: data.account_sid,
        twilio_auth_token: data.auth_token,
        identifier: data.identifier,
        channel: data.channel,
      };
      return saveTwilioCredentials(twilioCreds);
    },
    onSuccess: () => {
      showFeedback("success", "Twilio credentials saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["twilioCredentials"] });
    },
    onError: (error: unknown) => { // Changed from any
      let message = "Failed to save Twilio credentials.";
      if (error instanceof ApiError) {
        message = `Failed to save Twilio credentials: ${error.message}`;
      } else if (error instanceof Error) {
        message = `Failed to save Twilio credentials: ${error.message}`;
      }
      showFeedback("failed", message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      return deleteTwilioCredentials();
    },
    onSuccess: () => {
      showFeedback("success", "Twilio credentials deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["twilioCredentials"] });
      form.reset({
        account_sid: "",
        auth_token: "",
        identifier: "",
        channel: "whatsapp",
      });
    },
    onError: (error: unknown) => { // Changed from any
      let message = "Failed to delete Twilio credentials.";
      if (error instanceof ApiError) {
        message = `Failed to delete Twilio credentials: ${error.message}`;
      } else if (error instanceof Error) {
        message = `Failed to delete Twilio credentials: ${error.message}`;
      }
      showFeedback("failed", message);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    saveMutation.mutate(values);
  }

  const channelValue = form.watch("channel");

  const getIdentifierLabel = () => {
    switch (channelValue) {
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

  if (isLoadingCredentials) {
    return <div>Loading Twilio configuration...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="facebook">Facebook Messenger</option>
                  <option value="instagram">Instagram</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="account_sid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account SID</FormLabel>
              <FormControl>
                <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="auth_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auth Token</FormLabel>
              <FormControl>
                <Input type="password" placeholder="your_auth_token" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{getIdentifierLabel()}</FormLabel>
              <FormControl>
                <Input placeholder="Identifier" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Credentials"}
          </Button>
          {existingCredentials && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Credentials"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
