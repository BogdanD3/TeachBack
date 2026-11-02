import { json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { seatInfo } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return json({ now: new Date().toISOString(), events: await seatInfo(user?.id) }, 200, { "Cache-Control": "no-store" });
}
