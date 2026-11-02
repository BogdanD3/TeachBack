export type SeedThread = { title: string; body: string; topic: string | null; replies: string[] };

export const threads: SeedThread[] = [
  {
    title: "Pip keeps asking where the oxygen comes from — how do you explain it simply?",
    body: "I always say 'the plant breathes out oxygen' and Pip says 'so it breathes like me?' and I lose the thread. What's the cleanest way to say it comes from splitting water?",
    topic: "photosynthesis",
    replies: [
      "I say: the plant needs electrons, water gives them up, and the leftover oxygen is basically waste. Pip got it first try.",
      "Draw H₂O and literally cross out the H's. The O's pair up into O₂. Visual beats words here.",
      "The trap is mentioning CO₂ at the same time. Keep the two inputs separate until Pip has the water part.",
    ],
  },
  {
    title: "Recursion session: Pip asked 'but who is waiting for the answer?' and I froze",
    body: "Turns out I couldn't explain the call stack without saying 'it just goes back up'. Anyone have a good analogy?",
    topic: "recursion",
    replies: [
      "Stack of sticky notes. Each call writes a note 'waiting for X', sticks it on top, and you peel them off as answers come back.",
      "Russian dolls work for the going-down part but not for the coming-back part. Sticky notes are better.",
    ],
  },
  {
    title: "Is anyone else using Teachback to prep for oral exams?",
    body: "My biology oral is in two weeks. Teaching Pip feels a lot like the examiner asking follow-ups. Curious how others schedule sessions.",
    topic: null,
    replies: [
      "Same here for law. I do one 10-minute session every morning on a different topic and redo gaps in the evening.",
      "Gap report before bed, mini-lesson with coffee next day. My shaky concepts went from 9 to 2.",
      "Pro tip: answer out loud with the mic. It's much closer to an oral exam than typing.",
    ],
  },
  {
    title: "Supply vs demand shift — Pip found my gap in 30 seconds",
    body: "I kept saying 'demand goes up when price goes down'. Pip asked if that means the curve moves. It doesn't. Movement along vs shift — finally clicked after the mini-lesson.",
    topic: "supply-and-demand",
    replies: ["That mini-lesson with the umbrella example is so good.", "This is the exact thing my econ teacher kept marking wrong."],
  },
  {
    title: "Weekly challenge: Newton's third law — tips?",
    body: "Booked a seat for Thursday. Last time half the room got stuck on why action-reaction forces don't cancel. Any tips before I go in?",
    topic: "newtons-laws",
    replies: [
      "Always say which object each force acts ON. Different objects means they can't cancel.",
      "Horse and cart example. Pip loves it.",
    ],
  },
  {
    title: "Feature idea: let Pip be a slightly smarter student on level 3 topics",
    body: "For neural networks Pip asks great basic questions, but it'd be fun to have a 'second-year student' mode that pushes on the maths.",
    topic: "how-neural-networks-learn",
    replies: ["+1, especially for backprop.", "Would pay for this honestly."],
  },
  {
    title: "How I finally understood compound interest (thanks to explaining it badly)",
    body: "I thought I understood it. Then Pip asked why the last 10 years add more than the first 10, and I had nothing. The rule of 72 lesson fixed it.",
    topic: "compound-interest",
    replies: ["The rule of 72 is a cheat code.", "Showed this to my little brother, he's now obsessed with his savings account."],
  },
  {
    title: "French Revolution: how much detail does Pip want?",
    body: "Do you go date by date or cause by cause? I tried dates first and the gap report said I never explained WHY anything happened.",
    topic: "french-revolution",
    replies: [
      "Cause by cause. Debt → Estates-General → Bastille. Dates are just labels.",
      "The evaluation really rewards 'because' sentences.",
      "I tell it like a story with three acts. Pip asks better questions that way.",
    ],
  },
  {
    title: "Streak at 21 days — what's your routine?",
    body: "Hit three weeks today. I do one live challenge per week and short sessions on the bus. What's working for you?",
    topic: null,
    replies: ["Congrats! I'm at 9. Mornings only.", "Live sessions keep me honest. Can't skip when you booked a seat."],
  },
  {
    title: "DNA transcription vs translation — I mix them up every time",
    body: "Pip asked which one happens in the nucleus and I guessed wrong. Anyone have a memory trick?",
    topic: "dna-and-genes",
    replies: [
      "TRANScription = TRANScribe, same language (DNA→RNA, both nucleic acids). TRANSLation = different language (RNA→protein).",
      "Scribe stays home in the nucleus, translator travels to the ribosome.",
    ],
  },
];

export const reviewTexts: [stars: number, text: string][] = [
  [5, "Pip found the one step I always skip. Ten minutes and I knew exactly what to revise."],
  [5, "The gap report quoted my own sentence back to me. Painful, but exactly right."],
  [4, "Great topic. The mini-lesson example was clearer than my textbook."],
  [5, "Explaining this out loud with the mic felt like a real tutoring session."],
  [4, "Good concept list. I'd love one more concept on the edge cases."],
  [5, "Used it the night before my exam. Got the question I'd practised with Pip."],
  [3, "Useful, though Pip asked about the same concept twice in a row."],
  [5, "I thought I understood this. I did not. Now I do."],
  [4, "Short, focused, honest feedback. The check questions are well chosen."],
  [5, "My study group now does one Teachback session before every meeting."],
  [4, "The shaky/gap split is surprisingly accurate."],
  [5, "Best ten minutes of revision this week."],
  [3, "Solid, but the topic summary could mention a real-world example."],
  [5, "Pip's wrong summaries are hilarious and make you correct them properly."],
  [4, "Liked that it didn't just give me the answer. Made me work for it."],
];
