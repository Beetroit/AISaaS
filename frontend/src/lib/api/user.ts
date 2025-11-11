import { callApi } from "./core";

export async function getUserCredits(): Promise<number> {
  return callApi<number>("/auth/users/me/credits");
}