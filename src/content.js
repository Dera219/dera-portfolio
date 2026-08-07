/**
 * All site copy. Edit this file to update the site; markup should not need to change.
 * Sourced from Chidera Onyebu's resume (July 2026) and linkedin.com/in/chideraonyebu.
 */

export const content = {
  meta: {
    name: "Chidera Onyebu",
    title: "Chidera Onyebu — Quant / CS & Applied Math @ UMD",
    description:
      "Computer Science and Applied Mathematics at the University of Maryland, building toward quantitative research and systematic trading. Event-driven backtesting, honest out-of-sample validation, ML.",
    url: "https://dera219.github.io/dera-portfolio/",
  },

  hero: {
    tagline: "I build systems that make decisions under uncertainty.",
    subtitle:
      "CS & Applied Mathematics at the University of Maryland, building toward quantitative research and systematic trading — event-driven backtesting, honest out-of-sample validation, and machine learning.",
    // Drop a photo at assets/img/portrait.jpg (or .png) and set this to its path — it appears
    // automatically, framed, beside the hero. Leave null and the layout centers the text cleanly.
    portrait: null,
  },

  about: {
    body: [
      "I'm a Computer Science and Applied Mathematics student at the University of Maryland (class of 2028), building toward quantitative research and systematic trading. The through-line in everything I make is decision-making under uncertainty: strategies that have to survive real costs and slippage, and models that have to generalize past the data they were trained on.",
      "I care most about the parts people skip. My backtester is event-driven, so lookahead bias is structurally hard to introduce; it models commission, spread, and market impact, and it validates walk-forward so an in-sample number never gets mistaken for an edge. On the machine-learning side, I recently found and quantified a data-leakage flaw in a computer-vision project — a split that looked clean but inflated the reported accuracy — and rebuilt the evaluation to measure the honest number. Knowing when a good-looking result is lying to you is the skill I keep sharpening.",
      "That instinct carried into my capstone, an LLM agent that can place trades. The interesting problem there wasn't getting it to work — it was making the safety properties hold when the model misbehaves. So the confirmation gate is enforced by the graph's topology rather than by asking the model nicely, permissions are code that raises rather than text that persuades, and the eval suite asserts the broker was never called instead of trusting that the agent said no.",
      "I grew up in Lagos, Nigeria, and I'm happiest where a clean mathematical idea meets a system that refuses to cooperate. I also mentor CS students through ColorStack and Alpha Lambda Delta — explaining an idea cleanly is the fastest way to find the hole in it.",
      "If you're building systematic strategies and want someone who treats an out-of-sample loss as the most useful result in the room, I'd like to talk.",
    ],
  },

  projects: [
    {
      name: "TradeDesk — Trading Agent with a Confirmation Gate",
      blurb:
        "A conversational paper-trading agent where the safety property is the graph's shape, not a prompt. It classifies intent, answers from a self-authored corpus, quotes symbols, and places simulated orders — but proposing an order and filling one are separate turns, because no edge connects them. Authorization is Python decorators raising 403, not an instruction the model can be talked out of. 18 adversarial scenarios assert on behavior: the strongest check is that a spy recorded the broker was never called.",
      learned:
        "\"The model refused\" is not a safety guarantee — it's a behavior that holds until someone finds the phrasing that breaks it. Moving the guarantee into structure, where a test fails if anyone adds the shortcut, is the difference between a demo and a system.",
      tech: ["Python", "LangGraph", "FastAPI", "Pydantic", "RAG", "MCP"],
      image: "assets/img/proj-tradedesk.svg",
      imageAlt:
        "Agent graph: six intents fan out from the classifier, and a crossed-out dashed line shows the absent edge from trade to confirmation.",
      links: {
        repo: "https://github.com/Dera219/tradedesk",
        writeup: "https://github.com/Dera219/tradedesk/blob/main/docs/SAFETY_AUDIT.md",
        live: null,
      },
    },
    {
      name: "Apex — Event-Driven Backtesting Framework",
      blurb:
        "A quantitative research framework built the way a fund would want it: an event loop that makes lookahead bias structurally hard to introduce, a cost model for commission, spread, and market impact, and walk-forward validation. Its own demo proves the point — a strategy that beats buy-and-hold in-sample loses out-of-sample, which is exactly the honesty the framework exists to enforce.",
      learned:
        "The most valuable output a backtest can give you is the one that says your idea doesn't work. Enforcing that structurally — no-lookahead by construction, out-of-sample by default — matters more than any single strategy.",
      tech: ["Python", "NumPy", "Event-driven engine", "Walk-forward validation"],
      image: "assets/img/proj-apex.svg",
      imageAlt: "Stylized equity curves diverging in-sample versus out-of-sample.",
      links: { repo: "https://github.com/Dera219/apex-trading-agent", live: null },
    },
    {
      name: "Nutrition5k — Data-Leakage Audit + CNN",
      blurb:
        "A calorie classifier on food images — and an audit that changed how the whole project's numbers should be read. The team's split passed a dish-ID overlap check but leaked at the capture-session level; a controlled 5-seed, 2-architecture experiment showed that inflates the reported accuracy by ~3 points. On a clean session-grouped split my model reaches ~74%, 2.2× the baseline, honestly measured.",
      learned:
        "A model that looks accurate because of leakage fails quietly on real users — worse than one that's honestly mediocre. Finding the leak, quantifying it, and rebuilding the evaluation was the real work.",
      tech: ["Python", "PyTorch", "Ordinal CNN", "scikit-learn"],
      image: "assets/img/proj-nutrition.svg",
      imageAlt: "Three-class confusion-matrix motif for Low, Medium, and High calories.",
      links: {
        repo: "https://github.com/Dera219/ai4all-ml-project",
        writeup:
          "https://github.com/Dera219/ai4all-ml-project/blob/main/docs/session-leakage-nutrition5k.md",
        live: null,
      },
    },
  ],

  experience: [
    {
      role: "Peer Mentor",
      org: "ColorStack",
      period: "Sept 2024 – Present",
      detail:
        "Mentor CS students one-on-one through coursework and projects, and run study sessions and debugging workshops. Most of the work is helping someone find their own bug rather than finding it for them.",
    },
    {
      role: "Academic Mentor",
      org: "Alpha Lambda Delta",
      period: "April 2025 – Present",
      detail:
        "Tutor and advise fellow students, and run review sessions for freshmen navigating their first year at UMD.",
    },
  ],

  links: {
    github: "https://github.com/Dera219",
    linkedin: "https://www.linkedin.com/in/chideraonyebu/",
    email: "conyebu@terpmail.umd.edu",
    resume: "assets/Chidera-Onyebu-Resume.pdf",
  },
};

/**
 * Editing notes.
 *
 * 1. Contact details on the page are email and LinkedIn only. Phone stays out of the markup —
 *    anything in page HTML is scraped and cannot be un-published.
 *
 * 2. Prefer specific, checkable numbers over percentages: "100 strategies, 20 generations",
 *    "5 seeds x 2 architectures". A figure a reader can verify against the linked repo carries
 *    more weight than one they can only take on faith.
 *
 * 3. Project images are decorative SVG motifs (assets/img/proj-*.svg), not screenshots — nothing
 *    here should read as real program output unless it is. To use a real figure, point a
 *    project's `image` at its path and keep it roughly 16:9.
 */
