import "server-only";
import { createSupabaseServerClient } from "@/backend/infrastructure/supabase/server-client";
import { getAdminDashboardCounts, getStudentDashboardCounts } from "@/backend/repositories/dashboard-repository";
import { getProfileRole } from "@/backend/repositories/profile-repository";

export type DashboardResult =
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "ok"; email: string | null; fullName: string; metrics: Array<{ label: string; count: number | null }> };

export async function getDashboard(admin: boolean): Promise<DashboardResult> {
  const client = await createSupabaseServerClient();
  if (!client) return { status: "unconfigured" };

  const { data: { user } } = await client.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  if (admin) {
    if (await getProfileRole(client, user.id) !== "admin") return { status: "forbidden" };
    return {
      status: "ok",
      email: user.email ?? null,
      fullName: String(user.user_metadata.full_name ?? ""),
      metrics: await getAdminDashboardCounts(client),
    };
  }

  const counts = await getStudentDashboardCounts(client, user.id);
  return {
    status: "ok",
    email: user.email ?? null,
    fullName: String(user.user_metadata.full_name ?? ""),
    metrics: [
      { label: "Enrolled products", count: counts.enrollmentCount },
      { label: "Test attempts", count: counts.testCount },
      { label: "Learning progress", count: null },
    ],
  };
}