# Frontend Component Overview

This directory contains the Next.js application, which provides the user interface for the AgentSync Pro application. It interacts with the FastAPI backend to display data, manage user input, and handle various client-side functionalities.

## Key Files and Directories:

*   `src/app/layout.tsx`: The root layout component for the Next.js application, setting up global providers (e.g., theme, context), fonts, and global styles.
*   `src/app/page.tsx`: The main landing page component of the application.
*   `src/components/`: Contains reusable React components, including UI components built with `shadcn/ui` (leveraging Radix UI primitives).
*   `src/context/`: Manages global state and context providers (e.g., `FeedbackContext.tsx`).
*   `src/hooks/`: Custom React hooks for encapsulating logic, particularly for data fetching and state management using `TanStack Query` and `Zustand`. Examples include `useAuth.ts`, `useStripe.ts`, `useAgents.ts`.
*   `src/lib/api/`: Contains utility functions and client-side API calls for interacting with the FastAPI backend.
*   `src/types/`: Defines TypeScript interfaces and types for data structures used throughout the frontend, ensuring type safety.
*   `next.config.ts`: Configuration file for Next.js, handling aspects like image optimization, environment variables, and build settings.
*   `tailwind.config.ts`: Configuration for Tailwind CSS, defining design tokens, plugins, and custom styles.
*   `package.json`: Lists project metadata, scripts, and all frontend dependencies.

## Dependencies:

*   **Next.js:** React framework for building server-rendered and static web applications.
*   **React:** JavaScript library for building user interfaces.
*   **TypeScript:** Statically typed superset of JavaScript for enhanced code quality.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
*   **shadcn/ui:** Collection of reusable components built on Radix UI and styled with Tailwind CSS.
*   **Radix UI:** Low-level UI component primitives for building accessible design systems.
*   **TanStack Query (React Query):** Powerful asynchronous state management library for data fetching, caching, and synchronization.
*   **Zustand:** A small, fast, and scalable bear-bones state-management solution.
*   **React Hook Form:** Flexible and extensible forms with easy-to-use validation.
*   **Zod:** TypeScript-first schema declaration and validation library.
*   **Lucide React:** A collection of beautiful & consistent icons.
*   **Next-Themes:** Theme provider for Next.js applications.
*   **Sonner:** An opinionated toast component for React.

## Interactions:

*   **FastAPI Backend:** Communicates with the backend via RESTful API calls to fetch and send data, authenticate users, and trigger backend processes.
*   **User:** Provides an interactive and responsive user interface for managing agents, documents, leads, and other application features.

## Important Notes:

*   **Component-Based Architecture:** Follows a component-based approach for UI development, promoting reusability and maintainability.
*   **Type Safety:** Heavily relies on TypeScript for strong type checking across the application.
*   **Modern Tooling:** Utilizes modern frontend development tools and libraries for an efficient development workflow.
*   **Theming:** Supports light and dark themes via `next-themes`.
*   **Data Fetching:** Leverages `TanStack Query` for efficient and robust data fetching and caching.
