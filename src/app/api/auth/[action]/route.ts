import { NextResponse } from "next/server";
import { AuthServiceError, executeAuthAction, type AuthAction } from "@/backend/auth/auth-service";

const authActions = new Set<AuthAction>(["login", "register", "reset-password", "update-password", "signout"]);

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!authActions.has(action as AuthAction)) return NextResponse.json({ error: "Unknown authentication action." }, { status: 404 });

  let payload: unknown = {};
  if (action !== "signout") {
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
  }

  try {
    const result = await executeAuthAction(action as AuthAction, payload);
    if (action === "signout") return NextResponse.redirect(new URL(result.redirectTo ?? "/login", request.url), { status: 303 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "Authentication request failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}