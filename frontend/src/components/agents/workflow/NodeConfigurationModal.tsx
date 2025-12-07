"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NodeType } from "@/types/workflow";
import { LeadExtractionConfig, type LeadField } from "./nodes/LeadExtractionConfig";

interface NodeConfigurationModalProps {
  nodeId: string;
  nodeData: Record<string, unknown>;
  nodeTypeSchema: NodeType;
  onSave: (nodeId: string, newData: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodeConfigurationModal({
  nodeId,
  nodeData,
  nodeTypeSchema,
  onSave,
  onClose,
}: NodeConfigurationModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(nodeData);

  useEffect(() => {
    setFormData(nodeData);
  }, [nodeData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(nodeId, formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Node: {nodeTypeSchema.name}</DialogTitle>
          <DialogDescription>{nodeTypeSchema.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Input Schema Display */}
          <div className="space-y-2">
            <h3 className="text-md font-semibold">Inputs</h3>
            {Object.entries(nodeTypeSchema.inputs).map(([key, type]) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right">
                  {key} ({type})
                </Label>
                {type === "string" && (
                  <Input
                    id={key}
                    name={key}
                    value={(formData[key] as string) || ""}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                )}
                {type === "number" && (
                  <Input
                    id={key}
                    name={key}
                    type="number"
                    value={(formData[key] as number) || 0}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                )}
                {/* Add more types as needed: boolean, object, array */}
                {/* For 'object' or 'array', a Textarea or a more complex component might be needed */}
                {/* Special handling for Lead Extraction 'fields' */}
                {nodeTypeSchema.type === "lead_extraction" && key === "fields" ? (
                  <div className="col-span-4">
                    <LeadExtractionConfig
                      fields={(formData[key] as LeadField[]) || []}
                      onChange={(newFields) =>
                        setFormData((prev) => ({ ...prev, [key]: newFields }))
                      }
                    />
                  </div>
                ) : (
                  <>
                    {/* Generic handling for other types */}
                    {(type === "object" || type === "array") && (
                      <Textarea
                        id={key}
                        name={key}
                        value={JSON.stringify(formData[key] || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            setFormData((prev) => ({
                              ...prev,
                              [key]: JSON.parse(e.target.value),
                            }));
                          } catch (error) {
                            // Handle invalid JSON input
                            console.error("Invalid JSON input:", error);
                          }
                        }}
                        className="col-span-3"
                        rows={4}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Output Schema Display */}
          <div className="space-y-2">
            <h3 className="text-md font-semibold">Outputs</h3>
            {Object.entries(nodeTypeSchema.outputs).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Label className="w-1/3">{key} ({value})</Label>
                <span className="w-2/3 text-sm text-gray-500">{value}</span>
              </div>
            ))}
          </div>

          {/* Dynamic Form Fields for nodeData - Placeholder for now */}
          {/* Will be generated based on nodeTypeSchema.inputs in a later step */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
