import { z } from "zod";
import { transcribeAudio } from "@/lib/ai";
import { apiError, botGuard, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiRateLimit } from "@/lib/rate-limit";
import { findTopic, toTopicContext } from "@/lib/topics";

// 60 s of Opus/AAC from MediaRecorder is well under 1 MB; 4 MB leaves room for less efficient codecs.
const MAX_BYTES = 4 * 1024 * 1024;
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/wav", "audio/x-m4a"];

const schema = z.object({
  sessionId: z.string().min(1).max(64),
  audio: z
    .instanceof(File, { message: "Attach a recording." })
    .refine((f) => f.size > 0, "The recording is empty.")
    .refine((f) => f.size <= MAX_BYTES, "That recording is too long. Keep it under a minute.")
    .refine((f) => AUDIO_TYPES.includes(f.type.split(";")[0].trim().toLowerCase()), "Unsupported audio format."),
});

/** Speech to text for the teach session's mic button. The text goes into the input; the user sends it. */
export async function POST(req: Request) {
  const blocked = await botGuard(req, "ai_message");
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Please log in again.");
  const rl = aiRateLimit(user.id);
  if (!rl.ok) return apiError(429, "rate_limited", `Pip needs a breather. Try again in ${rl.retryAfterSec}s.`, { retryAfter: rl.retryAfterSec });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError(400, "invalid_input", "Send the recording as form data.");
  }
  const parsed = schema.safeParse({ sessionId: form.get("sessionId"), audio: form.get("audio") });
  if (!parsed.success) return apiError(400, "invalid_input", parsed.error.issues[0]?.message ?? "Invalid recording.");

  const session = await db.teachSession.findUnique({ where: { id: parsed.data.sessionId }, select: { userId: true, topicId: true } });
  if (!session || session.userId !== user.id) return apiError(404, "not_found", "This session doesn't exist.");
  const topic = await findTopic(session.topicId);
  if (!topic) return apiError(404, "not_found", "Topic not found.");

  const { audio } = parsed.data;
  const base64 = Buffer.from(await audio.arrayBuffer()).toString("base64");
  const result = await transcribeAudio(toTopicContext(topic), { base64, mimeType: audio.type.split(";")[0].trim().toLowerCase() });
  return json(result);
}
