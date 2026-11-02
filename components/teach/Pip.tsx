"use client";

import { motion, useReducedMotion, type TargetAndTransition, type Transition } from "framer-motion";

export type PipState = "idle" | "thinking" | "confused" | "got-it";

type Props = {
  state?: PipState;
  size?: number;
  className?: string;
  /** Hide from screen readers when the surrounding text already says who is speaking. */
  decorative?: boolean;
};

const labels: Record<PipState, string> = {
  idle: "Pip, listening",
  thinking: "Pip, thinking",
  confused: "Pip, confused",
  "got-it": "Pip, getting it",
};

const bodyMotion: Record<PipState, { animate: TargetAndTransition; transition: Transition }> = {
  idle: { animate: { scaleY: [1, 1.025, 1], y: 0, rotate: 0 }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  thinking: { animate: { y: [0, -4, 0], rotate: 0, scaleY: 1 }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  confused: { animate: { rotate: -8, y: 0, scaleY: 1 }, transition: { type: "spring", stiffness: 200, damping: 14 } },
  "got-it": {
    animate: { y: [0, -10, 0, -4, 0], rotate: 0, scaleY: 1 },
    transition: { duration: 0.9, repeat: Infinity, repeatDelay: 1.6, ease: "easeOut" },
  },
};

const mouths: Record<PipState, string> = {
  idle: "M53 74 Q60 79 67 74",
  thinking: "M55 76 L65 75",
  confused: "M54 77 Q57 73 60 77 Q63 81 66 76",
  "got-it": "M51 72 Q60 84 69 72",
};

export function Pip({ state = "idle", size = 120, className, decorative = false }: Props) {
  const reduce = useReducedMotion();
  const m = bodyMotion[state];
  const eyeY = state === "thinking" ? 54 : 58;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : labels[state]}
      aria-hidden={decorative || undefined}
      overflow="visible"
    >
      <motion.g
        style={{ originX: "60px", originY: "100px" }}
        animate={reduce ? { rotate: state === "confused" ? -8 : 0 } : m.animate}
        transition={reduce ? { duration: 0 } : m.transition}
      >
        {/* ground shadow */}
        <ellipse cx="60" cy="104" rx="30" ry="4" fill="var(--line)" />
        {/* pebble body */}
        <path
          d="M60 22c22 0 38 16 39 40 1 22-14 40-39 40S20 86 21 63c1-25 17-41 39-41Z"
          fill="var(--coral)"
          stroke="var(--coral-dark)"
          strokeWidth="2"
        />
        {/* soft shine */}
        <path d="M38 42c4-7 11-11 18-12" stroke="var(--paper)" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* cheeks */}
        <circle cx="41" cy="70" r="5" fill="var(--coral-dark)" opacity=".35" />
        <circle cx="79" cy="70" r="5" fill="var(--coral-dark)" opacity=".35" />
        {/* eyes */}
        <circle cx="48" cy={eyeY} r="4.5" fill="var(--ink)" />
        <circle cx="72" cy={eyeY} r="4.5" fill="var(--ink)" />
        <circle cx="49.5" cy={eyeY - 1.5} r="1.3" fill="var(--paper)" />
        <circle cx="73.5" cy={eyeY - 1.5} r="1.3" fill="var(--paper)" />
        {/* mouth */}
        <path d={mouths[state]} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </motion.g>

      {state === "confused" && (
        <motion.g
          initial={{ opacity: 0, y: 6 }}
          animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -3, 0] }}
          transition={reduce ? { duration: 0 } : { y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.2 } }}
        >
          <circle cx="98" cy="18" r="13" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="1.5" />
          <text x="98" y="24" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display), serif">
            ?
          </text>
        </motion.g>
      )}

      {state === "got-it" && (
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
          style={{ originX: "60px", originY: "8px" }}
        >
          <path d="M60 -6a10 10 0 0 0-6 18v4h12v-4a10 10 0 0 0-6-18Z" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="1.5" />
          <path d="M55 20h10M56 23.5h8" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M44 -2l-5-3M76 -2l5-3M60 -12v-5" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
      )}

      {state === "thinking" && (
        <g fill="var(--ink-2)">
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={86 + i * 8}
              cy={22 - i * 4}
              r={2 + i * 0.6}
              animate={reduce ? { opacity: 1 } : { opacity: [0.2, 1, 0.2] }}
              transition={reduce ? { duration: 0 } : { duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
