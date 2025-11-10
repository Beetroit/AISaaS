"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFeedback } from "@/context/FeedbackContext";

export function useStripeFeedback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showFeedback, hideFeedback } = useFeedback();

  useEffect(() => {
    const stripeStatus = searchParams.get("stripe_status");
    const errorMessage = searchParams.get("error_message"); // Assuming backend might send a message

    if (stripeStatus) {
      if (stripeStatus === "success") {
        showFeedback("success", "Your action was completed successfully!");
      } else if (stripeStatus === "failed") {
        showFeedback(
          "failed",
          errorMessage || "Your action could not be completed."
        );
      }
      // Clear the query parameters after displaying feedback
      router.replace(window.location.pathname, undefined);

      const timer = setTimeout(() => {
        hideFeedback();
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [searchParams, router, showFeedback, hideFeedback]);
}