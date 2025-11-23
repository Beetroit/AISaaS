"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    MoreHorizontal,
    Plus,
    Pencil,
    Trash2,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { PricingPlan } from "@/lib/api/pricing";
import { fetchPricingPlans, deletePricingPlan } from "@/lib/api/admin";
import { PricingPlanModal } from "@/components/admin/pricing/PricingPlanModal";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPricingPage() {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await fetchPricingPlans();
            setPlans(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load pricing plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleCreate = () => {
        setSelectedPlan(null);
        setModalOpen(true);
    };

    const handleEdit = (plan: PricingPlan) => {
        setSelectedPlan(plan);
        setModalOpen(true);
    };

    const handleDeleteClick = (plan: PricingPlan) => {
        setPlanToDelete(plan);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!planToDelete) return;

        try {
            await deletePricingPlan(planToDelete.id);
            toast.success("Pricing plan deactivated successfully");
            loadPlans();
        } catch (error) {
            console.error(error);
            toast.error("Failed to deactivate pricing plan");
        } finally {
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pricing Plans</h2>
                    <p className="text-muted-foreground">
                        Manage pricing plans and sync with Stripe.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Create Plan
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Credits</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Stripe ID</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No pricing plans found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{plan.name}</span>
                                                {plan.popular && (
                                                    <Badge variant="secondary" className="w-fit mt-1 text-[10px]">
                                                        Popular
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>${plan.price}</TableCell>
                                        <TableCell>{plan.credits}</TableCell>
                                        <TableCell>
                                            {plan.is_active ? (
                                                <div className="flex items-center text-green-600">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-muted-foreground">
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Inactive
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {plan.stripe_price_id || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEdit(plan)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {plan.is_active && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(plan)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <PricingPlanModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                plan={selectedPlan}
                onSave={loadPlans}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will deactivate the pricing plan "{planToDelete?.name}". It will no
                            longer be available for purchase, but existing subscriptions may continue.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
