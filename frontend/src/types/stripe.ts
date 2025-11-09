export interface StripeProduct {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  metadata: Record<string, any>;
}

export interface StripePrice {
  id: string;
  product: string; // ID of the product this price is for
  active: boolean;
  unit_amount?: number | null; // Amount in cents
  currency: string;
  type: string; // e.g., 'recurring', 'one_time'
  recurring?: Record<string, any> | null; // Details for recurring prices
  metadata: Record<string, any>;
}

// Frontend will call our backend to create these, so these are request bodies for our backend
export interface StripeCustomerCreate {
  email: string;
  name?: string | null;
}

export interface StripeSubscriptionCreate {
  price_id: string;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number; // Unix timestamp
  cancel_at_period_end: boolean;
  items: Array<Record<string, any>>;
}

export interface MessagePackage {
  id: string;
  name: string;
  description?: string | null;
  price_id: string;
  unit_amount?: number | null;
  currency: string;
}
