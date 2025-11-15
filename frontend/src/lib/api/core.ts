const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
console.log("Frontend API Base URL:", API_BASE_URL);

// Custom Error class to include status code and structured errors
export class ApiError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Helper functions for token management
export function setAuthToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem("access_token");
}

export function removeAuthToken() {
  localStorage.removeItem("access_token");
}

interface ApiConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: object | FormData;
  isFormData?: boolean;
}

export async function callApi<T>(
  endpoint: string,
  config?: ApiConfig
): Promise<T> {
  const { method = "GET", body, isFormData = false } = config || {};
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let requestBody: BodyInit | null = null;

  if (body) {
    if (isFormData) {
      requestBody = body as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body as object);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: requestBody,
  });

  if (response.status === 401) {
    console.error("Unauthorized: Token might be expired or invalid. Removing token.");
    removeAuthToken();
    window.location.href = '/';
    throw new ApiError("Unauthorized. Please log in again.", response.status);
  }

  if (method === "GET" && response.status === 404) {
    return null as T;
  }

  if (!response.ok) {
    try {
      const errorData = await response.json();
      // Handle Pydantic validation errors, which come in an 'errors' array
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const errorMessage = errorData.errors.join(", ");
        throw new ApiError(errorMessage, response.status, errorData.errors);
      }
      // Handle other structured errors with 'message' or 'detail'
      const message = errorData.message || errorData.detail || "An unknown API error occurred.";
      throw new ApiError(message, response.status);
    } catch {
      // If the body isn't JSON or another error occurs
      throw new ApiError(response.statusText || "Failed to fetch", response.status);
    }
  }

  // Handle successful but empty responses (e.g., 204 No Content)
  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function get<T>(endpoint: string): Promise<T> {
  return callApi<T>(endpoint, { method: "GET" });
}