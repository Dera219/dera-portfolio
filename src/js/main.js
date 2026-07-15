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

      const h3 = document.createElement("h3");
      h3.textContent = p.name;

      const blurb = document.createElement("p");
      blurb.textContent = p.blurb;

      const tech = document.createElement("p");
      tech.className = "tech";
      tech.textContent = (p.tech ?? []).join(" · ");

      li.append(h3, blurb, tech);

      if (p.links?.repo && !p.links.repo.startsWith("TODO")) {
        const a = document.createElement("a");
        a.href = p.links.repo;
        a.textContent = "Source";
        // noopener is required on target=_blank: without it the opened page gets a handle back
        // to this window via window.opener and can redirect it.
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        li.append(a);
      }
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

  for (const el of document.querySelectorAll("[data-content]")) {
    const path = el.dataset.content;
    const value = resolve(content, path);
    if (value == null) continue;

    if (path === "projects") renderProjects(el, value);
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
