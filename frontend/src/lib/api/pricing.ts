import { get } from "./core";

export interface PricingPlan {
    id: string;
    name: string;
    description: string;
    credits: number;
    price: string;
    features: string[];
    popular: boolean;
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
    return get<PricingPlan[]>("/pricing/plans");
}
