import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStripeCustomer,
  createStripeSubscription,
  getCustomerPortalUrl,
  getAccountStatus,
  getMessagePackages,
  createCheckoutSession,
} from "../lib/api/stripe";

import {
  StripeCustomerCreate,
  StripeSubscriptionCreate,
  MessagePackage,
} from "../types/stripe";

// --- Queries ---

export function useAccountStatus() {
  return useQuery<{ status: string; credits: number; plan_name: string }, Error>({
    queryKey: ["accountStatus"],
    queryFn: getAccountStatus,
  });
}

export function useMessagePackages() {
  return useQuery<MessagePackage[], Error>({
    queryKey: ["messagePackages"],
    queryFn: getMessagePackages,
  });
}

// --- Mutations ---

export function useCreateStripeCustomer() {
  const queryClient = useQueryClient();
  return useMutation<{ customer_id: string }, Error, StripeCustomerCreate>({
    mutationFn: (customerData: StripeCustomerCreate) =>
      createStripeCustomer(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountStatus"] });
    },
  });
}

export function useCreateStripeSubscription() {
  const queryClient = useQueryClient();
  return useMutation<
    { subscription_id: string; client_secret: string },
    Error,
    StripeSubscriptionCreate
  >({
    mutationFn: (subscriptionData: StripeSubscriptionCreate) =>
      createStripeSubscription(subscriptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
    },
  });
}

export function useGetCustomerPortalUrl() {
  return useMutation<{ url: string }, Error, void>({
    mutationFn: () => getCustomerPortalUrl(window.location.href),
    onSuccess: (data) => {
      // Optionally redirect the user to the portal URL
      window.location.href = data.url;
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation<{ url: string }, Error, string>({
    mutationFn: (priceId: string) =>
      createCheckoutSession(priceId, window.location.href),
    onSuccess: (data) => {
      // Optionally redirect the user to the checkout URL
      window.location.href = data.url;
    },
  });
}
