"use client";

import { useFeedback } from "@/context/FeedbackContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function useStripeFeedback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showFeedback, hideFeedback } = useFeedback();

  useEffect(() => {
    const stripeStatus = searchParams.get("stripe_status");
    const errorMessage = searchParams.get("error_message")

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
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [searchParams, router, showFeedback, hideFeedback]);
}