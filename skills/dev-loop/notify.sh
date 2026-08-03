#!/usr/bin/env bash
#
# /dev-loop's messaging channel. Reads ONE message on standard input and sends it.
#
#   printf '%s' "$message" | notify.sh
#
# notifications.md's Channel contract specifies its behaviour; this is only the implementation.
# Two notes for whoever edits it next, because both properties look like accidents:
#
# 1. THERE IS DELIBERATELY NO VARIABLE HOLDING THE MESSAGE. It goes from standard input to the
#    HTTP client's URL-encoder without passing through a shell string, which is what the
#    contract requires. Do not "simplify" it into an argument: what does not exist cannot be
#    interpolated, and a composed string fails on exactly the messages that matter most.
#
# 2. EXIT 0 IS ALWAYS CORRECT HERE, including with no configuration and including on a failed
#    send. The contract makes an unconfigured channel silent and messaging best-effort, so a
#    non-zero exit would let a notification change the outcome of the lane reporting it.
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
