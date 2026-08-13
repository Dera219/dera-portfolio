import { content } from "../content.js";

/** Resolve a dotted path ("hero.tagline") against an object. */
function resolve(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/** Set text without parsing HTML — content.js is trusted, but escaping by default costs nothing
 *  and means a stray `<` in your bio can never become markup. */
function setText(el, value) {
  el.textContent = String(value);
}

function renderProjects(el, projects) {
  el.replaceChildren(
    ...projects.map((p) => {
      const li = document.createElement("li");
      li.className = "project-card";
      li.setAttribute("data-reveal", "");

      // Image is optional; a card with a broken/missing src should still look intentional, so we
      // only add the figure when a path is provided.
      if (p.image) {
        const fig = document.createElement("div");
        fig.className = "project-media";
        const img = document.createElement("img");
        img.src = p.image;
        img.alt = p.imageAlt ?? "";
        img.loading = "lazy";
        img.decoding = "async";
        fig.append(img);
        li.append(fig);
      }

      const bodyWrap = document.createElement("div");
      bodyWrap.className = "project-body";

      const h3 = document.createElement("h3");
      h3.textContent = p.name;

      const blurb = document.createElement("p");
      blurb.textContent = p.blurb;

      const tech = document.createElement("p");
      tech.className = "tech";
      tech.textContent = (p.tech ?? []).join(" · ");

      bodyWrap.append(h3, blurb);

      // The takeaway paragraph is optional; only render the pull-quote when one is written.
      const learnedText = typeof p.learned === "string" ? p.learned.trim() : "";
      if (learnedText) {
        const learned = document.createElement("blockquote");
        learned.className = "learned";
        learned.textContent = learnedText;
        bodyWrap.append(learned);
      }

      bodyWrap.append(tech);

      const linkRow = document.createElement("div");
      linkRow.className = "project-links";
      const linkLabels = [
        ["repo", "Source →"],
        ["writeup", "Write-up →"],
      ];
      for (const [key, label] of linkLabels) {
        const href = p.links?.[key];
        if (!href || href.startsWith("TODO")) continue;
        const a = document.createElement("a");
        a.className = "project-link";
        a.href = href;
        a.textContent = label;
        // noopener is required on target=_blank: without it the opened page gets a handle back
        // to this window via window.opener and can redirect it.
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        linkRow.append(a);
      }
      if (linkRow.childElementCount > 0) bodyWrap.append(linkRow);

      li.append(bodyWrap);
      return li;
    }),
  );
}

/** Inject the hero portrait only when content.js provides one. Keeps the layout clean when it's
 *  null, and means adding a photo later is a one-line content change, not a markup change. */
function renderPortrait(slot, portraitPath, name) {
  if (!slot || !portraitPath) return;
  const img = document.createElement("img");
  img.className = "hero-portrait";
  img.src = portraitPath;
  img.alt = `Portrait of ${name}`;
  img.loading = "eager";
  img.decoding = "async";
  slot.append(img);
  slot.classList.add("has-portrait");
}

function renderExperience(el, entries) {
  el.replaceChildren(
    ...entries.map((e) => {
      const li = document.createElement("li");
      li.className = "experience-item";
      li.setAttribute("data-reveal", "");

      const h3 = document.createElement("h3");
      h3.textContent = `${e.role} — ${e.org}`;

      const period = document.createElement("p");
      period.className = "period";
      period.textContent = e.period;

      const detail = document.createElement("p");
      detail.textContent = e.detail;

      li.append(h3, period, detail);
      return li;
    }),
  );
}

function renderLinks(el, links) {
  const entries = Object.entries(links).filter(
    ([, v]) => typeof v === "string" && v && !v.startsWith("TODO"),
  );
  el.replaceChildren(
    ...entries.map(([label, href]) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = label === "email" ? `mailto:${href}` : href;
      a.textContent = label;
      a.rel = "noopener noreferrer";
      li.append(a);
      return li;
    }),
  );
}

function hydrate() {
  document.title = content.meta.title;

  // Keep the meta description in sync with content.js, same as the title — the static value in
  // index.html is only the no-JS fallback.
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && content.meta.description) {
    metaDescription.setAttribute("content", content.meta.description);
  }

  // Copyright year, so the footer doesn't advertise a stale date every January.
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  renderPortrait(
    document.querySelector("[data-portrait]"),
    content.hero?.portrait,
    content.meta.name,
  );

  for (const el of document.querySelectorAll("[data-content]")) {
    const path = el.dataset.content;
    const value = resolve(content, path);
    if (value == null) continue;

    if (path === "projects") renderProjects(el, value);
    else if (path === "experience") renderExperience(el, value);
    else if (path === "links") renderLinks(el, value);
    else if (Array.isArray(value)) {
      el.replaceChildren(
        ...value.map((para) => {
          const p = document.createElement("p");
          p.textContent = para;
          return p;
        }),
      );
    } else setText(el, value);
  }
}

function initReveal() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = document.querySelectorAll("[data-reveal]");

  // No IntersectionObserver, or motion is unwelcome: show everything immediately.
  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );

  targets.forEach((el) => observer.observe(el));
}

// Added by JS, so the reveal styles only apply when JS is alive to undo them.
document.documentElement.classList.add("js");

hydrate();
initReveal();
