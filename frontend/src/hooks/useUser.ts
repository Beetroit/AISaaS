import { useQuery } from "@tanstack/react-query";
import { getUserCredits, getMe } from "../lib/api/user";
import { User } from "../types/user";

export function useUserCredits() {
  return useQuery<number, Error>({
    queryKey: ["userCredits"],
    queryFn: getUserCredits,
  });
}

export function useUser() {
  const { data: user, isLoading, error } = useQuery<User, Error>({
    queryKey: ["currentUser"],
    queryFn: getMe,
  });

  return { user, isLoading, error };
}