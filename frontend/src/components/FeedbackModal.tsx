import { CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={feedback.show} onOpenChange={hideFeedback}>
      <DialogContent>
        <DialogHeader className="flex flex-col items-center">
          <Icon className={`h-16 w-16 mb-4 ${iconColor}`} />
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {feedback.message}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}