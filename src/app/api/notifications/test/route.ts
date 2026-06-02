import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * Stub notification route — replaced during ChaseDream Studio build.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ sent: true, message: "Notifications are configured per-project." });
}
