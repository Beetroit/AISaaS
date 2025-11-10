export interface KnowledgeBaseDocumentBase {
  filename: string;
  content_hash: string;
  user_id: string;
  agent_id?: string | null;
  status: string;
}

export interface KnowledgeBaseDocumentCreate extends KnowledgeBaseDocumentBase {
  _?: never
}

export interface KnowledgeBaseDocumentResponse extends KnowledgeBaseDocumentBase {
  id: string;
  created_at: string
  updated_at: string
}
