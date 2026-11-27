import { NextResponse } from "next/server";
import { getAuthorizedDocumentUrl } from "@/backend/services/document-access-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAuthorizedDocumentUrl(id);
  if (result.status !== 200) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store, private" } });
  return NextResponse.json({ url: result.url }, { headers: { "Cache-Control": "no-store, private" } });
}