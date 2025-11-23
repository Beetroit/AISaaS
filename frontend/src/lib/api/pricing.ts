import { get } from "./core";

export interface PricingPlan {
    id: string;
    name: string;
    description: string;
    credits: number;
    price: string;
    features: string[];
    popular: boolean;
    stripe_price_id?: string;
    is_active: boolean;
}

export interface PricingPlanCreate {
    name: string;
    description?: string;
    credits: number;
    price: number;
    features: string[];
    popular: boolean;
}

export interface PricingPlanUpdate {
    name?: string;
    description?: string;
    credits?: number;
    price?: number;
    features?: string[];
    popular?: boolean;
    is_active?: boolean;
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
    return get<PricingPlan[]>("/pricing/plans");
}
