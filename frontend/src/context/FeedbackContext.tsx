"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

type FeedbackType = "success" | "failed";

interface FeedbackState {
  show: boolean;
  type: FeedbackType;
  message: string;
}

interface FeedbackContextType {
  feedback: FeedbackState | null;
  showFeedback: (type: FeedbackType, message: string) => void;
  hideFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(
  undefined
);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const showFeedback = useCallback((type: FeedbackType, message: string) => {
    setFeedback({ show: true, type, message });
  }, []);

  const hideFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return (
    <FeedbackContext.Provider value={{ feedback, showFeedback, hideFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
  
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}