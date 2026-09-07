/**
 * All site copy. Edit this file to update the site; markup should not need to change.
 * Sourced from Chidera Onyebu's resume (July 2026) and linkedin.com/in/chideraonyebu.
 */

export const content = {
  meta: {
    name: "Chidera Onyebu",
    title: "Chidera Onyebu — CS & Applied Math @ UMD",
    description:
      "Computer Science and Applied Mathematics at the University of Maryland. Payments systems, research infrastructure, and ML — built so the property you need holds by construction, then proven.",
    url: "https://dera219.github.io/dera-portfolio/",
  },

  hero: {
    tagline: "I build systems whose guarantees are structural, not hopeful.",
    subtitle:
      "CS & Applied Mathematics at the University of Maryland. A deployed marketplace with a real money path, a research platform built to kill its own results, and an LLM agent that cannot execute an unconfirmed order — different domains, one habit: make the property hold by construction, then prove it does.",
    // Drop a photo at assets/img/portrait.jpg (or .png) and set this to its path — it appears
    // automatically, framed, beside the hero. Leave null and the layout centers the text cleanly.
    portrait: null,
  },

  about: {
    body: [
      "I'm a Computer Science and Applied Mathematics student at the University of Maryland (class of 2028). I build backend and research systems, and the through-line is the same wherever I point it: figure out which property actually has to hold, make it hold by construction rather than by discipline, and then write the test that fails if anyone removes it.",
      "The clearest example is a two-sided marketplace I built and deployed. Its payment path journals every money-moving call before the call is issued, because Stripe prunes idempotency keys after 24 hours and a retry past that window becomes a second real charge. Three of the defects I fixed there were invisible to a mocked test suite and only appeared against the live API. Money is a good teacher: the failure modes are specific, unforgiving, and entirely uninterested in whether the demo looked fine.",
      "The same instinct shows up in research code, where the bugs are asymmetric. One that loses information gets noticed when the strategy stops working; one that adds information looks like a discovery, and nobody debugs a good result. So my research platform tries to falsify itself — a causality checker perturbs every observation after time t and asserts nothing before t moved, my backtester enforces no-lookahead in the engine rather than in strategy discipline, and its own demo wins in-sample and then loses out-of-sample. I also found and quantified a data-leakage flaw in a computer-vision project, where a split that passed the team's own check inflated the reported accuracy by about three points.",
      "That carried into my capstone, an LLM agent that can place trades. The interesting problem wasn't getting it to work — it was making the safety property hold when the model misbehaves. The confirmation gate is enforced by the graph's topology rather than by asking the model nicely, permissions are code that raises rather than text that persuades, and the eval suite asserts the broker was never called instead of trusting that the agent said no.",
      "I grew up in Lagos, Nigeria, and I'm happiest where a clean mathematical idea meets a system that refuses to cooperate. I also mentor CS students through ColorStack and Alpha Lambda Delta — explaining an idea cleanly is the fastest way to find the hole in it.",
      "If you're building something where correctness outlives the demo — money that has to reconcile, a model that has to generalize, an agent that has to stay inside its limits — I'd like to talk.",
    ],
  },

  projects: [
    {
      name: "ToolBelt — Two-Sided Marketplace with a Real Money Path",
      blurb:
        "A gig marketplace built and deployed end to end: an 8,400-line FastAPI/PostgreSQL API and a 4,400-line TypeScript Expo client running on iOS, Android, and web, live on its own domain over TLS. It has no users — I built it to be correct, not to be operated. The interesting half is the money. Every money-moving Stripe call is journaled on a second connection before the call is issued — because Stripe prunes idempotency keys after 24 hours, and a retried refund past that window is not a retry, it is a second real charge. A double-entry ledger over authorize, capture, and payout balances to zero against live Stripe test mode, and the reconciliation sweeper is read-only by construction: a deny-by-default allowlist that raises on any mutating method.",
      learned:
        "Three of the defects I fixed were invisible to a mocked test suite — a capture that succeeded at Stripe while my transaction rolled back locally, a payout failure undoing a completed job, and idempotency-key poisoning. All three lived in the same gap: between telling a provider to move money and recording that you did. So I stopped fixing them one at a time and closed the gap instead.",
      tech: ["FastAPI", "PostgreSQL", "TypeScript", "Stripe", "Docker", "React Native"],
      image: "assets/img/proj-toolbelt.svg",
      imageAlt:
        "A journal row committing before an outbound payment call, with the reverse order — a retry past the 24-hour key window — shown becoming a second charge.",
      links: {
        live: "https://toolbelt.biz",
        repo: "https://github.com/Dera219/toolbelt",
        writeup: null,
      },
    },
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
      name: "crucible — Cross-Sectional Research Platform",
      blurb:
        "A research platform for relative signals — panel data, a composable signal algebra, a vectorised backtester with square-root market impact, and validation built to kill results before I believe them. Its causality checker proves a signal cannot see the future: perturb every observation after time t, recompute, assert nothing before t moved. That catches full-sample normalisation — the lookahead bug that survives review because it looks like the textbook. I logged every defect found after the tests were already green: thirteen, and twelve made results look better than reality.",
      learned:
        "Research bugs are asymmetric. One that loses information gets noticed when the strategy stops working; one that adds information looks like a discovery. Nobody debugs a good result. So I stopped asking whether the code worked and started asking what hides behind a passing test — planting a signal of known strength caught a diagnostic reading a true IC of 0.13 as 0.008.",
      tech: ["Python", "NumPy", "Polars", "Property-based testing", "mypy strict"],
      image: "assets/img/proj-crucible.svg",
      imageAlt:
        "A time-by-asset grid with the region after a cut point scrambled, and the region before it unchanged — the causality test.",
      links: {
        repo: "https://github.com/Dera219/crucible",
        writeup: "https://github.com/Dera219/crucible/blob/main/README.md",
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
