export interface AppCredentialBase {
    credential_type: string;
    credentials_data: Record<string, unknown>;
    allow_concurrent_use?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CredentialCreate extends AppCredentialBase { }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CredentialUpdate extends Partial<AppCredentialBase> { }

export interface AppCredential extends AppCredentialBase {
    id: string;
    user_id: string;
    identifier?: string | null;
    channel?: string;
    created_at: string;
    updated_at: string;
}

export type Credential = AppCredential;
