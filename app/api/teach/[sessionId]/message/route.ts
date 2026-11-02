import { z } from "zod";
import { pipReplyStream } from "@/lib/ai";
import { apiError, botGuard, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiRateLimit } from "@/lib/rate-limit";
import { findTopic, splitCovered, toTopicContext } from "@/lib/topics";

const schema = z.object({ content: z.string().trim().min(1, "Write something to Pip first.").max(2000, "Keep it under 2000 characters.") });

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const blocked = await botGuard(req, "ai_message");
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Please log in again.");

  const rl = aiRateLimit(user.id);
  if (!rl.ok) return apiError(429, "rate_limited", `Pip needs a breather. Try again in ${rl.retryAfterSec}s.`, { retryAfter: rl.retryAfterSec });

  const { data, error } = await parseBody(req, schema);
  if (error) return error;

  const { sessionId } = await params;
  const session = await db.teachSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!session || session.userId !== user.id) return apiError(404, "not_found", "This session doesn't exist.");
  if (session.status !== "active") return apiError(409, "finished", "This session is already finished.");

  const topic = await findTopic(session.topicId);
  if (!topic) return apiError(404, "not_found", "Topic not found.");

  await db.message.create({ data: { teachSessionId: session.id, role: "teacher", content: data.content } });
  const history = [...session.messages.map((m) => ({ role: m.role as "teacher" | "pip", content: m.content })), { role: "teacher" as const, content: data.content }];

  // NDJSON stream: {"type":"delta","text":"…"} lines while Pip "types", then one
  // {"type":"done",id,reply,covered,confused,source} line once the reply is saved.
  const events = pipReplyStream(toTopicContext(topic), history, splitCovered(session.covered));
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (obj: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          open = false; // client went away; keep going so the reply is still saved
        }
      };
      try {
        for await (const ev of events) {
          if (ev.type === "delta") {
            send(ev);
            continue;
          }
          const r = ev.result;
          const pipMsg = await db.message.create({ data: { teachSessionId: session.id, role: "pip", content: r.reply, confused: r.confused } });
          await db.teachSession.update({ where: { id: session.id }, data: { covered: r.covered.join("|") } });
          send({ type: "done", id: pipMsg.id, reply: r.reply, covered: r.covered, confused: r.confused, source: r.source });
        }
      } catch (e) {
        console.error("[teach] message stream failed", e instanceof Error ? e.message : e);
        send({ type: "error", message: "Pip lost the thread. Send that again?" });
      } finally {
        if (open) controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
}
