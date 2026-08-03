#!/usr/bin/env bash
#
# /dev-loop's messaging channel. Reads ONE message on standard input and sends it.
#
#   printf '%s' "$message" | notify.sh
#
# Its behaviour is specified in notifications.md's Channel contract; this is only the
# implementation. Two properties are load-bearing and neither is an optimisation:
#
# 1. THE PAYLOAD ARRIVES ON STANDARD INPUT AND NEVER ENTERS A SHELL STRING. Messages
#    interpolate agent-generated free text, which carries backticks, dollar signs, quotes and
#    newlines. Composing a shell string around that fails — silently, and on exactly the
#    message that matters most, because the worst failures produce the ugliest text. Handing
#    stdin straight to the HTTP client to URL-encode closes that at its root rather than
#    escaping or validating after the fact. There is deliberately no variable holding the
#    message anywhere below: what does not exist cannot be interpolated.
#
# 2. SILENT UNLESS CONFIGURED. With either variable missing the script says nothing and exits
#    successfully. That is what makes the channel genuinely optional at zero cost — no profile
#    key, no ask-then-persist question, no intake precondition, and a developer who never sets
#    it up gets silence rather than an error on every lane.
#
# Configuration is per-machine, in the environment:
#
#   TELEGRAM_BOT_TOKEN   the sending bot's token
#   TELEGRAM_CHAT_ID     where to send
#
# Sending outbound is safe to do concurrently with another process using the same bot; only
# long-polling readers steal each other's updates, which notifications.md records.

set -euo pipefail

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  # Drain first. Exiting before reading makes a broken pipe for whoever is piping into us,
  # which under `set -o pipefail` fails their command — opting out must cost the caller nothing.
  cat >/dev/null
  exit 0
fi

# `text@-` reads the payload from standard input and URL-encodes it; the message is never an
# argument, so no quoting decision is made about it anywhere.
curl --silent --show-error --max-time 10 --output /dev/null \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text@-" \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" || true

# Messaging is best-effort: a channel that cannot reach its endpoint reports on stderr and still
# exits 0, because no notification failure may change a lane's outcome.
exit 0
