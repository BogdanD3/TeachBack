// Smoke test for lib/ai.ts: Pip reply, evaluation and lesson for Photosynthesis.
// Run: bash scripts/ai-smoke.sh   (uses DEMO_MODE=true unless you pass a real env)
import { evaluateSession, generateLesson, pipReply, parsePipText } from "../lib/ai";
import type { ChatTurn } from "../lib/ai-types";
import { topics } from "../prisma/seed-data/topics";

const seed = topics.find((t) => t.slug === "photosynthesis")!;
const topic = { slug: seed.slug, title: seed.title, concepts: seed.concepts.map(([name, description]) => ({ name, description })) };

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok  ", msg);
}

async function main() {
  const parsed = parsePipText("Ohh, so it's like a solar panel?\n<covered>chlorophyll captures LIGHT|Nonsense</covered>", topic.concepts.map((c) => c.name));
  assert(parsed.reply === "Ohh, so it's like a solar panel?" && parsed.covered.join() === "Chlorophyll captures light", "covered tag parsed and stripped");

  const history: ChatTurn[] = [
    { role: "pip", content: "Hi! I'm Pip." },
    { role: "teacher", content: "Plants use chlorophyll, the green pigment, to catch sunlight." },
  ];
  const r = await pipReply(topic, history);
  console.log("     pip:", r.reply, "| covered:", r.covered, "| source:", r.source, r.model ?? "");
  assert(r.reply.length > 0 && !r.reply.includes("<covered>"), "pip reply is clean");

  history.push({ role: "pip", content: r.reply }, { role: "teacher", content: "The oxygen comes out when light splits water inside the chloroplasts." });
  const ev = await evaluateSession(topic, history);
  assert(ev.concepts.length === topic.concepts.length, `evaluation covers all ${topic.concepts.length} concepts (score ${ev.score}, source ${ev.source})`);

  const gap = ev.concepts.find((c) => c.state === "gap") ?? ev.concepts[0];
  const lesson = await generateLesson(topic, gap);
  assert(lesson.questions.length >= 1 && lesson.body.length > 50, `lesson "${lesson.title}" with ${lesson.questions.length} questions (source ${lesson.source})`);
}

main();
