import "server-only";
import { createSupabaseServerClient } from "@/backend/infrastructure/supabase/server-client";
import { createDocumentAccessUrl } from "@/backend/repositories/document-repository";

export async function getAuthorizedDocumentUrl(documentId: string) {
  const client = await createSupabaseServerClient();
  if (!client) return { status: 503 as const, error: "Document service is not configured." };

  const { data: { user } } = await client.auth.getUser();
  if (!user) return { status: 401 as const, error: "Sign in required." };

  const url = await createDocumentAccessUrl(client, documentId);
  if (!url) return { status: 404 as const, error: "Document not found or access denied." };
  return { status: 200 as const, url };
}