import { callApi } from "./core";
import { User } from "../../types/user";

export async function getUserCredits(): Promise<number> {
  return callApi<number>("/auth/users/me/credits");
}

export async function getMe(): Promise<User> {
  return callApi<User>("/auth/users/me");
}