import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

export interface LeadField {
    name: string;
    description: string;
    required: boolean;
}

interface LeadExtractionConfigProps {
    fields: LeadField[];
    onChange: (fields: LeadField[]) => void;
}

export function LeadExtractionConfig({ fields = [], onChange }: LeadExtractionConfigProps) {
    const handleAddField = () => {
        onChange([...fields, { name: "", description: "", required: true }]);
    };

    const handleRemoveField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        onChange(newFields);
    };

    const handleFieldChange = (index: number, key: keyof LeadField, value: string | boolean) => {
        const newFields = [...fields];
        // Use type assertion or a more specific update logic if needed, but for now this is safe enough with the union type
        newFields[index] = { ...newFields[index], [key]: value };
        onChange(newFields);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Fields to Extract</Label>
                <Button onClick={handleAddField} size="sm" variant="outline" className="h-8">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                </Button>
            </div>

            {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    No fields configured. Click &quot;Add Field&quot; to start.
                </p>
            )}

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 border rounded-md bg-card">
                        <div className="grid gap-3 flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor={`field-name-${index}`} className="text-xs">Name</Label>
                                    <Input
                                        id={`field-name-${index}`}
                                        placeholder="e.g. email"
                                        value={field.name}
                                        onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`field-desc-${index}`} className="text-xs">Description</Label>
                                    <Input
                                        id={`field-desc-${index}`}
                                        placeholder="e.g. User's email address"
                                        value={field.description}
                                        onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`field-required-${index}`}
                                    checked={field.required}
                                    onCheckedChange={(checked) => handleFieldChange(index, "required", checked === true)}
                                />
                                <Label htmlFor={`field-required-${index}`} className="text-sm font-normal cursor-pointer">
                                    Required field
                                </Label>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10 mt-1"
                            onClick={() => handleRemoveField(index)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
