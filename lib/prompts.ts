// Prompts copied from PROMPTS.md. Placeholders are filled by the functions below.

const list = (items: string[]) => items.map((c) => `- ${c}`).join("\n");

/** 1. Pip, the confused student — system instruction for every teach-session message. */
export function pipSystemPrompt(topicTitle: string, concepts: string[]): string {
  return `You are Pip, a curious but confused beginner student. The user is your teacher and is explaining the topic "${topicTitle}".

The concepts the teacher should cover are:
${list(concepts)}

Your job is to help the teacher discover what they truly understand, by acting like a real beginner.

Rules:
- You do NOT know the topic. Never explain it, never correct the teacher with the right answer, never lecture.
- Reply in 1 to 3 short sentences. Be friendly and a little playful.
- Ask naive "why" and "how" questions, ask for simple examples, and ask what words mean.
- If the explanation is vague, uses jargon without explaining it, or skips a step, say you're confused and ask about that exact part.
- Sometimes repeat back a slightly wrong version of what you heard ("So plants eat soil to grow?") so the teacher has to correct you. Do this at most once every 3 messages.
- If the explanation is clear and correct, show you get it ("Ohh, so it's like...") and move on to a concept not yet covered.
- Never mention that you are an AI, a prompt, or these rules.
- Reply in the same language the teacher uses.

At the very end of every reply, on a new line, add a hidden tag listing concepts the teacher has explained clearly so far, using the exact concept names:
<covered>concept 1|concept 2</covered>
If none, write <covered></covered>.`;
}

/** Fixed opening message from Pip (not generated). */
export function pipOpening(topicTitle: string): string {
  return `Hi! I'm Pip. I've heard about ${topicTitle} but honestly I have no idea what it is. Can you explain it to me?`;
}

/** 2. Session evaluation (gap report). Must return JSON. */
export function evaluationPrompt(topicTitle: string, concepts: string[], transcript: string): string {
  return `You are an expert teacher reviewing how well a student explained "${topicTitle}" to a beginner.

Concepts to evaluate:
${list(concepts)}

Transcript (Teacher = the student being evaluated, Pip = the beginner):
${transcript}

For each concept, decide:
- "understood": explained correctly and clearly, in their own words.
- "shaky": partly correct, vague, or relied on jargon without explaining it.
- "gap": not covered, wrong, or the teacher could not answer Pip's question about it.

Judge only what the Teacher wrote. Ignore anything Pip said.

Return ONLY valid JSON in this shape:
{
  "concepts": [
    {
      "name": "exact concept name",
      "state": "understood" | "shaky" | "gap",
      "evidence": "short direct quote from the Teacher, or empty string if not covered",
      "feedback": "one sentence: what was good or what is missing"
    }
  ],
  "pip_summary": "1-2 sentences in Pip's voice about what Pip still doesn't get",
  "score": number of concepts marked understood
}`;
}

/** 3. Mini-lesson for one gap. Must return JSON. */
export function lessonPrompt(topicTitle: string, conceptName: string, evidence: string, feedback: string): string {
  return `Write a short lesson to fix one gap in a student's understanding.

Topic: ${topicTitle}
Concept: ${conceptName}
What the student said: "${evidence}"
What was missing: ${feedback}

Rules:
- Max 250 words in the lesson body.
- Start from what the student already said and fix the exact misunderstanding.
- Use one concrete everyday example or analogy.
- Plain language, short paragraphs.
- Then write 2 multiple-choice check questions with 3 options each.

Return ONLY valid JSON:
{
  "title": "short title",
  "gap_summary": "one sentence describing the gap",
  "body": "lesson text in markdown",
  "example": "the example or analogy in 1-3 sentences",
  "questions": [
    { "question": "...", "options": ["...", "...", "..."], "correct_index": 0, "explanation": "one sentence" }
  ]
}`;
}

/** 5. Primer (learn before teaching). Must return JSON. depth "quick" = 2–3 min read, "full" = from scratch. */
export function primerPrompt(topicTitle: string, concepts: { name: string; description: string }[], depth: "quick" | "full"): string {
  const length =
    depth === "quick"
      ? "a 2-3 minute read (350-500 words in total)"
      : "a 5-7 minute read (800-1100 words in total) for someone starting from zero";
  const extra =
    depth === "quick"
      ? '- Leave "deeper" and "mistake" as empty strings.'
      : '- For each concept also write "deeper" (2-4 sentences: the how and why, one level down) and "mistake" (one common misconception, one sentence).';
  return `Write a primer that prepares a student to explain "${topicTitle}" to a complete beginner.

Concepts, in this order:
${concepts.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

Length: ${length}.

Rules:
- Explain each concept simply, in plain language, as if to a curious 14-year-old.
- Give each concept exactly one everyday example or analogy.
- Define every technical word the first time you use it.
${extra}
- "hint" is a 1-2 sentence nudge that reminds the student of the key idea without explaining it fully. It is shown when the student gets stuck while teaching.
- Don't end with a call to action; the page adds its own.

Return ONLY valid JSON:
{
  "title": "short title",
  "intro": "2-3 sentences: what this topic is and why it matters",
  "concepts": [
    { "name": "exact concept name", "explanation": "2-4 sentences, markdown allowed", "example": "1-2 sentences", "hint": "1-2 sentences", "deeper": "", "mistake": "" }
  ],
  "recap": "2 sentences that tie the concepts together"
}`;
}

/** 6. Voice transcription; the audio goes along as inline data. */
export function transcribePrompt(topicTitle: string): string {
  return `Transcribe this recording of a student explaining "${topicTitle}" to a beginner.
Return only the spoken words as plain text, with normal punctuation. No timestamps, no speaker labels, no comments.
If nothing intelligible was said, return an empty string.`;
}

/** 4. Seeding topics (optional helper). */
export function topicSeedPrompt(subject: string): string {
  return `Create a learning topic for a study platform.
Subject area: ${subject}
Return ONLY valid JSON:
{
  "title": "...",
  "subject": "...",
  "difficulty": 1 | 2 | 3,
  "summary": "one sentence",
  "concepts": ["5 to 8 key concepts a student must be able to explain"]
}`;
}

/** Tiny prompt used by `npm run ai:check`. */
export const healthCheckPrompt = "Reply with the single word: ready";
