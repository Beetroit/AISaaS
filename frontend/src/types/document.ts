export interface KnowledgeBaseDocumentBase {
  filename: string;
  content_hash: string;
  user_id: string;
  agent_id?: string | null;
}

export interface KnowledgeBaseDocumentCreate extends KnowledgeBaseDocumentBase {}

export interface KnowledgeBaseDocumentResponse extends KnowledgeBaseDocumentBase {
  id: string;
  created_at: string; // datetime serialized as ISO string
  updated_at: string; // datetime serialized as ISO string
}
