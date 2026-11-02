export type SeedTopic = {
  slug: string;
  title: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  summary: string;
  intro: string;
  concepts: [name: string, description: string][];
};

export const topics: SeedTopic[] = [
  {
    slug: "photosynthesis",
    title: "Photosynthesis",
    subject: "Biology",
    difficulty: 1,
    summary: "How plants turn light, water and carbon dioxide into sugar and oxygen.",
    intro:
      "Photosynthesis is how plants, algae and some bacteria store the energy of sunlight as chemical energy. It happens in two linked stages inside the chloroplast, and almost every food chain on Earth starts here. If you can explain where the oxygen comes from and what the Calvin cycle actually builds, you understand it better than most.",
    concepts: [
      ["Chlorophyll captures light", "The green pigment absorbs mostly red and blue light and uses that energy to excite electrons."],
      ["Inputs: water and carbon dioxide", "Water comes up from the roots; CO₂ enters through tiny pores called stomata."],
      ["Chloroplasts", "The organelle where photosynthesis happens: thylakoid membranes for the light stage, stroma for the Calvin cycle."],
      ["Light-dependent reactions", "Light energy splits water and produces ATP and NADPH, the cell's short-term energy carriers."],
      ["Where the oxygen comes from", "The O₂ released comes from splitting water, not from the carbon dioxide."],
      ["Calvin cycle", "In the stroma, ATP and NADPH power the fixing of CO₂ into a three-carbon sugar, helped by the enzyme RuBisCO."],
      ["Glucose as stored energy", "The sugar is used for energy, turned into starch for storage or into cellulose for building."],
    ],
  },
  {
    slug: "how-the-internet-works",
    title: "How the Internet works",
    subject: "Computer science",
    difficulty: 2,
    summary: "What actually happens between typing a URL and seeing a web page.",
    intro:
      "The Internet is a network of networks that agree on a few shared rules. Data is chopped into packets, addressed, routed hop by hop and reassembled at the other end. Explaining DNS and the difference between IP and TCP is where most people get stuck.",
    concepts: [
      ["Packets", "Data is split into small numbered chunks that travel independently."],
      ["IP addresses", "Every device on the network has an address so packets know where to go."],
      ["Routers and routing", "Routers pass packets hop by hop towards their destination using routing tables."],
      ["DNS", "The phone book that turns names like example.com into IP addresses."],
      ["TCP vs UDP", "TCP guarantees order and delivery with acknowledgements; UDP is faster with no guarantees."],
      ["HTTP and HTTPS", "The request/response language of the web; HTTPS adds encryption with TLS."],
    ],
  },
  {
    slug: "supply-and-demand",
    title: "Supply and demand",
    subject: "Economics",
    difficulty: 1,
    summary: "Why prices go up and down, and where they settle.",
    intro:
      "Supply and demand is the simplest model of how markets set prices. Buyers want more when things are cheap, sellers offer more when prices are high, and the price drifts to where the two meet. The tricky part is telling a movement along a curve from a shift of the whole curve.",
    concepts: [
      ["Law of demand", "As price rises, the quantity people want to buy falls."],
      ["Law of supply", "As price rises, producers are willing to sell more."],
      ["Equilibrium price", "The price where quantity supplied equals quantity demanded."],
      ["Shifts vs movements", "A price change moves along a curve; other factors shift the whole curve."],
      ["Shortages and surpluses", "Prices below equilibrium create shortages; above it create surpluses."],
      ["Elasticity", "How strongly quantity responds to a change in price."],
    ],
  },
  {
    slug: "newtons-laws",
    title: "Newton's laws of motion",
    subject: "Physics",
    difficulty: 2,
    summary: "The three rules that describe how forces change motion.",
    intro:
      "Newton's three laws explain everything from a rolling ball to a rocket launch. Most people can recite them; far fewer can explain why a moving object doesn't need a force to keep moving, or why the forces in the third law don't cancel out.",
    concepts: [
      ["Inertia (first law)", "Objects keep their state of motion unless a net force acts on them."],
      ["Net force", "Only the sum of all forces on an object changes its motion."],
      ["F = ma (second law)", "Acceleration is proportional to net force and inversely proportional to mass."],
      ["Action and reaction (third law)", "Forces come in equal and opposite pairs acting on different objects."],
      ["Mass vs weight", "Mass is how much stuff; weight is the force of gravity on that mass."],
      ["Friction", "A force that opposes sliding between surfaces."],
    ],
  },
  {
    slug: "french-revolution",
    title: "The French Revolution",
    subject: "History",
    difficulty: 2,
    summary: "How France went from absolute monarchy to republic to empire in ten years.",
    intro:
      "Between 1789 and 1799 France tore down its old order. Debt, hunger and new ideas about rights came together, and the revolution kept radicalising until the Terror and, eventually, Napoleon. A good explanation connects causes to events instead of listing dates.",
    concepts: [
      ["Financial crisis", "War debts and an unfair tax system left the crown nearly bankrupt."],
      ["The three estates", "Clergy, nobility and everyone else, with the Third Estate paying most taxes."],
      ["Storming of the Bastille", "July 1789: Parisians seized the fortress, a symbol of royal power."],
      ["Declaration of the Rights of Man", "A statement of liberty, equality and popular sovereignty."],
      ["The Reign of Terror", "1793–94: the Committee of Public Safety executed thousands of suspected enemies."],
      ["Rise of Napoleon", "In 1799 a general took power, ending the revolutionary decade."],
      ["Enlightenment ideas", "Writers like Rousseau and Montesquieu argued for reason, rights and limits on power."],
    ],
  },
  {
    slug: "how-vaccines-work",
    title: "How vaccines work",
    subject: "Biology",
    difficulty: 2,
    summary: "How a harmless preview teaches your immune system to fight the real thing.",
    intro:
      "A vaccine shows your immune system a harmless piece or version of a pathogen so it can prepare without you getting sick. Explaining memory cells and herd immunity in plain words is the real test.",
    concepts: [
      ["Antigens", "Molecules on a pathogen that the immune system learns to recognise."],
      ["Antibodies", "Proteins made by B cells that latch onto specific antigens."],
      ["Memory cells", "Long-lived cells that remember an antigen and respond fast next time."],
      ["Types of vaccines", "Live-attenuated, inactivated, subunit and mRNA vaccines present antigens differently."],
      ["Herd immunity", "When enough people are immune, the disease can't spread easily, protecting others."],
      ["Boosters", "Extra doses that refresh or strengthen immune memory."],
    ],
  },
  {
    slug: "recursion",
    title: "Recursion",
    subject: "Computer science",
    difficulty: 3,
    summary: "Functions that solve a problem by calling themselves on a smaller version of it.",
    intro:
      "Recursion is a way of solving a problem by reducing it to a smaller copy of itself until it becomes trivial. It powers tree traversal, sorting and parsing. If you can explain the call stack without hand-waving, you've got it.",
    concepts: [
      ["Base case", "The simplest input that is answered directly, which stops the recursion."],
      ["Recursive case", "The step that calls the function on a smaller input."],
      ["The call stack", "Each call waits on the stack until the calls it made return."],
      ["Stack overflow", "Missing or unreachable base cases make calls pile up until memory runs out."],
      ["Recursion vs iteration", "Any recursion can be written as a loop, sometimes with an explicit stack."],
      ["Memoization", "Caching results so repeated subproblems aren't recomputed."],
    ],
  },
  {
    slug: "compound-interest",
    title: "Compound interest",
    subject: "Finance",
    difficulty: 1,
    summary: "Why money grows faster the longer you leave it alone.",
    intro:
      "Compound interest means you earn interest on your interest. Over long periods that small difference turns into most of the money. Explaining why time matters more than the rate is the key insight.",
    concepts: [
      ["Principal", "The amount you start with."],
      ["Simple vs compound interest", "Simple interest is paid on the principal only; compound interest also on past interest."],
      ["Compounding frequency", "Interest added monthly grows slightly faster than interest added yearly."],
      ["The power of time", "Growth is exponential, so the last years add the most."],
      ["Rule of 72", "Divide 72 by the interest rate to estimate the years to double."],
      ["Compounding debt", "The same maths makes unpaid credit card balances grow quickly."],
    ],
  },
  {
    slug: "water-cycle",
    title: "The water cycle",
    subject: "Earth science",
    difficulty: 1,
    summary: "How water moves between oceans, sky, land and back again.",
    intro:
      "The water cycle is the continuous movement of water on, above and below the Earth's surface, driven by the sun and gravity. It's simple to sketch and surprisingly easy to explain wrong, especially condensation.",
    concepts: [
      ["Evaporation", "The sun heats water so it turns into vapour and rises."],
      ["Transpiration", "Plants release water vapour through their leaves."],
      ["Condensation", "Rising vapour cools and turns into tiny droplets, forming clouds."],
      ["Precipitation", "Droplets merge until they are heavy enough to fall as rain, snow or hail."],
      ["Runoff and infiltration", "Water flows over land into rivers or soaks into the ground."],
      ["Groundwater", "Water stored underground in soil and rock, feeding wells and springs."],
    ],
  },
  {
    slug: "dna-and-genes",
    title: "DNA and genes",
    subject: "Biology",
    difficulty: 2,
    summary: "How a four-letter code builds and runs every living thing.",
    intro:
      "DNA stores instructions in a sequence of four bases. Genes are stretches of that code that are read and turned into proteins. Explaining the path from DNA to RNA to protein is the heart of modern biology.",
    concepts: [
      ["Double helix", "Two strands twisted together, held by paired bases."],
      ["Base pairing", "A pairs with T and C pairs with G, which lets DNA be copied."],
      ["Genes", "Segments of DNA that code for a protein or functional RNA."],
      ["Transcription", "A gene is copied into messenger RNA in the nucleus."],
      ["Translation", "Ribosomes read mRNA three bases at a time to build a protein."],
      ["Mutations", "Changes in the DNA sequence that can alter a protein."],
      ["Chromosomes", "Long DNA molecules packaged with proteins; humans have 23 pairs."],
    ],
  },
  {
    slug: "climate-change-basics",
    title: "Climate change basics",
    subject: "Earth science",
    difficulty: 2,
    summary: "Why adding carbon dioxide to the air warms the planet.",
    intro:
      "The Earth stays warm because some gases trap heat. Burning fossil fuels adds more of those gases, so more heat is trapped. A good explanation separates weather from climate and explains feedback loops.",
    concepts: [
      ["Greenhouse effect", "Gases like CO₂ absorb outgoing heat and re-emit some back towards the surface."],
      ["Greenhouse gases", "CO₂, methane, nitrous oxide and water vapour."],
      ["Fossil fuels and CO₂", "Burning coal, oil and gas releases carbon stored for millions of years."],
      ["Weather vs climate", "Weather is day-to-day; climate is the long-term average."],
      ["Feedback loops", "Melting ice reflects less sunlight, which causes more warming."],
      ["Mitigation and adaptation", "Cutting emissions vs preparing for the changes already coming."],
    ],
  },
  {
    slug: "how-neural-networks-learn",
    title: "How neural networks learn",
    subject: "Computer science",
    difficulty: 3,
    summary: "How a pile of numbers gets better at a task by making mistakes.",
    intro:
      "A neural network is a function with millions of adjustable numbers called weights. It learns by making a prediction, measuring how wrong it was, and nudging every weight to be a bit less wrong. Gradient descent and backpropagation are where explanations usually fall apart.",
    concepts: [
      ["Neurons and weights", "Each neuron multiplies inputs by weights, adds them up and applies an activation."],
      ["Layers", "Stacked neurons transform the input step by step into an output."],
      ["Loss function", "A number that measures how wrong the prediction is."],
      ["Gradient descent", "Adjusting weights a small step in the direction that reduces the loss."],
      ["Backpropagation", "Using the chain rule to work out how much each weight contributed to the error."],
      ["Training data and overfitting", "Learning from examples, and the risk of memorising them instead of generalising."],
      ["Learning rate", "How big each weight update step is."],
    ],
  },
];
