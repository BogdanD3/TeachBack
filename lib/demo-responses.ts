// Canned responses for demo mode (DEMO_MODE=true, no API key, or API failure).
// Photosynthesis is fully scripted for the stage demo; other topics get generic fallbacks.
import type { ChatTurn, Evaluation, LessonContent, TopicContext } from "./ai-types";

type Script = { keywords: RegExp; reply: string; covers: string[] };

const photosynthesisScript: Script[] = [
  { keywords: /oxygen|o2|o₂/i, reply: "Ohh, so the oxygen I breathe is leftover from splitting water? Then what happens to the carbon dioxide?", covers: ["Where the oxygen comes from"] },
  { keywords: /calvin|rubisco|stroma|fix(es|ing)? (the )?carbon/i, reply: "Hmm, the Calvin cycle sounds fancy. What does it actually build, and why is it a cycle?", covers: [] },
  { keywords: /light.?(dependent|reaction)|atp|nadph|split(s|ting)? water|thylakoid/i, reply: "So light breaks water apart, like a tiny hammer? What happens to the pieces?", covers: ["Light-dependent reactions"] },
  { keywords: /chloroplast/i, reply: "Chloroplasts… are those like little kitchens inside the leaf? Is that where everything happens?", covers: ["Chloroplasts"] },
  { keywords: /chlorophyll|green|pigment/i, reply: "So the green stuff is a bit like a solar panel? What does it do with the light once it catches it?", covers: ["Chlorophyll captures light"] },
  { keywords: /water|carbon dioxide|co2|co₂|stomata|roots/i, reply: "Wait, so plants drink water AND breathe in air? Where does the air get in?", covers: ["Inputs: water and carbon dioxide"] },
  { keywords: /glucose|sugar|starch|energy|food/i, reply: "Ohh, so the plant makes its own snack and saves some for later? Is the sugar the food, or the energy?", covers: ["Glucose as stored energy"] },
];

const photosynthesisOpenings = [
  "So plants eat sunlight? Do they have a tiny mouth for it somewhere?",
  "Wait, I'm a bit lost. What goes into the plant, and what comes out?",
];

const genericReplies = [
  "Hmm, I think I follow, but can you give me a really simple example?",
  "Wait, what does that word mean? I've never heard it before.",
  "Ohh, okay! So what happens right after that step?",
  "I'm a bit confused. Why does it work that way and not the other way around?",
  "So basically it's like… magic? Can you explain the part in the middle again?",
  "That makes sense! What's the next big idea I should know?",
];

function wordsOf(name: string): string[] {
  return name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 4);
}

export function demoPipReply(topic: TopicContext, history: ChatTurn[], alreadyCovered: string[]): { reply: string; covered: string[] } {
  const teacherTurns = history.filter((t) => t.role === "teacher");
  const last = teacherTurns.at(-1)?.content ?? "";
  const covered = new Set(alreadyCovered);

  if (topic.slug === "photosynthesis") {
    const fresh = (s: Script) => s.covers.length === 0 || s.covers.some((c) => !covered.has(c));
    const hit =
      photosynthesisScript.find((s) => s.keywords.test(last) && fresh(s)) ?? photosynthesisScript.find((s) => s.keywords.test(last));
    if (hit) {
      hit.covers.forEach((c) => covered.add(c));
      return { reply: hit.reply, covered: [...covered] };
    }
    return { reply: photosynthesisOpenings[teacherTurns.length % photosynthesisOpenings.length], covered: [...covered] };
  }

  // Generic: a concept counts as covered when the teacher used one of its key words in a long-ish message.
  for (const c of topic.concepts) {
    if (last.length > 40 && wordsOf(c.name).some((w) => last.toLowerCase().includes(w))) covered.add(c.name);
  }
  return { reply: genericReplies[teacherTurns.length % genericReplies.length], covered: [...covered] };
}

function quote(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 140 ? t.slice(0, 137).trimEnd() + "…" : t;
}

function findEvidence(teacher: string[], re: RegExp | string[]): string {
  const hit = teacher.find((m) => (Array.isArray(re) ? re.some((w) => m.toLowerCase().includes(w)) : re.test(m)));
  return hit ? quote(hit) : "";
}

export function demoEvaluation(topic: TopicContext, history: ChatTurn[]): Evaluation {
  const teacher = history.filter((t) => t.role === "teacher").map((t) => t.content);

  if (topic.slug === "photosynthesis") {
    const fb: Record<string, [Evaluation["concepts"][number]["state"], string, string]> = {
      "Chlorophyll captures light": ["understood", "Chlorophyll is the green pigment that catches sunlight.", "Clear link between the pigment and capturing light energy."],
      "Inputs: water and carbon dioxide": ["understood", "Plants take in water through their roots and carbon dioxide from the air.", "You named both inputs and where they come from."],
      Chloroplasts: ["understood", "It all happens inside the chloroplasts in the leaf cells.", "Good — you placed the process in the right organelle."],
      "Light-dependent reactions": ["understood", "Light energy is used to split water and make ATP.", "You explained what the light stage produces, in your own words."],
      "Where the oxygen comes from": ["shaky", "The plant breathes out oxygen as a waste product.", "Right that it's a by-product, but you didn't say it comes from splitting water, not from CO₂."],
      "Calvin cycle": ["gap", "", "You didn't explain how CO₂ is turned into sugar, or why it's a cycle."],
      "Glucose as stored energy": ["understood", "The plant makes glucose, which it uses for energy or stores as starch.", "Clear on what the sugar is for."],
    };
    const keys: Record<string, RegExp> = {
      "Chlorophyll captures light": /chlorophyll|green/i,
      "Inputs: water and carbon dioxide": /water|carbon dioxide|co2/i,
      Chloroplasts: /chloroplast/i,
      "Light-dependent reactions": /atp|split|light.?(reaction|dependent)/i,
      "Where the oxygen comes from": /oxygen/i,
      "Glucose as stored energy": /glucose|sugar|starch/i,
    };
    const concepts = topic.concepts.map((c) => {
      const [state, fallbackQuote, feedback] = fb[c.name] ?? ["gap", "", "Not covered in this session."];
      const ev = state === "gap" ? "" : (keys[c.name] && findEvidence(teacher, keys[c.name])) || fallbackQuote;
      return { name: c.name, state, evidence: ev, feedback };
    });
    return {
      concepts,
      pip_summary: "I get the light part now! But I still don't get the Calvin cycle — how does the plant actually turn air into sugar?",
      score: concepts.filter((c) => c.state === "understood").length,
    };
  }

  const concepts = topic.concepts.map((c) => {
    const ev = findEvidence(teacher, wordsOf(c.name));
    const state = !ev ? "gap" : ev.length > 80 ? "understood" : "shaky";
    const feedback =
      state === "understood" ? "Clear and in your own words." : state === "shaky" ? "You mentioned it, but the explanation was too short to be sure." : "This concept didn't come up in the session.";
    return { name: c.name, state, evidence: ev, feedback } as const;
  });
  const missing = concepts.find((c) => c.state !== "understood");
  return {
    concepts,
    pip_summary: missing ? `I think I'm still fuzzy on ${missing.name.toLowerCase()}. Could you explain it again with an example?` : "I think I really get it now. Thanks, teacher!",
    score: concepts.filter((c) => c.state === "understood").length,
  };
}

const calvinLesson: LessonContent = {
  title: "The Calvin cycle: turning air into sugar",
  gap_summary: "You explained the light stage well, but not how the plant uses that energy to build sugar from CO₂.",
  body:
    "You already said that light splits water and makes **ATP**. That's the energy half. The Calvin cycle is the building half.\n\n" +
    "In the **stroma** of the chloroplast, an enzyme called **RuBisCO** grabs CO₂ from the air and sticks it onto a five-carbon molecule. The result splits into three-carbon pieces.\n\n" +
    "Then the ATP and NADPH from the light stage are spent to turn those pieces into a simple sugar (G3P). Most of the G3P is used to rebuild the five-carbon starter molecule, so the process can grab the next CO₂. That's why it's a **cycle**.\n\n" +
    "Only one in six G3P molecules leaves the cycle. Two of those make one glucose.",
  example:
    "Think of a bakery: the light stage charges the ovens (ATP, NADPH). The Calvin cycle is the baker, taking flour from the air (CO₂) and baking it into bread (sugar), while keeping some dough as a starter for the next batch.",
  questions: [
    {
      question: "Where does the carbon in the plant's sugar come from?",
      options: ["Water from the roots", "Carbon dioxide from the air", "Minerals in the soil"],
      correct_index: 1,
      explanation: "RuBisCO fixes CO₂ from the air; water provides electrons and the oxygen, not the carbon.",
    },
    {
      question: "Why is the Calvin cycle called a cycle?",
      options: ["It only runs at night", "It repeats every 24 hours", "It rebuilds its starting molecule so it can run again"],
      correct_index: 2,
      explanation: "Most G3P is recycled into the five-carbon starter molecule, so the loop keeps going.",
    },
  ],
};

export function demoLesson(topic: TopicContext, conceptName: string, feedback: string): LessonContent {
  if (topic.slug === "photosynthesis" && conceptName === "Calvin cycle") return calvinLesson;
  const concept = topic.concepts.find((c) => c.name === conceptName);
  const desc = concept?.description ?? `${conceptName} is a key idea in ${topic.title}.`;
  const others = topic.concepts.filter((c) => c.name !== conceptName);
  return {
    title: conceptName,
    gap_summary: feedback || `${conceptName} was missing or unclear in your explanation.`,
    body: `${desc}\n\nWhen you explain this to Pip, start with **what it is**, then **why it matters** for ${topic.title}, and finish with one example. Short sentences beat jargon.\n\nA good test: could a 12-year-old repeat your explanation back in their own words? If not, find the one word they wouldn't know and explain it first.`,
    example: `Try a one-line version first: "${desc.split(".")[0]}." Then add one everyday comparison.`,
    questions: [
      {
        question: `Which statement best describes "${conceptName}"?`,
        options: [desc, others[0]?.description ?? "It isn't part of this topic.", others[1]?.description ?? "It only matters in exams."],
        correct_index: 0,
        explanation: desc,
      },
      {
        question: "What makes an explanation to a beginner work best?",
        options: ["Using the technical terms exactly as in the textbook", "Plain words plus one concrete example", "Listing every detail you know"],
        correct_index: 1,
        explanation: "Beginners need the idea first; terms and details can follow.",
      },
    ],
  };
}
