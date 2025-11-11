"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSaveLeadMapping, useGetLeadMapping } from "../../hooks/useAgents"; // Corrected relative import
import { LeadMappingConfig } from "../../types/lead"; // Corrected relative import

interface LeadMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export default function LeadMappingModal({
  isOpen,
  onClose,
  agentId,
}: LeadMappingModalProps) {
  const { data: existingMapping, isLoading: isLoadingMapping } = useGetLeadMapping(agentId);

  const [fieldMap, setFieldMap] = useState(() => {
    if (existingMapping) {
      const mapEntries = Object.entries(existingMapping.field_map).map(([webhookField, leadField]) => ({
        webhookField,
        leadField: String(leadField),
      }));
      return mapEntries.length > 0 ? mapEntries : [{ webhookField: "", leadField: "" }];
    }
    return [{ webhookField: "", leadField: "" }];
  });

  const [defaultValues, setDefaultValues] = useState(() => {
    if (existingMapping) {
      const defaultEntries = Object.entries(existingMapping.default_values).map(([field, value]) => ({
        field,
        value: String(value),
      }));
      return defaultEntries.length > 0 ? defaultEntries : [{ field: "", value: "" }];
    }
    return [{ field: "", value: "" }];
  });

  const saveLeadMappingMutation = useSaveLeadMapping();

  const handleFieldMapChange = (index: number, key: "webhookField" | "leadField", value: string) => {
    const newFieldMap = [...fieldMap];
    newFieldMap[index][key] = value;
    setFieldMap(newFieldMap);
  };

  const addFieldMapRow = () => {
    setFieldMap([...fieldMap, { webhookField: "", leadField: "" }]);
  };

  const removeFieldMapRow = (index: number) => {
    const newFieldMap = fieldMap.filter((_, i) => i !== index);
    setFieldMap(newFieldMap);
  };

  const handleDefaultValueChange = (index: number, key: "field" | "value", value: string) => {
    const newDefaultValues = [...defaultValues];
    newDefaultValues[index][key] = value;
    setDefaultValues(newDefaultValues);
  };

  const addDefaultValueRow = () => {
    setDefaultValues([...defaultValues, { field: "", value: "" }]);
  };

  const removeDefaultValueRow = (index: number) => {
    const newDefaultValues = defaultValues.filter((_, i) => i !== index);
    setDefaultValues(newDefaultValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mappedFieldMap = fieldMap.filter(row => row.webhookField && row.leadField).reduce((acc, row) => {
      acc[row.webhookField] = row.leadField;
      return acc;
    }, {} as { [key: string]: string });

    const mappedDefaultValues = defaultValues.filter(row => row.field && row.value).reduce((acc, row) => {
      acc[row.field] = row.value;
      return acc;
    }, {} as { [key: string]: string });

    const config: LeadMappingConfig = {
      field_map: mappedFieldMap,
      default_values: mappedDefaultValues,
    };

    saveLeadMappingMutation.mutate(
      { agentId, config },
      {
        onSuccess: () => {
          onClose();
          // TODO: Show success feedback
        },
        onError: (error: Error) => { // Explicitly type error
          console.error("Failed to save lead mapping:", error.message);
          // TODO: Display user-friendly error message
        },
      }
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Configure Lead Mapping for Agent</AlertDialogTitle>
          <AlertDialogDescription>
            Define how incoming webhook fields map to lead properties and set default values.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isLoadingMapping ? (
          <p>Loading existing mapping...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <section>
              <h3 className="text-lg font-semibold mb-2">Field Mapping</h3>
              <p className="text-sm text-gray-500 mb-4">Map incoming webhook field names to your Lead model field names (e.g., `email` to `email`).</p>
              <div className="space-y-2">
                {fieldMap.map((row, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Webhook Field Name"
                      value={row.webhookField}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldMapChange(index, "webhookField", e.target.value)}
                    />
                    <span className="text-gray-500">{'->'}</span>
                    <Input
                      placeholder="Lead Field Name"
                      value={row.leadField}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldMapChange(index, "leadField", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFieldMapRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addFieldMapRow}>
                  Add Field Mapping
                </Button>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Default Values</h3>
              <p className="text-sm text-gray-500 mb-4">Set default values for Lead fields that are not provided by the webhook or to override them.</p>
              <div className="space-y-2">
                {defaultValues.map((row, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Lead Field Name"
                      value={row.field}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDefaultValueChange(index, "field", e.target.value)}
                    />
                    <Input
                      placeholder="Default Value"
                      value={row.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDefaultValueChange(index, "value", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDefaultValueRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addDefaultValueRow}>
                  Add Default Value
                </Button>
              </div>
            </section>

            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              </AlertDialogCancel>
              <Button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                disabled={saveLeadMappingMutation.isPending}
              >
                {saveLeadMappingMutation.isPending ? "Saving..." : "Save Mapping"}
              </Button>
            </AlertDialogFooter>
            {saveLeadMappingMutation.isError && (
              <p className="text-red-500 text-sm mt-2">
                Error: {saveLeadMappingMutation.error?.message}
              </p>
            )}
          </form>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
