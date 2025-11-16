"use client";

import {
  Calendar,
  CreditCard,
  Database,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Play,
  Plug,
  Settings,
  Users,
  Workflow
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuthStatus, useLogout, useUserMe } from "../../hooks/useAuth";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const logoutMutation = useLogout();
  const { data: isAuthenticated, isLoading } = useAuthStatus();
  const { data: user, isLoading: isLoadingUser } = useUserMe();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  if (isLoading || isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
        <div className="text-2xl font-bold text-blue-600 mb-8">HelixAI</div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-2">
              <Link
                href="/dashboard"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/agents"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Users className="mr-3 h-5 w-5" />
                Agents
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/workflows"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Workflow className="mr-3 h-5 w-5" />
                Workflows
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/workflow-runs"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Play className="mr-3 h-5 w-5" />
                Workflow Runs
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/documents"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <FileText className="mr-3 h-5 w-5" />
                Documents
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/credentials"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Database className="mr-3 h-5 w-5" />
                Credentials
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/leads"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <DollarSign className="mr-3 h-5 w-5" />
                Leads
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/appointments"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Calendar className="mr-3 h-5 w-5" />
                Appointments
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/reports"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Settings className="mr-3 h-5 w-5" />
                Reports
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/billing"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <CreditCard className="mr-3 h-5 w-5" />
                Billing
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/dashboard/integrations"
                className="flex items-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Plug className="mr-3 h-5 w-5" />
                Integrations
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center pb-6 border-b border-gray-200 dark:border-gray-700 mb-8">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          {/* User Info / Settings */}
          <div>
            {user && <span className="text-gray-700 dark:text-gray-300">{user.email}</span>}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
