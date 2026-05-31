#!/usr/bin/env bash
# Report whether the detached server is running.
cd "$(dirname "$0")/.."

PIDFILE=".server.pid"

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
	echo "Running (PID $(cat "$PIDFILE")). Logs: server.log"
else
	echo "Not running."
	[ -f "$PIDFILE" ] && echo "(stale $PIDFILE present — run 'npm run stop' to clear)"
fi
exit 0
