# Portfolio

Personal site for Chidera Onyebu. Static, dependency-free, no build step.

**Live:** <https://dera219.github.io/dera-portfolio/>

All copy lives in [`src/content.js`](src/content.js). Editing the site never means touching markup.

## Projects on the site

| Project | What it is | Repo |
|---|---|---|
| **TradeDesk** | Conversational trading agent whose confirmation gate is enforced by the graph's shape — no edge connects proposing an order to filling one. FastAPI + LangGraph + RAG. AI.Accelerate FY26 capstone. | [tradedesk](https://github.com/Dera219/tradedesk) |
| **crucible** | Cross-sectional research platform whose causality checker proves a signal cannot see the future — perturb everything after time *t*, assert nothing before *t* moved. Thirteen bugs caught in its own code after the tests were green; twelve made results look better than reality. | [crucible](https://github.com/Dera219/crucible) |
| **Apex** | Event-driven backtester with a cost model and walk-forward validation. Its own demo wins in-sample and loses out-of-sample — the honesty the framework exists to enforce. | [apex-trading-agent](https://github.com/Dera219/apex-trading-agent) |
| **Nutrition5k** | Calorie CNN plus a session-level data-leakage audit that changed how the project's numbers should be read. | [ai4all-ml-project](https://github.com/Dera219/ai4all-ml-project) |

Adding another means appending one object to the `projects` array in `src/content.js` and dropping
a ~16:9 image in `assets/img/`. Nothing else.

## Design constraints

Interactivity is easy to overspend. A portfolio is read most often by someone with forty seconds,
so motion should reward attention and never gate the content behind it. What holds today:

- `prefers-reduced-motion` respected
- Reveal animation degrades safely: with no `IntersectionObserver`, or motion disabled, everything
  shows immediately. The `.js` class is added by JS, so the opacity-0 base style only ever applies
  when JS is alive to undo it
- Keyboard navigable, semantic landmarks, focus rings never removed
- Light and dark themes
- Fluid type and a stepped container token, so the layout uses the width of a large display instead
  of freezing at laptop measure
- No build step, no framework, no CDN dependency

## Known limitation: JS-dependent content

**Projects, Experience, and Contact are rendered by JavaScript and are empty without it.** Hero and
About have static fallbacks in the markup; those three sections do not — they are empty `<ul>`s
that `main.js` fills from `content.js`.

This is a real cost. Search engines and link-preview crawlers that don't execute JS see three empty
sections, and anyone with JS blocked sees headings with nothing under them.

It is the price of keeping copy in one file and out of the markup, which is a reasonable trade for
a site edited often. The fix, if both are wanted, is to render `content.js` into static HTML at
commit time with a small script — roughly 20 lines, no framework, no build step for the visitor.

## Layout

```
index.html             # Entry point — served from the repo root by GitHub Pages
src/css/               # Design tokens + component styles
src/js/main.js         # Renders content.js into the DOM
src/js/hero.js         # Animated hero canvas
src/content.js         # ← All copy lives here, separate from markup
assets/img/            # Project plates (SVG)
assets/                # Resume PDF
```

## Local preview

Any static server from the repo root. The site is plain files, but `index.html` loads
`src/js/main.js` as an ES module, so `file://` will not work — the module fetch is blocked by CORS.

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy

Settings → Pages → deploy from branch `main`, folder `/ (root)`. Pushing to `main` republishes;
allow a minute or two for the CDN.

## License

MIT — see [LICENSE](LICENSE).
