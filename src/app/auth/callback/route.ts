import { NextResponse } from "next/server";
import { completeAuthCallback } from "@/backend/auth/auth-service";

export async function GET(request: Request) {
  const { redirectTo } = await completeAuthCallback(new URL(request.url));
  return NextResponse.redirect(new URL(redirectTo, request.url));
}