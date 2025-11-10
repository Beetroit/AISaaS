import { Token, UserResponse } from "../../types/auth";
import { callApi, removeAuthToken, setAuthToken } from "./core";

export async function loginUser(email: string, password: string): Promise<Token> {
  const formData = new FormData();
  formData.append("username", email)
  formData.append("password", password);

  const token = await callApi<Token>("/auth/token", {
    method: "POST",
    body: formData,
    isFormData: true,
  });

  setAuthToken(token.access_token);
  return token;
}

export async function registerUser(email: string, password: string): Promise<UserResponse> {
  const user = await callApi<UserResponse>("/auth/register", {
    method: "POST",
    body: { email, password },
  });
  return user;
}

export async function fetchUserMe(): Promise<UserResponse> {
  return callApi<UserResponse>("/users/me");
}

export function logoutUser(): void {
  removeAuthToken();
}
