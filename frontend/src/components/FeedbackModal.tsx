"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFeedback } from "@/context/FeedbackContext";

export function FeedbackModal() {
  const { feedback, hideFeedback } = useFeedback();

  if (!feedback) {
    return null;
  }

  const isSuccess = feedback.type === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;
  const iconColor = isSuccess ? "text-green-500" : "text-red-500";
  const title = isSuccess ? "Success!" : "Error!";

  return (
    <AlertDialog open={feedback.show} onOpenChange={hideFeedback}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center">
          <Icon className={`h-16 w-16 mb-4 ${iconColor}`} />
          <AlertDialogTitle className="text-2xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {feedback.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}