---
"ieuanign-skills": minor
---

`dev-loop`: an optional messaging channel, as a bundled script reading its payload on standard input.

Notification messages interpolate agent-generated free text — halt reasons, diagnoses, stack traces — which carries backticks, dollar signs, quotes and newlines. Composing a shell string around that fails silently on exactly the message that matters most, because the worst failures produce the ugliest text. `notify.sh` ships with the skill in the shape that closes that at its root: the payload arrives on standard input and is handed straight to the HTTP client to URL-encode, so it never enters a shell string and there is deliberately no variable holding it anywhere in the script.

**Silent unless configured.** With either of its two environment variables missing it says nothing and exits successfully, which is what makes the channel genuinely optional at zero cost — no profile key, no ask-then-persist question, no intake precondition, and no error on every lane for a developer who never set it up. It drains its input before exiting, so a caller piping into an unconfigured channel never takes a broken pipe. A send that fails still exits 0: messaging is best-effort by specification, and no notification failure may change a lane's outcome.

Rejected, so it is not re-derived: a protocol server. Payload safety was the one real argument for a typed integration and standard input closes it several rungs lower, while a server costs a runtime process, a dependency absent from this package, and a registration living outside the skill — the machine-precondition coupling this pipeline has deliberately been removing.
