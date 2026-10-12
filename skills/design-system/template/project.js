/* PROJECT — what the project defines once and every page reads. The markup contract is skeleton.html's
   leading comment. */

// The personas, in the order the switch draws them. keys are what data-perm asks for.
const PROJECT = {
  personas: {
    holder: { label: "Policy holder", name: "Rina Okafor", email: "rina@example.com", keys: ["claims.report"] },
    adjuster: { label: "Claims adjuster", name: "Tomas Lind", email: "tomas@example.com", keys: ["claims.report", "claims.approve"] },
  },
};
