import { z } from "zod";

export const conceptStateSchema = z.enum(["understood", "shaky", "gap"]);
export type ConceptStateValue = z.infer<typeof conceptStateSchema>;

export const evaluationSchema = z.object({
  concepts: z
    .array(
      z.object({
        name: z.string(),
        state: conceptStateSchema,
        evidence: z.string().default(""),
        feedback: z.string().default(""),
      }),
    )
    .min(1),
  pip_summary: z.string().default(""),
  score: z.coerce.number().int().nonnegative().optional(),
});
export type Evaluation = { concepts: z.infer<typeof evaluationSchema>["concepts"]; pip_summary: string; score: number };

export const lessonSchema = z.object({
  title: z.string().min(1),
  gap_summary: z.string().min(1),
  body: z.string().min(1),
  example: z.string().default(""),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2).max(4),
        correct_index: z.coerce.number().int().nonnegative(),
        explanation: z.string().default(""),
      }),
    )
    .min(1)
    .max(3),
});
export type LessonContent = z.infer<typeof lessonSchema>;

export const primerDepthSchema = z.enum(["quick", "full"]);
export type PrimerDepth = z.infer<typeof primerDepthSchema>;

export const primerSchema = z.object({
  title: z.string().min(1),
  intro: z.string().min(1),
  concepts: z
    .array(
      z.object({
        name: z.string().min(1),
        explanation: z.string().min(1),
        example: z.string().default(""),
        hint: z.string().min(1),
        deeper: z.string().default(""),
        mistake: z.string().default(""),
      }),
    )
    .min(1),
  recap: z.string().default(""),
});
export type PrimerContent = z.infer<typeof primerSchema>;

export type ChatTurn ={ role: "teacher" | "pip"; content: string };

export type TopicContext = {
  slug: string;
  title: string;
  concepts: { name: string; description: string }[];
};

export type PipResult = {
  reply: string;
  covered: string[];
  confused: boolean;
  source: "gemini" | "demo";
  model?: string;
};
