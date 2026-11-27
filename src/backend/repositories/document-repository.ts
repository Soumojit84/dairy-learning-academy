import "server-only";
import type { createSupabaseServerClient } from "@/backend/infrastructure/supabase/server-client";

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function createDocumentAccessUrl(client: ServerClient, documentId: string) {
  const { data: document, error } = await client.from("documents").select("storage_path").eq("id", documentId).maybeSingle();
  if (error || !document) return null;

  const { data, error: storageError } = await client.storage
    .from("study-materials")
    .createSignedUrl(document.storage_path, 60);
  if (storageError || !data) return null;
  return data.signedUrl;
}