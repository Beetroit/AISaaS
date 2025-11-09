"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStatus } from "../../hooks/useAuth";
import DashboardShell from "../../components/dashboard/DashboardShell"; // Import DashboardShell

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: isAuthenticated, isLoading } = useAuthStatus();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/"); // Redirect to home page if not authenticated
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a loading spinner, or a message
  }

  return <DashboardShell>{children}</DashboardShell>; // Wrap children with DashboardShell
}
