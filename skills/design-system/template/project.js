/* PROJECT — what the project defines once and every page reads. The markup contract is skeleton.html's
   leading comment. */

// The personas, in the order the switch draws them. keys are what data-perm asks for.
const PROJECT = {
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
};
