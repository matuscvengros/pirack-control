#!/usr/bin/env bash
# Start the built server detached, so it keeps running after the terminal closes.
set -euo pipefail
cd "$(dirname "$0")/.."

PIDFILE=".server.pid"
LOGFILE="server.log"

if [ ! -d build ]; then
	echo "No build/ directory — run 'npm run build' first." >&2
	exit 1
fi

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
	echo "Already running (PID $(cat "$PIDFILE")). Stop it with 'npm run stop'."
	exit 0
fi

# nohup ignores SIGHUP, </dev/null detaches stdin, & backgrounds the process, and
# disown drops it from the shell's job table — so closing the terminal (or the npm
# process exiting) leaves the server running.
nohup node --env-file-if-exists=.env build > "$LOGFILE" 2>&1 < /dev/null &
PID=$!
disown 2>/dev/null || true
echo "$PID" > "$PIDFILE"

echo "Server started (PID $PID), detached."
echo "  Logs:    $LOGFILE   (tail -f $LOGFILE)"
echo "  Status:  npm run status"
echo "  Stop:    npm run stop"
