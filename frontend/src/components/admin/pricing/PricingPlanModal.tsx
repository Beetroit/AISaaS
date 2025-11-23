import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PricingPlan, PricingPlanCreate, PricingPlanUpdate } from "@/lib/api/pricing";
import { createPricingPlan, updatePricingPlan } from "@/lib/api/admin";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface PricingPlanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan?: PricingPlan | null;
    onSave: () => void;
}

export function PricingPlanModal({
    open,
    onOpenChange,
    plan,
    onSave,
}: PricingPlanModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PricingPlanCreate>({
        name: "",
        description: "",
        credits: 0,
        price: 0,
        features: [],
        popular: false,
    });
    const [newFeature, setNewFeature] = useState("");

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name,
                description: plan.description,
                credits: plan.credits,
                price: parseFloat(plan.price), // Convert string price to number
                features: plan.features || [],
                popular: plan.popular,
            });
        } else {
            setFormData({
                name: "",
                description: "",
                credits: 0,
                price: 0,
                features: [],
                popular: false,
            });
        }
    }, [plan, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (plan) {
                const updates: PricingPlanUpdate = {
                    ...formData,
                };
                await updatePricingPlan(plan.id, updates);
                toast.success("Pricing plan updated successfully");
            } else {
                await createPricingPlan(formData);
                toast.success("Pricing plan created successfully");
            }
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save pricing plan");
        } finally {
            setLoading(false);
        }
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData({
                ...formData,
                features: [...formData.features, newFeature.trim()],
            });
            setNewFeature("");
        }
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...formData.features];
        newFeatures.splice(index, 1);
        setFormData({ ...formData, features: newFeatures });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{plan ? "Edit Pricing Plan" : "Create Pricing Plan"}</DialogTitle>
                    <DialogDescription>
                        {plan
                            ? "Update the details of the pricing plan. Changes will be synced to Stripe."
                            : "Create a new pricing plan. This will create a product and price in Stripe."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (USD)</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="credits">Credits</Label>
                            <Input
                                id="credits"
                                type="number"
                                min="0"
                                value={formData.credits}
                                onChange={(e) =>
                                    setFormData({ ...formData, credits: parseInt(e.target.value) })
                                }
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Switch
                                id="popular"
                                checked={formData.popular}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, popular: checked })
                                }
                            />
                            <Label htmlFor="popular">Mark as Popular</Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Features</Label>
                        <div className="flex space-x-2">
                            <Input
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                placeholder="Add a feature..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addFeature();
                                    }
                                }}
                            />
                            <Button type="button" onClick={addFeature} size="icon" variant="outline">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                            {formData.features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-secondary/50 p-2 rounded-md text-sm"
                                >
                                    <span>{feature}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeFeature(index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {plan ? "Update Plan" : "Create Plan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
