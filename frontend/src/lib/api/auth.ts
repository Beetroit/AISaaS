import { callApi, setAuthToken, removeAuthToken } from "./core";
import { Token, UserResponse } from "../../types/auth";

export async function loginUser(email: string, password: string): Promise<Token> {
  const formData = new FormData();
  formData.append("username", email); // Backend expects 'username' for OAuth2PasswordRequestForm
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

export function logoutUser(): void {
  removeAuthToken();
}
