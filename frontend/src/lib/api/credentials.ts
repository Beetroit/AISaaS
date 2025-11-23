import { TwilioCredentials } from "../../types/agent";
import { AppCredential, CredentialCreate, CredentialUpdate } from "../../types/credential";
import { LeadMappingConfig } from "../../types/lead";
import { callApi } from "./core";

export interface LeadWebhookSecretData extends Record<string, unknown> {
  url: string;
  secret: string;
}

export async function createCredential(credential: CredentialCreate): Promise<AppCredential> {
  return callApi<AppCredential>("/credentials/", {
    method: "POST",
    body: credential,
  });
}

export async function getCredentials(): Promise<AppCredential[]> {
  return callApi<AppCredential[]>("/credentials/");
}

export async function getCredential(credentialId: string): Promise<AppCredential> {
  return callApi<AppCredential>(`/credentials/${credentialId}`);
}

export async function updateCredential(credentialId: string, credential: CredentialUpdate): Promise<AppCredential> {
  return callApi<AppCredential>(`/credentials/${credentialId}`, {
    method: "PUT",
    body: credential,
  });
}

export async function deleteCredential(credentialId: string): Promise<void> {
  return callApi<void>(`/credentials/${credentialId}`, {
    method: "DELETE",
  });
}

// --- Twilio Specific API Calls ---
export async function saveTwilioCredentials(
  credentials: TwilioCredentials
): Promise<AppCredential> {
  // Use the dedicated Twilio endpoint for creating/updating credentials
  // Note: userId is not needed here - backend gets it from authentication token
  return callApi<AppCredential>("/credentials/twilio", {
    method: "POST",
    body: {
      twilio_account_sid: credentials.twilio_account_sid,
      twilio_auth_token: credentials.twilio_auth_token,
      identifier: credentials.identifier,
      channel: credentials.channel,
    },
  });
}

export async function getTwilioCredentials(): Promise<AppCredential | null> {
  try {
    // Use the dedicated Twilio endpoint to get credentials
    // Note: userId is not needed here - backend gets it from authentication token
    const response = await callApi<AppCredential>("/credentials/twilio", {
      method: "GET",
    });
    return response;
  } catch (error: unknown) {
    // If no credentials found, return null
    const err = error as { status?: number; message?: string };
    if (err.status === 404 || err.message?.includes("not found")) {
      return null;
    }
    throw error;
  }
}

export async function deleteTwilioCredentials(): Promise<void> {
  try {
    await callApi<void>("/credentials/twilio", {
      method: "DELETE",
    });
  } catch (error: unknown) {
    // If credentials not found, ignore the error
    const err = error as { status?: number; message?: string };
    if (err.status === 404 || err.message?.includes("not found")) {
      return;
    }
    throw error;
  }
}

// --- Lead Webhook Specific API Calls ---
export async function getLeadWebhookUrl(userId: string): Promise<AppCredential | null> {
  const credentials = await getCredentials();
  return (
    credentials.find(
      (cred) => cred.credential_type === "lead_webhook" && cred.user_id === userId
    ) || null
  );
}

export async function generateNewLeadWebhookUrl(userId: string): Promise<AppCredential> {
  const existingCredentials = await getCredentials();
  const leadWebhookCredential = existingCredentials.find(
    (cred) => cred.credential_type === "lead_webhook" && cred.user_id === userId
  );

  // This would typically be an API call to the backend to generate a new secret and URL
  // For now, we'll simulate it or assume the backend handles the generation on create/update
  const newSecret = Math.random().toString(36).substring(2, 15); // Simulate a new secret
  const newUrl = `https://api.example.com/webhooks/lead/${userId}?secret=${newSecret}`; // Simulate a new URL

  const webhookData: LeadWebhookSecretData = { url: newUrl, secret: newSecret };

  if (leadWebhookCredential) {
    return updateCredential(leadWebhookCredential.id, {
      credentials_data: webhookData,
    });
  } else {
    return createCredential({
      credential_type: "lead_webhook",
      credentials_data: webhookData,
    });
  }
}

export async function deleteLeadWebhookUrl(userId: string): Promise<void> {
  const credentials = await getCredentials();
  const leadWebhookCredential = credentials.find(
    (cred) => cred.credential_type === "lead_webhook" && cred.user_id === userId
  );
  if (leadWebhookCredential) {
    await deleteCredential(leadWebhookCredential.id);
  }
}

// --- Lead Mapping Specific API Calls ---
export async function getLeadMapping(userId: string): Promise<AppCredential | null> {
  const credentials = await getCredentials();
  return (
    credentials.find(
      (cred) => cred.credential_type === "lead_mapping" && cred.user_id === userId
    ) || null
  );
}

export async function saveLeadMapping(
  userId: string,
  config: LeadMappingConfig
): Promise<AppCredential> {
  const existingCredentials = await getCredentials();
  const leadMappingCredential = existingCredentials.find(
    (cred) => cred.credential_type === "lead_mapping" && cred.user_id === userId
  );

  if (leadMappingCredential) {
    return updateCredential(leadMappingCredential.id, {
      credentials_data: config as unknown as Record<string, unknown>,
    });
  } else {
    return createCredential({
      credential_type: "lead_mapping",
      credentials_data: config as unknown as Record<string, unknown>,
    });
  }
}
