"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFeedback } from "@/context/FeedbackContext";
import {
  saveTwilioCredentials,
  getTwilioCredentials,
  deleteTwilioCredentials,
  TwilioCredentials,
  TwilioCredentialResponse,
} from "@/lib/api/credentials";
import { ApiError } from "@/lib/api/core";

const formSchema = z.object({
  account_sid: z.string().min(1, "Account SID is required"),
  auth_token: z.string().min(1, "Auth Token is required"),
  whatsapp_number: z.string().min(1, "WhatsApp Number is required"),
});

export function TwilioConfigForm() {
  const queryClient = useQueryClient();
  const { showFeedback } = useFeedback();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_sid: "",
      auth_token: "",
      whatsapp_number: "",
    },
  });

  const { data: existingCredentials, isLoading: isLoadingCredentials } = useQuery<TwilioCredentialResponse | null>({ // Updated type
    queryKey: ["twilioCredentials"],
    queryFn: getTwilioCredentials,
  });

  useEffect(() => {
    if (existingCredentials && existingCredentials.credentials_data) {
      const twilioData = existingCredentials.credentials_data as TwilioCredentials;
      form.reset({
        account_sid: twilioData.account_sid,
        auth_token: twilioData.auth_token,
        whatsapp_number: twilioData.whatsapp_number,
      });
    }
  }, [existingCredentials, form]);

  const saveMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) =>
      saveTwilioCredentials(data.account_sid, data.auth_token, data.whatsapp_number),
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
    mutationFn: deleteTwilioCredentials,
    onSuccess: () => {
      showFeedback("success", "Twilio credentials deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["twilioCredentials"] });
      form.reset({
        account_sid: "",
        auth_token: "",
        whatsapp_number: "",
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

  if (isLoadingCredentials) {
    return <div>Loading Twilio configuration...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="whatsapp_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp Number (e.g., +1234567890)</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
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
