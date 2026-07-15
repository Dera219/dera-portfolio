/**
 * All site copy. Edit this file to update the site; markup should not need to change.
 * Sourced from Chidera Onyebu's resume (July 2026) and linkedin.com/in/chideraonyebu.
 */

export const content = {
  meta: {
    name: "Chidera Onyebu",
    title: "Chidera Onyebu — CS & Applied Math @ UMD",
    description:
      "Computer Science and Applied Mathematics student at the University of Maryland. I build trading systems, ML models, and tools for people learning to code.",
    url: "https://dera219.github.io/dera-portfolio/",
  },

  hero: {
    tagline: "I build systems that make decisions under uncertainty.",
    subtitle:
      "CS & Applied Math at the University of Maryland. Currently: evolutionary search for trading strategies, and computer vision for nutrition estimation.",
  },

  about: {
    body: [
      "I'm a Computer Science and Applied Mathematics student at the University of Maryland, class of 2028. I grew up in Lagos, Nigeria, and studied at Jesuit Memorial College before coming to College Park.",
      "Most of what I build sits where math meets messy real-world data — trading strategies that have to survive costs and slippage, vision models that have to work on photographs of actual food. I'm drawn to the part where a clean idea meets a system that doesn't cooperate.",
      "I also spend a lot of time teaching. Through ColorStack and Alpha Lambda Delta I mentor other students through CS coursework, which has taught me that explaining something clearly is a much better test of understanding than finishing an assignment.",
    ],
  },

  projects: [
    {
      name: "Algorithmic Trading Framework",
      blurb:
        "A framework that evolves trading strategies instead of hand-writing them — genetic-programming-inspired search over populations of 100 strategies across 20 generations, with a backtester that simulates each one against price data.",
      learned:
        "Runtime code generation via the Java Compiler API let the search produce and execute real strategies rather than interpret a config. The harder lesson was in the backtester: a strategy that looks profitable is usually just fitting noise, so realistic cost and slippage modeling matters more than the search algorithm does.",
      tech: ["Java 17", "Java Compiler API", "Maven", "React", "Vite"],
      links: { repo: "https://github.com/Dera219/Trading_Algorithm", live: null },
    },
    {
      name: "Nutrition5k — Food Image Analysis",
      blurb:
        "Team CNN project estimating nutritional content from food photographs, built on Google Research's Nutrition5k dataset. Part of the AI4ALL program.",
      learned:
        "Raising input resolution from 128×128 to 224×224 moved test accuracy from 65.9% to 66.9% — a real but modest gain, and a useful reminder that resolution isn't where the headroom was. Exploring depth data as a second modality to estimate food mass.",
      tech: ["Python", "PyTorch", "CNNs", "Streamlit"],
      links: { repo: "https://github.com/MalikSCole/AI4all-Group-Project", live: null },
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
    resume: null,
  },
};
