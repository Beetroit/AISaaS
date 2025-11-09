const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"; // Default to localhost if not set
console.log("Frontend API Base URL:", API_BASE_URL);

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
  body?: any;
  isFormData?: boolean;
}

export async function callApi<T>(
  endpoint: string,
  config?: ApiConfig
): Promise<T> {
  const { method = "GET", body, isFormData = false } = config || {};
  const token = getAuthToken(); // Use the helper function
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let requestBody: BodyInit | null = null;

  if (body) {
    if (isFormData) {
      requestBody = body; // body is already FormData
    } else {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: requestBody,
  });

  if (response.status === 401) {
    console.error("Unauthorized: Token might be expired or invalid. Removing token.");
    removeAuthToken(); // Remove invalid token
    // Optionally, trigger a global logout event or redirect
    // window.location.href = '/login'; // Example redirect
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "API call failed");
  }

  return response.json() as Promise<T>;
}
