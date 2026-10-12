/* PROJECT — what the project defines once and every page reads; the markup contract is skeleton.html's
   leading comment. Hooks: data-strength on a password field marks its strength beside the field. */

const PROJECT = {
  // The side the floating panel starts on, "left" or "right", until a person docks it.
  dock: "right",
  // The sizes the size switch offers each kind of screen, as [label, width, height] in CSS pixels,
  // and the one it opens at. A null width is as wide as the stage: the window, in a design prototype.
  sizes: {
    web: { start: "Full", offers: [["Phone", 360], ["Tablet", 768], ["Desktop", 1024], ["Full", null]] },
    mobile: { start: "Phone", offers: [["Phone", 360, 800], ["Tablet", 768, 1024]] },
  },
  // The icons, each drawn as <svg class="i"><use href="#i-name"/></svg>.
  sprite: `
    <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
    <symbol id="i-danger" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></symbol>
    <symbol id="i-success" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></symbol>`,
  // The one place that knows what the token file keys a theme on.
  theme(el, name) {
    el.dataset.theme = name;
  },
  // The personas, in the order the switch draws them. keys are what data-perm asks for.
  personas: {
    holder: { label: "Policy holder", name: "Rina Okafor", email: "rina@example.com", keys: ["claims.report"] },
    adjuster: { label: "Claims adjuster", name: "Tomas Lind", email: "tomas@example.com", keys: ["claims.report", "claims.approve"] },
  },
  // The shells, by the name data-shell asks for. items is this shell's own list, read by its draw.
  shells: {
    app: {
      items: [["Claims", "/claims"], ["Policies", "/policies"], ["Settings", "/settings"]],
      switches: { notifications: ["closed", "open", "empty", "loading", "failed"] },
      draw({ persona, switches }) {
        const notices = {
          open: `<div class="card shell-notices"><div>Claim 0812 is waiting for your photos.</div><div>Your policy renews in 30 days.</div></div>`,
          empty: `<div class="card shell-notices">You have no notifications.</div>`,
          loading: `<div class="card shell-notices">Loading your notifications…</div>`,
          failed: `<div class="card shell-notices"><span class="field-error">Your notifications could not be loaded.</span></div>`,
        };
        return `
          <div class="shell">
            <div class="shell-side">
              <nav class="shell-nav" aria-label="Main">${this.items.map(([label, route]) => `<a data-route="${route}">${label}</a>`).join("")}</nav>
              ${persona ? `<div class="shell-person"><b>${persona.name}</b>${persona.email}</div>` : ""}
            </div>
            <div class="shell-main">
              <div class="shell-bar"><button class="button button-secondary" type="button" aria-expanded="${switches.notifications !== "closed"}">Notifications</button></div>
              ${notices[switches.notifications] || ""}
              <div data-shell-slot></div>
            </div>
          </div>`;
      },
    },
  },
  // Each is run again whenever its screen's view changes, so it draws from the screen and wires nothing.
  hooks: [
    function strength(screen) {
      screen.querySelectorAll("input[data-strength]").forEach((field) => {
        const mark = field.parentElement.querySelector("output") || field.parentElement.appendChild(document.createElement("output"));
        mark.textContent = !field.value ? "" : field.value.length >= 12 && /\d/.test(field.value) ? "Strong" : "Weak";
      });
    },
  ],
};
