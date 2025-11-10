import { callApi } from "./core";
import {
  StripeCustomerCreate,
  StripeSubscriptionCreate,
  StripeSubscription,
  MessagePackage,
} from "../../types/stripe";

export async function createStripeCustomer(
  customerData: StripeCustomerCreate
): Promise<{ customer_id: string }> {
  return callApi<{ customer_id: string }>("/stripe/create-customer", {
    method: "POST",
    body: customerData,
  });
}

export async function createStripeSubscription(
  subscriptionData: StripeSubscriptionCreate
): Promise<{ subscription_id: string; client_secret: string }> {
  return callApi<{ subscription_id: string; client_secret: string }>(
    "/stripe/create-subscription",
    {
      method: "POST",
      body: subscriptionData,
    }
  );
}

export async function getCustomerPortalUrl(prevUrl: string): Promise<{ url: string }> {
  return callApi<{ url: string }>(
    `/stripe/customer-portal?prev_url=${encodeURIComponent(prevUrl)}`
  );
}

export async function getSubscriptionStatus(): Promise<{
  status: string;
  subscription?: StripeSubscription;
}> {
  return callApi<{ status: string; subscription?: StripeSubscription }>(
    "/stripe/subscription-status"
  );
}

export async function getMessagePackages(): Promise<MessagePackage[]> {
  return callApi<MessagePackage[]>("/stripe/message-packages");
}

export async function createCheckoutSession(
  priceId: string,
  prevUrl: string
): Promise<{ url: string }> {
  return callApi<{ url: string }>(
    `/stripe/create-checkout-session?price_id=${priceId}&prev_url=${encodeURIComponent(prevUrl)}`,
    {
      method: "POST",
    }
  );
}
