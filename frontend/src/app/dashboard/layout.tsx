"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { useAuthStatus } from "../../hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: isAuthenticated, isLoading } = useAuthStatus();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
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
    return null
  }

  return <DashboardShell>{children}</DashboardShell>
}
