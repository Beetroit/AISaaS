"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

// Define the structure of a single workflow step
export interface WorkflowStep {
  id: string; // Use a unique ID for each step for React keys
  type: "ask_question" | "process_answer" | "schedule_appointment" | "product_discussion";
  // Add other fields based on step type
  question?: string;
  // ... other potential fields
}

interface WorkflowEditorProps {
  steps: WorkflowStep[];
  onStepsChange: (steps: WorkflowStep[]) => void;
}

export const WorkflowEditor = ({
  steps,
  onStepsChange,
}: WorkflowEditorProps) => {
  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`, // Simple unique ID generation
      type: "ask_question", // Default to asking a question
      question: "",
    };
    onStepsChange([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    onStepsChange(steps.filter((step) => step.id !== id));
  };

  const updateStep = (id: string, newValues: Partial<WorkflowStep>) => {
    onStepsChange(
      steps.map((step) => (step.id === id ? { ...step, ...newValues } : step))
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Workflow Editor</h3>
      <Accordion type="multiple" className="w-full">
        {steps.map((step, index) => (
          <AccordionItem value={step.id} key={step.id}>
            <AccordionTrigger className="flex justify-between">
              <span>Step {index + 1}: {step.type.replace("_", " ")}</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`type-${step.id}`}>Step Type</Label>
                  <select
                    id={`type-${step.id}`}
                    value={step.type}
                    onChange={(e) =>
                      updateStep(step.id, {
                        type: e.target.value as WorkflowStep["type"],
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="ask_question">Ask Question</option>
                    <option value="process_answer">Process Answer</option>
                    <option value="schedule_appointment">Schedule Appointment</option>
                    <option value="product_discussion">Product Discussion</option>
                  </select>
                </div>
              </div>

              {step.type === "ask_question" && (
                <div>
                  <Label htmlFor={`question-${step.id}`}>Question</Label>
                  <Input
                    id={`question-${step.id}`}
                    value={step.question || ""}
                    onChange={(e) =>
                      updateStep(step.id, { question: e.target.value })
                    }
                    placeholder="e.g., What is your budget?"
                  />
                </div>
              )}
              
              {/* Add fields for other step types here */}

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeStep(step.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button onClick={addStep}>Add Step</Button>
    </div>
  );
};
