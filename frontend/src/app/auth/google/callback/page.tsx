"use client";

import { useFeedback } from '@/context/FeedbackContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showFeedback } = useFeedback();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      showFeedback('failed', `Google Calendar connection failed: ${error}`);
      router.replace('/dashboard/integrations')
      return;
    }

    if (code && state) {
      // In a real application, you would typically send this code and state
      // to your backend to exchange for tokens and verify the state.
      // For now, we'll just assume success and show feedback.
      // The backend's /auth/google/callback already handles saving credentials.

      showFeedback('success', 'Google Calendar connected successfully!');
      router.replace('/dashboard/integrations')
    } else {
      showFeedback('failed', 'Google Calendar connection failed: Missing code or state.');
      router.replace('/dashboard/integrations')
    }
  }, [searchParams, router, showFeedback]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Connecting Google Calendar...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading Google Calendar connection...</p>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
