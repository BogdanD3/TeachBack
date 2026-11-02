// Offline checks for Pip streaming: tag hiding on arbitrary chunk boundaries, and the
// "fail before first token → fallback → demo" path (run with a fake key and no network).
//   node --import tsx scripts/stream-check.ts
import assert from "node:assert/strict";
import { pipReplyStream, visiblePipText } from "../lib/ai";
import { demoPipReply } from "../lib/demo-responses";

const full = "Ohh, so plants are like solar panels? Where does the water go?\n<covered>Chlorophyll captures light|Inputs: water and carbon dioxide</covered>";
// Every split point: the visible text never contains any part of the tag and only grows.
for (let cut = 0; cut <= full.length; cut++) {
  let prev = "";
  for (const part of [full.slice(0, cut), full]) {
    const v = visiblePipText(part);
    assert.ok(!v.includes("<"), `tag leaked at cut ${cut}: ${JSON.stringify(v)}`); // the only "<" in `full` is the tag's
    assert.ok(v.startsWith(prev), `visible text shrank at cut ${cut}`);
    prev = v;
  }
}
assert.equal(visiblePipText("x < y and"), "x < y and", "a plain '<' is kept");
console.log("ok   visiblePipText hides <covered> at every chunk boundary");

const topic = {
  slug: "photosynthesis",
  title: "Photosynthesis",
  concepts: ["Chlorophyll captures light", "Inputs: water and carbon dioxide", "Chloroplasts"].map((name) => ({ name, description: name })),
};
const history = [{ role: "teacher" as const, content: "Chlorophyll, the green pigment, captures light energy." }];

async function main() {
  const t0 = Date.now();
  let text = "";
  let deltas = 0;
  let firstAt = 0;
  let done: { reply: string; covered: string[]; source: string } | null = null;
  for await (const ev of pipReplyStream(topic, history)) {
    if (ev.type === "delta") {
      deltas++;
      firstAt ||= Date.now() - t0;
      text += ev.text;
    } else done = ev.result;
  }
  assert.ok(done, "stream ends with done");
  assert.equal(done.source, "demo", "falls back to demo mode when every model fails");
  assert.equal(text.trim(), done.reply, "streamed text equals the final reply");
  assert.equal(done.reply, demoPipReply(topic, history, []).reply);
  assert.ok(deltas > 5, "demo reply arrives word by word");
  assert.deepEqual(done.covered, ["Chlorophyll captures light"]);
  console.log(`ok   failure before first token → demo, streamed in ${deltas} pieces (first ${firstAt} ms, done ${Date.now() - t0} ms)`);
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
