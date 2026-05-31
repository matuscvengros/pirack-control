#!/usr/bin/env bash
# Stop the detached server started by scripts/serve.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

PIDFILE=".server.pid"

if [ ! -f "$PIDFILE" ]; then
	echo "Not running (no $PIDFILE)."
	exit 0
fi

PID="$(cat "$PIDFILE")"
if kill -0 "$PID" 2>/dev/null; then
	kill "$PID" && echo "Stopped (PID $PID)."
else
	echo "Process $PID not running (removing stale $PIDFILE)."
fi
rm -f "$PIDFILE"
