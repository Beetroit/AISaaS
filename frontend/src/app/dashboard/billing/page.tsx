"use client";

import React from 'react';
import {
  useSubscriptionStatus,
  useMessagePackages,
  useCreateStripeSubscription,
  useCreateCheckoutSession,
  useGetCustomerPortalUrl,
} from '../../../hooks/useStripe';
import { ApiError } from '../../../lib/api/core'; // Import ApiError

export default function BillingPage() {
  const { data: subscriptionStatus, isLoading: isLoadingSubscription, isError: isErrorSubscription, error: errorSubscription } = useSubscriptionStatus();
  const { data: messagePackages, isLoading: isLoadingPackages, isError: isErrorPackages, error: errorPackages } = useMessagePackages();

  const createSubscriptionMutation = useCreateStripeSubscription();
  const createCheckoutSessionMutation = useCreateCheckoutSession();
  const getCustomerPortalUrlMutation = useGetCustomerPortalUrl();

  const handleSubscribe = (priceId: string) => {
    createSubscriptionMutation.mutate({ price_id: priceId });
  };

  const handlePurchasePackage = (priceId: string) => {
    createCheckoutSessionMutation.mutate(priceId);
  };

  const handleManageBilling = () => {
    getCustomerPortalUrlMutation.mutate();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Billing & Subscriptions</h2>

      {/* Subscription Status */}
      <div className="mb-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h3 className="text-xl font-bold mb-2">Subscription Status</h3>
        {isLoadingSubscription && <p>Loading subscription status...</p>}
        {isErrorSubscription && <p className="text-red-500">Error: {errorSubscription?.message}</p>}
        {subscriptionStatus && (
          <div>
            <p>
              Status:{" "}
              {subscriptionStatus.status === "no_subscription"
                ? "Free"
                : subscriptionStatus.status}
            </p>
            {subscriptionStatus.subscription && (
              <>
                <p>Plan: {subscriptionStatus.subscription.items[0]?.price?.id || 'N/A'}</p>
                <p>Renews: {new Date(subscriptionStatus.subscription.current_period_end * 1000).toLocaleDateString()}</p>
              </>
            )}
            <button
              onClick={handleManageBilling}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={getCustomerPortalUrlMutation.isPending}
            >
              {getCustomerPortalUrlMutation.isPending ? "Redirecting..." : "Manage Billing"}
            </button>
          </div>
        )}
      </div>

      {/* Message Packages */}
      <div className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h3 className="text-xl font-bold mb-2">Purchase Message Packages</h3>
        {isLoadingPackages && <p>Loading packages...</p>}
        {isErrorPackages && (
          <p className="text-red-500">
            {errorPackages instanceof ApiError && errorPackages.statusCode === 404
              ? "No message packages available currently."
              : errorPackages?.message || "Error loading message packages."}
          </p>
        )}
        {messagePackages && messagePackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {messagePackages.map((pkg) => (
              <div key={pkg.id} className="border p-4 rounded-md">
                <h4 className="font-semibold">{pkg.name}</h4>
                <p>{pkg.description}</p>
                <p className="text-lg font-bold">
                  {pkg.unit_amount !== null && pkg.unit_amount !== undefined
                    ? (pkg.unit_amount / 100).toFixed(2)
                    : "N/A"}{" "}
                  {pkg.currency.toUpperCase()}
                </p>
                <button
                  onClick={() => handlePurchasePackage(pkg.price_id)}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  disabled={createCheckoutSessionMutation.isPending}
                >
                  {createCheckoutSessionMutation.isPending ? "Processing..." : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No message packages available.</p>
        )}
      </div>
    </div>
  );
}
