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
// Drawn behind another screen, a page fills its frame and writes nothing back.
const framed = window.parent !== window;
root.classList.toggle("framed", framed);
// What a person last chose, where the browser lets a local page keep it.
const kept = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};

// The switches the address names, by query key: a default leaves its key out, a switch with none is
// always named, and own marks one a link leaves behind. Only a design prototype writes the address.
const switches = new Map();
const asked = new URLSearchParams(location.search);
let addressed = false;
function address() {
  if (!addressed) return;
  const query = new URLSearchParams();
  // The page's own switches lead, where a link written by hand puts them.
  [...switches].sort(([, a], [, b]) => b.own - a.own).forEach(([key, s]) => { if (s.now !== s.first) query.set(key, s.now); });
  // A page opened from disk may refuse the write, and a switch must still work.
  try { history.replaceState(null, "", location.pathname + (`${query}` && `?${query}`)); } catch {}
}
// The address is read first, then each fallback, then the default; apply returns false for a value
// the switch does not know.
function addSwitch(key, { first, apply, own = false }, ...fallbacks) {
  const s = { first, own, now: first };
  switches.set(key, s);
  s.now = [asked.get(key), ...fallbacks, first].find((value) => value != null && apply(value) !== false);
}
function switched(key, value) {
  const s = switches.get(key);
  if (!s) return;
  s.now = value;
  address();
  document.querySelectorAll("[data-over]:has(> iframe)").forEach(drawBehind);
}
// The link, carrying every switch but the page's own; a key the link already sets wins. every carries
// a default too, for a page whose own default may differ.
function carry(href, every = false) {
  const url = new URL(href, location.href);
  switches.forEach((s, key) => {
    if (!s.own && (every || s.now !== s.first) && !url.searchParams.has(key)) url.searchParams.set(key, s.now);
  });
  return url.href;
}
// The page behind, in a frame: pages opened from disk share no origin, so its address is all that
// reaches it. A new frame each time, as moving one on would add to the window's history.
function drawBehind(el) {
  const src = carry(el.dataset.over, true);
  if (el.firstElementChild?.src === src) return;
  const frame = document.createElement("iframe");
  frame.setAttribute("inert", "");
  frame.src = src;
  el.replaceChildren(frame);
}
// A value naming no file is a screen the draft has yet to give a page, and stands in by its name.
function wireOver(screen) {
  screen.querySelectorAll("[data-over]").forEach((el) => { if (/[./]/.test(el.dataset.over)) drawBehind(el); });
}

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
// Set while the head loads, so the page never paints in the other theme first. It has no default to
// leave out: without the key each reader gets their own theme, so a link has to name it either way.
addSwitch("theme", { first: null, apply: (name) => (name === "light" || name === "dark" ? setTheme(name) : false) },
  kept.get("skeleton-theme"), matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

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

// "a !b" asks for every key listed and none marked "!".
function holds(list, keys) {
  return list.split(/\s+/).filter(Boolean).every((w) => (w.startsWith("!") ? !keys.includes(w.slice(1)) : keys.includes(w)));
}

// What a screen is showing: its state, its persona and the keys in effect, which a hook may set apart
// from the persona's own.
const views = new WeakMap();
const view = (screen) => views.get(screen) || views.set(screen, { keys: [] }).get(screen);
// One pass over both attributes, so neither change can show what the other hides.
function reveal(screen) {
  const { state, keys } = view(screen);
  screen.querySelectorAll("[data-when], [data-perm]").forEach((el) => {
    const { when, perm } = el.dataset;
    // With no state to ask, data-when decides nothing, and an element written hidden stays so.
    if (state == null && perm == null) return;
    el.hidden = !((when == null || state == null || names(when, state)) && (perm == null || holds(perm, keys)));
  });
}
// The keys in effect on a screen; a project hook calls it when something other than the persona grants them.
function setKeys(screen, keys) {
  view(screen).keys = [...(keys || [])];
  reveal(screen);
}
// The persona in effect on a screen, as { id, persona }; null on a screen naming none.
function personaOf(screen) {
  return view(screen).persona || null;
}

// A screen's states. Returns show(state, driven): driven is true when a control on the screen moved it,
// which is what lets a data-then state move on; a state picked from its button stays.
function wireStates(screen) {
  const buttons = [...screen.querySelectorAll("[data-state]")];
  if (!buttons.length) return null;
  let timer;
  const show = (state, driven) => {
    const button = buttons.find((b) => b.dataset.state === state);
    if (!button) return false;
    clearTimeout(timer);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    view(screen).state = state;
    reveal(screen);
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

// The persona switch of a screen naming one of the project's; a screen naming none holds no keys.
function wirePersonas(screen) {
  // A page may link no project file, and its states must still run.
  const all = typeof PROJECT === "undefined" ? {} : PROJECT.personas || {};
  setKeys(screen, []);
  const own = screen.dataset.persona;
  if (own == null || !Object.hasOwn(all, own)) return null;
  const group = document.createElement("div");
  group.className = "seg";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Signed in as");
  const who = document.createElement("div");
  const buttons = {};
  const pick = (id) => {
    if (!Object.hasOwn(buttons, id)) return false;
    const persona = all[id];
    press(group, buttons[id]);
    who.replaceChildren(...[persona.name, persona.email].map((line) => Object.assign(document.createElement("div"), { textContent: line })));
    view(screen).persona = { id, persona };
    setKeys(screen, persona.keys);
    screen.dispatchEvent(new CustomEvent("persona", { detail: { id, persona } }));
  };
  Object.entries(all).forEach(([id, persona]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = persona.label;
    button.addEventListener("click", () => {
      pick(id);
      switched("persona", id);
    });
    group.append(button);
    buttons[id] = button;
  });
  return Object.assign(group, { first: own, pick, who });
}

// A switch's value as its button reads: "not-found" is "Not found".
const labelOf = (value) => (value[0].toUpperCase() + value.slice(1)).replace(/-/g, " ");
// The item whose route is the screen's, or else the longest one the screen's sits under.
function markCurrent(frame, route) {
  let current = null;
  frame.querySelectorAll("[data-route]").forEach((item) => {
    const at = item.dataset.route;
    // "/" sits above every route, so it is current only at itself.
    const on = route === at || (at !== "/" && route.startsWith(`${at}/`));
    if (on && (!current || at.length > current.dataset.route.length)) current = item;
  });
  current?.setAttribute("aria-current", "page");
}
// The shell a screen names, drawn by the project around what the page wrote there. Returns its switches.
function wireShell(screen) {
  const el = screen.querySelector("[data-shell]");
  const shell = el && typeof PROJECT !== "undefined" && (PROJECT.shells || {})[el.dataset.shell];
  if (!shell) return [];
  // Moved into each frame, never written again, so what is wired to these nodes stays wired.
  const content = [...el.childNodes];
  const route = screen.dataset.route || "";
  const now = {};
  const draw = () => {
    const frame = document.createElement("template");
    frame.innerHTML = shell.draw({ persona: personaOf(screen)?.persona || null, route, switches: { ...now } });
    markCurrent(frame.content, route);
    // A shell that marks no place still shows the screen: its content follows the frame.
    (frame.content.querySelector("[data-shell-slot]") || frame.content).append(...content);
    el.replaceChildren(frame.content);
  };
  // A shell's switch named as one of the skeleton's own would take that switch's key in the address.
  const mine = Object.entries(shell.switches || {}).filter(([key]) => !["state", "size", "theme", "persona"].includes(key));
  const groups = mine.map(([key, values]) => {
    const group = document.createElement("div");
    group.className = "seg";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", labelOf(key));
    const buttons = {};
    const pick = (value) => {
      if (!Object.hasOwn(buttons, value)) return false;
      now[key] = value;
      press(group, buttons[value]);
      draw();
    };
    values.forEach((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = labelOf(value);
      button.addEventListener("click", () => {
        pick(value);
        switched(key, value);
      });
      group.append(button);
      buttons[value] = button;
    });
    now[key] = values[0];
    press(group, buttons[values[0]]);
    return Object.assign(group, { key, first: values[0], pick });
  });
  screen.addEventListener("persona", draw);
  draw();
  return groups;
}

// A size is named in the address as a state is: lowercase, hyphenated.
const sizeName = (label) => label.toLowerCase().replace(/\s+/g, "-");
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
  const buttons = {};
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
      switched("size", sizeName(label));
    });
    group.append(button);
    buttons[sizeName(label)] = button;
    if (label === START[kind]) button.click();
  });
  let room = stage.clientWidth;
  new ResizeObserver(() => { if (stage.clientWidth !== room) { room = stage.clientWidth; fit(); } }).observe(stage);
  group.first = sizeName(START[kind]);
  group.pick = (name) => (Object.hasOwn(buttons, name) ? buttons[name].click() : false);
  return group;
}

// From this width a fresh browser opens the panel: the line skeleton.css draws between wide and narrow.
const WIDE = "(min-width: 64rem)";
// The contract's kinds, in the order the panel lists them.
const KINDS = ["default", "error", "empty", "loading", "success", "dialog", "first-run"];
// A design prototype's floating panel, drawn around the lists its <aside data-panel> holds.
function buildPanel(screen, sizes, personas, shell) {
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
    return box;
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
  const states = panel.querySelector(".states");
  // Drawn here only: wireStates has already read the page's order, whose first button is the default state.
  const stateButtons = [...(states?.children || [])];
  [...new Set([...KINDS, ...stateButtons.map((b) => b.dataset.kind)])].forEach((kind) => {
    const own = stateButtons.filter((b) => b.dataset.kind === kind);
    if (!own.length) return;
    const label = document.createElement("div");
    label.className = "kind";
    label.textContent = KINDS.includes(kind) ? labelOf(kind) : kind;
    states.append(label, ...own);
  });
  group("State", states);
  shell.forEach((el) => group(el.getAttribute("aria-label"), el));
  group("Signed in as", personas)?.append(personas.who);
  group("Size", sizes);
  group("Theme", themes);
  const docks = document.createElement("div");
  docks.className = "seg";
  docks.setAttribute("role", "group");
  docks.setAttribute("aria-label", "Dock");
  // Raised while a data-avoid element shows in the box the panel takes at the bottom of its side.
  const stepAside = () => {
    const at = panel.getBoundingClientRect();
    const drop = panel.classList.contains("raised") ? root.clientHeight - at.bottom - at.top : 0;
    panel.classList.toggle("raised", [...screen.querySelectorAll("[data-avoid]")].some((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.left < at.right && box.right > at.left && box.top < at.bottom + drop && box.bottom > at.top + drop;
    }));
  };
  const dock = (side) => {
    panel.classList.toggle("docked-left", side === "left");
    press(docks, docks.children[side === "left" ? 0 : 1]);
    stepAside();
  };
  ["left", "right"].forEach((side) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = labelOf(side);
    button.addEventListener("click", () => {
      dock(side);
      kept.set("skeleton-dock", side);
    });
    docks.append(button);
  });
  group("Dock", docks);
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
  // Kept by the browser and never in the address: a link says nothing of where its reader likes the panel.
  dock(kept.get("skeleton-dock") || (typeof PROJECT === "undefined" ? null : PROJECT.dock));
  // The elements' own boxes are watched, so whatever shows or hides one counts: a state, a persona, a page's script.
  new MutationObserver(stepAside).observe(screen, { subtree: true, childList: true, attributes: true });
  new ResizeObserver(stepAside).observe(panel);
  addEventListener("resize", stepAside);
  addEventListener("scroll", stepAside, { capture: true, passive: true });
  // As the theme's first value: what the browser kept, else what the window's width suggests.
  collapse((kept.get("skeleton-panel") || (matchMedia(WIDE).matches ? "open" : "collapsed")) === "collapsed");
  // The collapsed panel still names the state on show.
  screen.addEventListener("state", (e) => {
    toggle.querySelector(".now").textContent = e.detail.label;
    switched("state", e.detail.state);
  });
}

// A design prototype's switches, read from its address, which then names every one off its default.
function wireAddress(show, sizes, personas, shell) {
  // Before the state, so its first showing already has the persona's keys.
  if (personas) addSwitch("persona", { first: personas.first, apply: personas.pick });
  shell.forEach((el) => addSwitch(el.key, { first: el.first, apply: el.pick }));
  // #<state> opened a state before the query did, and links already written still use it.
  if (show) addSwitch("state", { first: show.first, apply: (name) => show(name, false), own: true }, decodeURIComponent(location.hash.slice(1)));
  if (sizes) addSwitch("size", { first: sizes.first, apply: sizes.pick });
  addressed = !framed;
  address();
  // Each click starts from the link as written, so one followed twice carries the view of the second time.
  const written = new WeakMap();
  const carried = (e) => {
    const link = e.target.closest("a[href]");
    if (!link || link.getAttribute("href").startsWith("#")) return;
    if (link.protocol !== location.protocol || link.host !== location.host) return;
    if (!written.has(link)) written.set(link, link.href);
    link.href = carry(written.get(link));
  };
  // A new tab opens from a middle click or the context menu, and neither of them is a click.
  ["click", "auxclick", "contextmenu"].forEach((type) => document.addEventListener(type, carried));
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${SPRITE}</svg>`);
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    const show = wireStates(screen);
    wireOptions(screen);
    const sizes = framed ? null : wireSizes(screen);
    const personas = wirePersonas(screen);
    const shell = wireShell(screen);
    if (screen.querySelector("[data-panel]")) {
      if (!framed) buildPanel(screen, sizes, personas, shell);
      wireAddress(show, sizes, personas, shell);
    } else {
      if (sizes) screen.querySelector(".head")?.append(sizes);
      screen.querySelector(".head")?.append(...shell);
      if (personas) {
        screen.querySelector(".head")?.append(personas);
        personas.pick(personas.first);
      }
      if (show) show(show.first, false);
    }
    // Last, so the frame's first address already carries every switch.
    wireOver(screen);
  });
  setTheme(theme);
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-theme-btn]");
    if (!button) return;
    setTheme(button.dataset.themeBtn);
    kept.set("skeleton-theme", button.dataset.themeBtn);
    switched("theme", button.dataset.themeBtn);
  });
});
