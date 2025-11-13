import { ApiError, callApi } from "./core";

export interface TwilioCredentials {
  account_sid: string;
  auth_token: string;
  whatsapp_number: string;
}

export interface LeadWebhookSecretData {
  secret: string;
  agent_id: string;
  url: string;
}

export interface CredentialResponse {
  id: string;
  user_id: string;
  credential_type: string;
  credentials_data: TwilioCredentials | LeadWebhookSecretData
  created_at: string;
  updated_at: string;
}

export interface TwilioCredentialResponse extends Omit<CredentialResponse, 'credentials_data'> {
  credentials_data: TwilioCredentials;
}

export async function saveTwilioCredentials(
  accountSid: string,
  authToken: string,
  whatsappNumber: string
): Promise<TwilioCredentialResponse> {
  return callApi<TwilioCredentialResponse>("/credentials/twilio", {
    method: "POST",
    body: {
      account_sid: accountSid,
      auth_token: authToken,
      whatsapp_number: whatsappNumber,
    },
  });
}

export async function getTwilioCredentials(): Promise<TwilioCredentialResponse | null> {
  try {
    return await callApi<TwilioCredentialResponse>("/credentials/twilio");
  } catch (error: unknown) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }
    throw error;
  }
}

export async function deleteTwilioCredentials(): Promise<void> {
  return callApi<void>("/credentials/twilio", {
    method: "DELETE",
  });
}

export async function getLeadWebhookUrl(): Promise<CredentialResponse | null> {
  try {
    return await callApi<CredentialResponse>("/credentials/lead-webhook");
  } catch (error: unknown) { // Changed from any
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }
    throw error;
  }
}

export async function generateNewLeadWebhookUrl(): Promise<CredentialResponse> {
  return await callApi<CredentialResponse>("/credentials/lead-webhook/generate", {
    method: "POST",
  });
}

export async function deleteLeadWebhookUrl(): Promise<void> {
  return callApi<void>("/credentials/lead-webhook", {
    method: "DELETE",
  });
}
