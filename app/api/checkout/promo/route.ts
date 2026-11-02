import { z } from "zod";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { discounted, findPlan } from "@/lib/plans";
import { checkPromo } from "@/lib/promo";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ code: z.string().trim().min(1, "Enter a code.").max(32), plan: z.enum(["pro", "team"]) });

export async function POST(req: Request) {
  const blocked = await botGuard(req, "apply_promo");
  if (blocked) return blocked;
  // Code guessing brake, independent of BotLens.
  if (!rateLimit(`promo:${clientIp(req.headers)}`, 15, 60_000).ok) return apiError(429, "rate_limited", "Too many tries. Wait a minute.");

  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const plan = findPlan(data.plan)!;
  const res = await checkPromo(data.code);
  if (!res.ok) return apiError(422, "invalid_promo", res.message, { fields: { code: res.message } });
  return json({
    code: res.promo.code,
    description: res.promo.description,
    percentOff: res.promo.percentOff,
    totalCents: discounted(plan.priceCents, res.promo.percentOff),
  });
}
