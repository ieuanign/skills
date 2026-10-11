/* SKELETON — the hooks every page runs. The markup contract is skeleton.html's leading comment; a hook
   a project adds is listed here. */

// The sizes the size switch offers, as [label, width, height] in CSS pixels. A null width is as wide
// as the stage: the window, in a design prototype. START names the size each kind opens at.
const SIZES = {
  web: [["Phone", 360], ["Tablet", 768], ["Desktop", 1024], ["Full", null]],
  mobile: [["Phone", 360, 800], ["Tablet", 768, 1024]],
};
const START = { web: "Full", mobile: "Phone" };
const KIND = { web: "web", ios: "mobile", android: "mobile" };

// The icons, each drawn as <svg class="i"><use href="#i-name"/></svg>.
const SPRITE = `
  <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
  <symbol id="i-danger" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></symbol>
  <symbol id="i-success" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></symbol>`;

const root = document.documentElement;
// What a person last chose, where the browser lets a local page keep it.
const kept = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};

// The one place that knows what the token file keys a theme on; the reference page calls it too.
function applyTheme(el, theme) {
  el.dataset.theme = theme;
}
let theme;
function setTheme(next) {
  theme = next;
  applyTheme(root, theme);
  document.querySelectorAll("[data-theme-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeBtn === theme)));
}
// Set while the head loads, so the page never paints in the other theme first.
setTheme(kept.get("skeleton-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

function press(group, button) {
  group.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
}

// "a b" names the states listed; "!a" names every state but a.
function names(list, state) {
  const words = list.trim().split(/\s+/);
  const not = words.filter((w) => w.startsWith("!")).map((w) => w.slice(1));
  const only = words.filter((w) => !w.startsWith("!"));
  return !not.includes(state) && (only.length === 0 || only.includes(state));
}

// A screen's states. Returns show(state, driven): driven is true when a control on the screen moved it,
// which is what lets a data-then state move on; a state picked from its button stays.
function wireStates(screen) {
  const buttons = [...screen.querySelectorAll("[data-state]")];
  if (!buttons.length) return null;
  let timer;
  const show = (state, driven) => {
    const button = buttons.find((b) => b.dataset.state === state);
    if (!button) return;
    clearTimeout(timer);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    screen.querySelectorAll("[data-when]").forEach((el) => { el.hidden = !names(el.dataset.when, state); });
    screen.querySelectorAll("[data-disabled-when]").forEach((el) => { el.disabled = names(el.dataset.disabledWhen, state); });
    screen.querySelectorAll("[data-invalid-when]").forEach((el) => { el.setAttribute("aria-invalid", String(names(el.dataset.invalidWhen, state))); });
    if (driven && button.dataset.then) timer = setTimeout(() => show(button.dataset.then, true), 1200);
    screen.dispatchEvent(new CustomEvent("state", { detail: { state, label: button.textContent } }));
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.state, false)));
  screen.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]:not(form)");
    if (go) show(go.dataset.go, true);
  });
  screen.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target.closest("form[data-go]");
    if (form) show(form.dataset.go, true);
  });
  show.first = buttons[0].dataset.state;
  return show;
}

// A mockup's open choice: each option button shows the panel it names; the first is shown.
function wireOptions(screen) {
  const buttons = [...screen.querySelectorAll("[data-option]")];
  const show = (button) => {
    press(button.parentElement, button);
    screen.querySelectorAll("[data-option-panel]").forEach((p) => { p.hidden = p.dataset.optionPanel !== button.dataset.option; });
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(b)));
  if (buttons.length) show(buttons[0]);
}

// The size switch of a web or phone screen: sets its frame's width, and shrinks the frame to its stage.
function wireSizes(screen) {
  const kind = KIND[screen.dataset.surface];
  const stage = screen.querySelector(".stage");
  const frame = stage && stage.querySelector(".frame-browser, .frame-phone, .viewport");
  if (!kind || !frame) return null;
  const sized = frame.classList.contains("frame-phone") ? frame.querySelector(".screen") : frame;
  const fit = () => {
    frame.style.zoom = "";
    const room = stage.clientWidth;
    if (frame.offsetWidth > room) frame.style.zoom = room / frame.offsetWidth;
  };
  const group = document.createElement("div");
  group.className = "sizes";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Size");
  SIZES[kind].forEach(([label, width, height]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      sized.style.width = width ? `${width}px` : "";
      sized.style.height = height ? `${height}px` : "";
      stage.classList.toggle("sized", Boolean(width));
      press(group, button);
      fit();
    });
    group.append(button);
    if (label === START[kind]) button.click();
  });
  let room = stage.clientWidth;
  new ResizeObserver(() => { if (stage.clientWidth !== room) { room = stage.clientWidth; fit(); } }).observe(stage);
  return group;
}

// A design prototype's floating panel, drawn around the lists its <aside data-panel> holds.
function buildPanel(screen, sizes) {
  const panel = screen.querySelector("[data-panel]");
  const body = document.createElement("div");
  body.className = "panel-body";
  const group = (label, el) => {
    if (!el || !el.children.length) return;
    const box = document.createElement("div");
    box.className = "panel-group";
    const heading = document.createElement("div");
    heading.className = "eyebrow";
    heading.textContent = label;
    box.append(heading, el);
    body.append(box);
  };
  const themes = document.createElement("div");
  themes.className = "seg";
  themes.setAttribute("role", "group");
  themes.setAttribute("aria-label", "Theme");
  themes.innerHTML = `<button type="button" data-theme-btn="light">Light</button><button type="button" data-theme-btn="dark">Dark</button>`;
  const reqs = document.createElement("div");
  reqs.className = "req-chips";
  (screen.dataset.req || "").split(/\s+/).filter(Boolean).forEach((id) => {
    const chip = document.createElement("span");
    chip.className = "req-chip";
    chip.textContent = id;
    reqs.append(chip);
  });
  group("State", panel.querySelector(".states"));
  group("Size", sizes);
  group("Theme", themes);
  group("Requirements", reqs);
  group("Behaviour", panel.querySelector(".behaviour"));
  group("Placeholders", panel.querySelector('[data-list="placeholders"]'));

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "panel-toggle";
  toggle.innerHTML = `<span class="title"></span><span class="now"></span><svg class="i" aria-hidden="true"><use href="#i-chevron"/></svg>`;
  toggle.querySelector(".title").textContent = document.title;
  const collapse = (on) => {
    panel.classList.toggle("collapsed", on);
    toggle.setAttribute("aria-expanded", String(!on));
  };
  toggle.addEventListener("click", () => {
    const on = !panel.classList.contains("collapsed");
    collapse(on);
    kept.set("skeleton-panel", on ? "collapsed" : "open");
  });
  panel.replaceChildren(toggle, body);
  collapse(kept.get("skeleton-panel") === "collapsed");
  // The collapsed panel still names the state on show, and the address carries it, so a link can open it.
  screen.addEventListener("state", (e) => {
    toggle.querySelector(".now").textContent = e.detail.label;
    try { history.replaceState(null, "", `#${e.detail.state}`); } catch {}
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${SPRITE}</svg>`);
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    const show = wireStates(screen);
    wireOptions(screen);
    const sizes = wireSizes(screen);
    const prototype = screen.querySelector("[data-panel]");
    if (prototype) buildPanel(screen, sizes);
    else if (sizes) screen.querySelector(".head")?.append(sizes);
    if (show) show(prototype && decodeURIComponent(location.hash.slice(1)) || show.first, false);
  });
  setTheme(theme);
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-theme-btn]");
    if (!button) return;
    setTheme(button.dataset.themeBtn);
    kept.set("skeleton-theme", button.dataset.themeBtn);
  });
});
