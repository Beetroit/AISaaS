import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserMe, loginUser, logoutUser, registerUser } from "../lib/api/auth";
import { getAuthToken } from "../lib/api/core";
import { Token, UserResponse } from "../types/auth";

// --- Mutations ---

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<Token, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => loginUser(email, password),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authStatus"] });
      queryClient.invalidateQueries({ queryKey: ["userMe"] })
      // Optionally, redirect to dashboard or update UI
      console.log("Login successful:", data);
      // window.location.href = "/dashboard"
    },
    onError: (error) => {
      console.error("Login failed:", error.message);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => registerUser(email, password),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authStatus"] });
      console.log("Registration successful:", data);
      // Optionally, switch to login form or show success message
    },
    onError: (error) => {
      console.error("Registration failed:", error.message);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => {
      logoutUser();
      return Promise.resolve()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authStatus"] });
      queryClient.invalidateQueries({ queryKey: ["userMe"] })
      // Optionally, redirect to home page
      console.log("Logout successful");
      // window.location.href = "/"
    },
    onError: (error) => {
      console.error("Logout failed:", error.message);
    },
  });
}

// --- Queries ---

export function useAuthStatus() {
  return useQuery<boolean, Error>({
    queryKey: ["authStatus"],
    queryFn: () => {
      const token = getAuthToken();
      return Promise.resolve(!!token)
    },
    staleTime: Infinity,
  });
}

export function useUserMe() {
  const { data: isAuthenticated } = useAuthStatus();
  return useQuery<UserResponse, Error>({
    queryKey: ["userMe"],
    queryFn: fetchUserMe,
    enabled: isAuthenticated,
  });
}
