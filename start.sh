#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  CASCADIA — Predict the ripple. Prevent the collapse."
echo "  AI / SRE Intelligent Incident Prediction & Recovery"
echo "=========================================================="

PORT=8000
HOST="127.0.0.1"

# Check if port 8000 is occupied
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "[!] Port $PORT is already running a service. Reusing existing instance."
else
    echo "[*] Launching CASCADIA API & Web Server on http://$HOST:$PORT ..."
    python3 -m uvicorn --app-dir backend main:app --host $HOST --port $PORT &
    sleep 2
fi

echo ""
echo ">> CASCADIA Web Application Ready: http://$HOST:$PORT"
echo ">> API Documentation:             http://$HOST:$PORT/docs"
echo ">> Evaluation Benchmark:          http://$HOST:$PORT/api/evaluate"
echo "=========================================================="
