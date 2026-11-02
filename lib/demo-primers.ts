// Demo-mode primers: Photosynthesis is pre-written (both depths); other topics are built from concept descriptions.
import type { PrimerContent, PrimerDepth, TopicContext } from "./ai-types";

const photosynthesis: PrimerContent = {
  title: "Photosynthesis in plain words",
  intro:
    "Photosynthesis is how plants make their own food out of light, water and air. Almost every food chain on Earth starts with it, and the oxygen you're breathing right now is a by-product of it.",
  concepts: [
    {
      name: "Chlorophyll captures light",
      explanation: "Leaves are green because of **chlorophyll**, a pigment (a coloured molecule) inside them. Chlorophyll soaks up red and blue light and uses that energy to get the whole process going. Green light bounces off, which is why leaves look green.",
      example: "Chlorophyll works like a solar panel on a roof: it catches sunlight and turns it into energy the house can use.",
      hint: "Think about what makes leaves green, and what that green stuff does with sunlight.",
      deeper: "When chlorophyll absorbs light, some of its electrons get 'excited' to a higher energy. Those energetic electrons are passed along a chain of proteins, and that flow of energy is what powers the next steps.",
      mistake: "Plants don't use green light much at all; it's the colour they reflect, not the one they eat.",
    },
    {
      name: "Inputs: water and carbon dioxide",
      explanation: "A plant needs two raw materials besides light. **Water** comes up from the roots through tubes in the stem. **Carbon dioxide** (CO₂), a gas in the air, gets in through tiny holes on the leaves called **stomata**.",
      example: "It's like baking: water and CO₂ are the flour and eggs, and sunlight is the oven's heat.",
      hint: "What two things does a plant take in besides light, and where does each one enter?",
      deeper: "Stomata open and close. Open, they let CO₂ in, but water also escapes, so on hot, dry days plants close them and photosynthesis slows down.",
      mistake: "Plants don't get their mass from the soil; most of it is carbon pulled from the air.",
    },
    {
      name: "Chloroplasts",
      explanation: "Photosynthesis happens inside **chloroplasts**, tiny green compartments in leaf cells. One leaf cell can hold dozens of them. Inside are stacks of flat discs (the **thylakoids**) surrounded by a liquid called the **stroma**.",
      example: "A chloroplast is a little kitchen: the thylakoid stacks are the stove, and the stroma is the counter where the food gets put together.",
      hint: "Where inside the leaf cell does all of this happen? Name the little green compartment.",
      deeper: "The two stages of photosynthesis use different parts of the chloroplast: the light stage runs on the thylakoid membranes, and the sugar-building stage runs in the stroma.",
      mistake: "Chloroplasts aren't the whole cell; they're one of many parts inside it.",
    },
    {
      name: "Light-dependent reactions",
      explanation: "The first stage needs light. The captured light energy is used to **split water** molecules and to charge up two energy carriers, **ATP** and **NADPH**. Think of them as small rechargeable batteries the cell uses next.",
      example: "Like charging power banks with a solar panel during the day so you can use the power later.",
      hint: "In the first stage, light is used to split something and to charge up the cell's 'batteries'. What are they?",
      deeper: "Splitting water releases electrons that replace the ones chlorophyll lost, plus hydrogen ions. The flow of those ions across the thylakoid membrane drives the machine that makes ATP.",
      mistake: "This stage doesn't make sugar; it only makes the energy carriers.",
    },
    {
      name: "Where the oxygen comes from",
      explanation: "The oxygen a plant gives off comes from the **water** it splits, not from the carbon dioxide. Each water molecule (H₂O) gives up its hydrogen for the process, and the leftover oxygen atoms pair up and float out of the leaf.",
      example: "It's like peeling an orange: you keep the fruit (hydrogen and electrons) and the peel (oxygen) is what gets thrown out.",
      hint: "The oxygen is a leftover. Which input molecule gets split apart to release it?",
      deeper: "Scientists proved this by giving plants water made with a special, heavier type of oxygen: the heavy oxygen showed up in the air the plant released.",
      mistake: "The O₂ does not come from CO₂; the oxygen in CO₂ ends up in the sugar and in water.",
    },
    {
      name: "Calvin cycle",
      explanation: "The second stage builds sugar. In the stroma, an enzyme called **RuBisCO** grabs CO₂ from the air and attaches it to a starter molecule. The ATP and NADPH from the light stage then power turning it into a small sugar. Most of that sugar is used to rebuild the starter molecule, so the process can repeat. That's why it's a **cycle**.",
      example: "A bakery that keeps back a bit of dough as a starter for the next batch: flour from the air (CO₂) goes in, bread (sugar) comes out, and the starter is always remade.",
      hint: "This stage turns CO₂ into sugar using the batteries from the light stage. Why is it called a cycle?",
      deeper: "Only one in six of the three-carbon sugars (G3P) leaves the cycle; the rest rebuild the five-carbon starter. Two G3P that leave make one glucose.",
      mistake: "It's sometimes called the 'dark reaction', but it doesn't need darkness; it runs in daylight, using the light stage's energy.",
    },
    {
      name: "Glucose as stored energy",
      explanation: "The end product is **glucose**, a sugar. The plant burns some of it right away for energy, turns some into **starch** to store for later, and uses some to build **cellulose**, the material its cell walls are made of.",
      example: "Glucose is like money earned in a day: some is spent right away, some goes into savings (starch), and some pays for building the house (cellulose).",
      hint: "What does the plant actually make in the end, and what three things can it do with it?",
      deeper: "Plants release the energy in glucose through respiration, just like animals do, day and night. Starch is a long chain of glucose that is easy to store and break down again.",
      mistake: "Plants don't only photosynthesise; they also respire, using oxygen to burn sugar, all the time.",
    },
  ],
  recap:
    "Light, caught by chlorophyll in the chloroplasts, splits water (releasing oxygen) and charges ATP and NADPH. The Calvin cycle spends that energy to turn CO₂ into glucose, which the plant uses, stores or builds with.",
};

function generic(topic: TopicContext, depth: PrimerDepth): PrimerContent {
  return {
    title: `${topic.title}: the essentials`,
    intro: `Here are the ${topic.concepts.length} ideas you need to explain ${topic.title} to a beginner. Read each one, then say it back to yourself in one sentence.`,
    concepts: topic.concepts.map((c) => ({
      name: c.name,
      explanation: c.description,
      example: `Try saying it to a friend in one line: "${c.description.split(/[.;:]/)[0]}." Then add something they see in everyday life.`,
      hint: c.description.split(/(?<=\.)\s/)[0],
      deeper: depth === "full" ? `When you teach this, start with what ${c.name.toLowerCase()} is, then why it matters for ${topic.title.toLowerCase()}, and finish with an example.` : "",
      mistake: "",
    })),
    recap: `${topic.title} comes down to these ${topic.concepts.length} ideas. If you can explain each one in plain words, Pip will follow.`,
  };
}

export function demoPrimer(topic: TopicContext, depth: PrimerDepth): PrimerContent {
  if (topic.slug !== "photosynthesis") return generic(topic, depth);
  if (depth === "full") return photosynthesis;
  return { ...photosynthesis, concepts: photosynthesis.concepts.map((c) => ({ ...c, deeper: "", mistake: "" })) };
}
