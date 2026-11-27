import "server-only";
import type { createSupabaseServerClient } from "@/backend/infrastructure/supabase/server-client";

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function getStudentDashboardCounts(client: ServerClient, studentId: string) {
  const [enrollments, attempts] = await Promise.all([
    client.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    client.from("test_attempts").select("id", { count: "exact", head: true }).eq("student_id", studentId),
  ]);

  return { enrollmentCount: enrollments.count ?? 0, testCount: attempts.count ?? 0 };
}

export async function getAdminDashboardCounts(client: ServerClient) {
  const [students, products, documents, questions, tests, payments] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    client.from("products").select("id", { count: "exact", head: true }),
    client.from("documents").select("id", { count: "exact", head: true }),
    client.from("questions").select("id", { count: "exact", head: true }),
    client.from("mock_tests").select("id", { count: "exact", head: true }),
    client.from("payments").select("id", { count: "exact", head: true }),
  ]);

  return [
    { label: "Registered students", count: students.count },
    { label: "Products", count: products.count },
    { label: "Study documents", count: documents.count },
    { label: "Questions", count: questions.count },
    { label: "Mock tests", count: tests.count },
    { label: "Payment records", count: payments.count },
  ];
}