import { NextResponse } from "next/server";
import { SERVER_NAME, SERVER_VERSION } from "@/src/mcp/server";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(
    { status: "ok", service: SERVER_NAME, version: SERVER_VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
