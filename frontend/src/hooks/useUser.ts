import { useQuery } from "@tanstack/react-query";
import { getUserCredits } from "../lib/api/user";

export function useUserCredits() {
  return useQuery<number, Error>({
    queryKey: ["userCredits"],
    queryFn: getUserCredits,
  });
}