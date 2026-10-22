"use strict";
const isZh = document.documentElement.lang.startsWith("zh");
const ui = isZh
  ? { fit: "适应窗口", original: "原始尺寸", copied: "已复制引用。", selected: "已选中引用，请按 Ctrl+C（或 Command+C）复制。", figure: "论文插图" }
  : { fit: "Fit to window", original: "Zoom to original", copied: "Citation copied.", selected: "Citation selected. Press Ctrl+C (or Command+C) to copy.", figure: "Paper figure" };
const config = window.DYNAFLOW_CONFIG || {};
for (const [key, id] of [["authors", "project-authors"], ["affiliations", "project-affiliations"], ["citation", "citation-text"]]) {
  const element = document.getElementById(id);
  const value = config[key]?.trim() || "";
  element.textContent = value;
  element.hidden = !value;
}
const hasCitation = Boolean(config.citation?.trim());
document.getElementById("citation").hidden = !hasCitation;
document.querySelectorAll("[data-citation-link]").forEach(link => { link.hidden = !hasCitation; });
if (config.subtitle && config.subtitle !== "Learning Free-Form Multi-Agent Orchestration") document.getElementById("project-subtitle").textContent = config.subtitle;
document.querySelectorAll("[data-resource]").forEach(link => {
  const url = config.links?.[link.dataset.resource];
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return;
    link.href = parsed.href;
    link.hidden = false;
    const row = link.closest("[data-resource-row]");
    if (row) row.hidden = false;
    link.removeAttribute("aria-disabled");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.querySelector("small")?.remove();
    if (link.classList.contains("release-status")) link.textContent = "Open resource ↗";
  } catch { /* Invalid or incomplete URLs stay unavailable. */ }
});
const menu = document.getElementById("contents");
const menuToggle = document.getElementById("menu-toggle");
menuToggle.addEventListener("click", () => { menu.showModal(); menuToggle.setAttribute("aria-expanded", "true"); });
document.getElementById("menu-close").addEventListener("click", () => menu.close());
menu.addEventListener("close", () => menuToggle.setAttribute("aria-expanded", "false"));
menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => menu.close()));
menu.addEventListener("click", event => { if (event.target === menu) { const rect = menu.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) menu.close(); } });

// Benchmark counts from paper Table 1; also provided in assets/results.json.
const populations = [30, 30, 30, 200, 198, 200, 688];
const resultCounts = [[29, 28, 26, 166, 169, 93, 511], [27, 28, 29, 169, 170, 101, 524], [29, 28, 28, 175, 175, 96, 531], [28, 29, 30, 172, 173, 94, 526], [28, 28, 28, 148, 165, 95, 492], [25, 22, 22, 132, 158, 155, 514], [19, 19, 22, 128, 154, 106, 448], [23, 21, 21, 140, 154, 163, 522], [28, 27, 27, 174, 172, 103, 531], [28, 30, 29, 183, 166, 169, 605], [30, 30, 30, 181, 168, 167, 606]];
const resultRows = [...document.querySelectorAll("#results-body tr")].filter(row => row.querySelector("td"));
function renderResults(format) {
  resultRows.forEach((row, index) => [...row.querySelectorAll("td")].forEach((cell, column) => {
    const correct = resultCounts[index][column];
    cell.textContent = format === "count" ? `${correct} / ${populations[column]}` : (correct / populations[column] * 100).toFixed(2);
  }));
  document.querySelectorAll("[data-format]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.format === format)));
}
document.querySelectorAll("[data-format]").forEach(button => button.addEventListener("click", () => renderResults(button.dataset.format)));
// Keep all four manuscript cases readable when JavaScript is unavailable.
const tabs = [...document.querySelectorAll("[data-case]")];
const casePanels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));
function selectCase(tab) {
  tabs.forEach((button, index) => {
    const selected = button === tab;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    casePanels[index].hidden = !selected;
  });
}
if (tabs.length) {
  selectCase(tabs[0]);
  document.querySelector(".case-tabs").hidden = false;
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCase(tab));
  tab.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectCase(tabs[next]); tabs[next].focus(); }
  });
});

// Original image links remain functional without dialog support or JavaScript.
const figureViewer = document.getElementById("figure-viewer");
const figureImage = document.getElementById("figure-viewer-image");
const figureScale = document.getElementById("figure-scale");
const figureViewport = figureViewer.querySelector(".figure-viewport");
let figureOpener;
function setFigureScale(original) {
  figureViewport.classList.toggle("is-original", original);
  figureScale.setAttribute("aria-pressed", String(original));
  figureScale.textContent = original ? ui.fit : ui.original;
}
document.querySelectorAll("[data-figure-zoom]").forEach(link => {
  link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof figureViewer.showModal !== "function") return;
    event.preventDefault();
    const figure = link.closest("figure");
    const preview = figure.querySelector("img");
    figureOpener = link;
    figureImage.src = preview.src;
    figureImage.alt = preview.alt;
    document.getElementById("figure-original").href = preview.src;
    document.getElementById("figure-viewer-title").textContent = figure.querySelector("figcaption strong")?.textContent || ui.figure;
    setFigureScale(false);
    figureViewer.showModal();
    figureViewport.scrollTop = 0;
    figureViewport.scrollLeft = 0;
    document.getElementById("figure-close").focus();
  });
});
figureScale.addEventListener("click", () => setFigureScale(figureScale.getAttribute("aria-pressed") !== "true"));
document.getElementById("figure-close").addEventListener("click", () => figureViewer.close());
figureViewer.addEventListener("close", () => figureOpener?.focus());
figureViewer.addEventListener("click", event => {
  if (event.target !== figureViewer) return;
  const rect = figureViewer.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) figureViewer.close();
});

document.getElementById("copy-citation").addEventListener("click", async () => {
  const citation = document.getElementById("citation-text");
  const status = document.getElementById("copy-status");
  try { await navigator.clipboard.writeText(citation.textContent); status.textContent = ui.copied; }
  catch { const range = document.createRange(); range.selectNodeContents(citation); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); status.textContent = ui.selected; }
});

// Analysis carousel: arrows, tabs, ←/→ keys and swipe; all slides stay visible without JavaScript.
document.querySelectorAll("[data-carousel]").forEach(carousel => {
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const tabsInCarousel = [...carousel.querySelectorAll("[data-slide]")];
  const track = carousel.querySelector(".carousel-track");
  let current = 0;
  function show(index, direction = 0) {
    current = (index + slides.length) % slides.length;
    carousel.style.setProperty("--slide-from", `${direction * 24}px`);
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    tabsInCarousel.forEach((tab, i) => tab.setAttribute("aria-pressed", String(i === current)));
  }
  carousel.querySelectorAll("[data-dir]").forEach(button => button.addEventListener("click", () => {
    const step = Number(button.dataset.dir);
    show(current + step, step);
  }));
  tabsInCarousel.forEach((tab, i) => tab.addEventListener("click", () => show(i, Math.sign(i - current))));
  carousel.addEventListener("keydown", event => {
    if (event.target.closest("a")) return;
    if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1, 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1, -1); }
  });
  let touchX = null;
  track.addEventListener("touchstart", event => { touchX = event.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", event => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  carousel.querySelector(".carousel-controls").hidden = false;
  carousel.querySelector(".carousel-hint").hidden = false;
  carousel.classList.add("is-ready");
  show(0);
});

// Keep the reader's current section when switching between English and Chinese.
document.querySelectorAll("[data-lang-link]").forEach((link) => {
  link.addEventListener("click", () => {
    const base = link.getAttribute("href").split("#")[0];
    if (location.hash) link.setAttribute("href", base + location.hash);
  });
});
