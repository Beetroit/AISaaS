'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchRevenueAnalytics, fetchPricingPlans } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function RevenuePage() {
    const { data: analytics } = useQuery({
        queryKey: ['admin-revenue'],
        queryFn: fetchRevenueAnalytics,
    });

    const { data: plansData } = useQuery({
        queryKey: ['admin-pricing-plans'],
        queryFn: fetchPricingPlans,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Management</h1>
                <p className="text-gray-500 mt-1">System-wide revenue analytics and pricing plans</p>
            </div>

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${analytics?.total || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Iniciador
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${analytics?.by_plan?.['Iniciador'] || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Negocio Pro
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${analytics?.by_plan?.['Negocio Pro'] || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pricing Plans */}
            <Card>
                <CardHeader>
                    <CardTitle>Pricing Plans</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {plansData?.plans?.map((plan: { id: string; name: string; description: string; credits: number; price: string; is_active: boolean }) => (
                            <div key={plan.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm"><span className="font-medium">Credits:</span> {plan.credits}</p>
                                            <p className="text-sm"><span className="font-medium">Price:</span> {plan.price}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {plan.is_active ? '✓ Active' : '✗ Inactive'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
