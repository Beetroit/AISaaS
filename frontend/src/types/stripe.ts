
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface StripeProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
}


export interface StripePrice {
  id: string;
  product: string
  active: boolean;
  unit_amount?: number | null
  currency: string;
  type: string
  recurring?: Record<string, JsonValue> | null
  metadata: Record<string, JsonValue>;
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
  current_period_end: number
  cancel_at_period_end: boolean;
  items: Array<Record<string, JsonValue>>;
}

export interface MessagePackage {
  id: string;
  name: string;
  description?: string | null;
  price_id: string;
  unit_amount?: number | null;
  currency: string;
}
