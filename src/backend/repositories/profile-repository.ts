import "server-only";
import type { createSupabaseServerClient } from "@/backend/infrastructure/supabase/server-client";

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function getProfileRole(client: ServerClient, userId: string) {
  const { data } = await client.from("profiles").select("role").eq("id", userId).is("suspended_at", null).maybeSingle();
  return data?.role ?? null;
}