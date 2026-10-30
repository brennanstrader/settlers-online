#!/usr/bin/env bash
# Starts (or restarts) the Settlers Online server and the public tunnel in the background.
cd "$(dirname "$0")"
mkdir -p logs data
pkill -f "node server.js" 2>/dev/null
sleep 0.5
PORT=${PORT:-3457} nohup bash -c 'while true; do node server.js; echo "server exited, restarting in 2s"; sleep 2; done' >> logs/server.log 2>&1 &
echo "server started on :${PORT:-3457} (log: logs/server.log)"
