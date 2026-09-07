/**
 * Page renderer.
 *
 * Copy lives in content.js, markup lives in index.html, and this file is the only place the
 * two meet. Three things here are worth knowing about:
 *
 *   1. Text is escaped before any markup is added to it. `*emphasis*` and audit chips are
 *      applied to the escaped string, so a stray angle bracket in the copy can never become
 *      an element.
 *   2. Audit chips are matched by phrase against the AUDIT_PHRASES table below. Only the first
 *      occurrence of each phrase is linked, so a number repeated in prose does not turn the
 *      paragraph into a row of buttons.
 *   3. Nothing here throws on missing content. A key that is absent leaves the static fallback
 *      in index.html standing, which is the useful failure.
 */

import { content, audits } from "../content.js";
import { mountInstrument } from "./instruments.js";

/* ---- Text -------------------------------------------------------------- */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

/** Phrase in the copy -> key in `audits`. First match only, longest phrases first. */
const AUDIT_PHRASES = [
  ["8,400-line", "toolbelt-loc"],
  ["It has no users", "toolbelt-users"],
  ["18 adversarial scenarios", "tradedesk-scenarios"],
  ["408 tests", "crucible-tests"],
  ["thirteen", "crucible-bugs"],
  ["~3 points", "nutrition-inflation"],
  ["~74%", "nutrition-clean"],
];

let auditSeq = 0;

/**
 * Escape, then apply emphasis markers, then link the first occurrence of each audited phrase.
 * `seen` is shared across one project's paragraphs so a phrase is linked once per project.
 */
function rich(text, seen) {
  let out = escapeHtml(text).replace(/\*([^*]+)\*/g, "<em>$1</em>");

  for (const [phrase, key] of AUDIT_PHRASES) {
    if (!audits[key] || seen?.has(key)) continue;
    const escaped = escapeHtml(phrase);
    const at = out.indexOf(escaped);
    if (at === -1) continue;
    seen?.add(key);
    const id = `audit-${++auditSeq}`;
    const chip =
      `<button type="button" class="audit" data-audit="${key}" ` +
      `aria-expanded="false" aria-controls="${id}">${escaped}</button>`;
    out = out.slice(0, at) + chip + out.slice(at + escaped.length);
  }
  return out;
}

function paragraphs(target, bodies, seen) {
  target.innerHTML = bodies.map((p) => `<p>${rich(p, seen)}</p>`).join("");
}

/* ---- Audit panels ------------------------------------------------------ */

/**
 * One open panel at a time. The panel is inserted after the paragraph containing the chip
 * rather than inline, so expanding it never reflows the sentence being read.
 */
function wireAudits(root) {
  root.addEventListener("click", (event) => {
    const chip = event.target.closest(".audit");
    if (!chip) return;

    const key = chip.dataset.audit;
    const record = audits[key];
    if (!record) return;

    const panelId = chip.getAttribute("aria-controls");
    const existing = document.getElementById(panelId);
    if (existing) {
      existing.remove();
      chip.setAttribute("aria-expanded", "false");
      return;
    }

    root.querySelectorAll(".audit-panel").forEach((p) => p.remove());
    root
      .querySelectorAll('.audit[aria-expanded="true"]')
      .forEach((b) => b.setAttribute("aria-expanded", "false"));

    const panel = document.createElement("div");
    panel.className = "audit-panel";
    panel.id = panelId;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", `How "${record.claim}" was checked`);
    panel.innerHTML = `
      <dl>
        <dt>Claim</dt><dd>${escapeHtml(record.claim)}</dd>
        <dt>Method</dt><dd>${escapeHtml(record.method)}</dd>
        <dt>Result</dt><dd class="ok">${escapeHtml(record.result)}</dd>
        <dt>Source</dt><dd>${escapeHtml(record.source)}</dd>
        <dt>Checked</dt><dd>${escapeHtml(record.checked)}</dd>
      </dl>`;

    // Panels always land at the foot of the project's text column. Inserting one next to the
    // chip put it inside the readout, where the column is ~50px wide and every value wrapped
    // one character per line; and appending it mid-paragraph moved the sentence being read.
    const body = chip.closest(".project")?.querySelector(".project-body");
    if (body) body.append(panel);
    else chip.closest("p, li, div")?.after(panel);

    chip.setAttribute("aria-expanded", "true");
  });
}

/* ---- Projects ---------------------------------------------------------- */

const LINK_LABELS = [
  ["live", "Live site"],
  ["repo", "Source"],
  ["writeup", "Write-up"],
];

function renderProjects(list, projects) {
  list.innerHTML = "";
  const teardowns = [];

  projects.forEach((project, i) => {
    const seen = new Set();
    const li = document.createElement("li");
    li.className = "project";

    const figure = document.createElement("figure");
    figure.className = "project-figure";
    figure.innerHTML = `
      <figcaption class="figure-bar label">
        <span>${escapeHtml(project.key || "figure")}</span>
        <span class="live">live</span>
      </figcaption>
      <canvas role="img" aria-label="${escapeHtml(project.imageAlt || project.name)}"></canvas>`;

    if (Array.isArray(project.metrics) && project.metrics.length) {
      const metrics = document.createElement("ul");
      metrics.className = "metrics";
      // A readout may carry an audit key of its own, for figures that never appear in prose.
      metrics.innerHTML = project.metrics
        .map(([k, v, auditKey]) => {
          const value = escapeHtml(v);
          const cell =
            auditKey && audits[auditKey]
              ? `<button type="button" class="audit" data-audit="${auditKey}" ` +
                `aria-expanded="false" aria-controls="audit-${++auditSeq}">${value}</button>`
              : value;
          return `<li><span class="k">${escapeHtml(k)}</span><span class="v">${cell}</span></li>`;
        })
        .join("");
      figure.append(metrics);
    }

    const body = document.createElement("div");
    body.className = "project-body";

    const index = String(i + 1).padStart(2, "0");
    const tech = (project.tech || [])
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("");
    const links = LINK_LABELS.filter(([k]) => project.links?.[k])
      .map(
        ([k, label]) =>
          `<a href="${escapeHtml(project.links[k])}" rel="noopener">${label} &rarr;</a>`,
      )
      .join("");

    body.innerHTML = `
      <span class="project-index">${index} / ${String(projects.length).padStart(2, "0")}</span>
      <h3>${escapeHtml(project.name)}</h3>
      ${project.thesis ? `<p class="project-thesis">${rich(project.thesis, seen)}</p>` : ""}
      <p class="project-blurb">${rich(project.blurb, seen)}</p>
      ${
        project.learned
          ? `<div class="project-learned"><span class="label">What it taught me</span>${rich(
              project.learned,
              seen,
            )}</div>`
          : ""
      }
      ${tech ? `<ul class="project-tech">${tech}</ul>` : ""}
      ${links ? `<div class="project-links">${links}</div>` : ""}`;

    li.append(figure, body);
    list.append(li);

    const canvas = figure.querySelector("canvas");
    if (project.key) teardowns.push(mountInstrument(canvas, project.key));
  });

  return teardowns;
}

/* ---- Other sections ---------------------------------------------------- */

function renderExperience(list, roles) {
  list.innerHTML = roles
    .map(
      (r) => `
      <li>
        <p class="label">${escapeHtml(r.period)}</p>
        <div>
          <h3>${escapeHtml(r.role)} <span class="org">${escapeHtml(r.org)}</span></h3>
          <p>${escapeHtml(r.detail)}</p>
        </div>
      </li>`,
    )
    .join("");
}

function renderLinks(list, links) {
  const rows = [
    ["GitHub", links.github],
    ["LinkedIn", links.linkedin],
    ["Email", links.email ? `mailto:${links.email}` : null],
    ["Resume", links.resume],
  ].filter(([, href]) => href);

  list.innerHTML = rows
    .map(([label, href]) => `<li><a href="${escapeHtml(href)}">${label}</a></li>`).join("");
}

/* ---- Reveal + chrome --------------------------------------------------- */

function observeReveals() {
  const targets = document.querySelectorAll("[data-reveal], .project");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.setAttribute("data-seen", "true"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-seen", "true");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  targets.forEach((el) => io.observe(el));
}

function watchHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const set = () => header.setAttribute("data-scrolled", String(window.scrollY > 24));
  set();
  window.addEventListener("scroll", set, { passive: true });
}

/* ---- Boot -------------------------------------------------------------- */

function boot() {
  const set = (selector, fn) => {
    const el = document.querySelector(`[data-content="${selector}"]`);
    if (el) fn(el);
  };

  set("hero.tagline", (el) => (el.innerHTML = rich(content.hero.tagline)));
  set("hero.subtitle", (el) => (el.textContent = content.hero.subtitle));
  set("thesis.label", (el) => (el.textContent = content.thesis.label));
  set("thesis.body", (el) => (el.innerHTML = rich(content.thesis.body)));
  set("contact.lead", (el) => (el.innerHTML = rich(content.contact.lead)));
  set("meta.name", (el) => (el.textContent = content.meta.name));
  set("about.body", (el) => paragraphs(el, content.about.body, new Set()));
  set("projects", (el) => renderProjects(el, content.projects));
  set("experience", (el) => renderExperience(el, content.experience));
  set("links", (el) => renderLinks(el, content.links));

  const heroCanvas = document.querySelector(".hero-canvas");
  if (heroCanvas) mountInstrument(heroCanvas, "hero");

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  if (content.meta.title) document.title = content.meta.title;

  wireAudits(document.body);
  observeReveals();
  watchHeader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
