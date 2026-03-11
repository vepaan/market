#!/bin/bash

# Cleanup background processes on exit (Ctrl+C)
trap "kill 0" EXIT

echo "--------------------------------------------"
echo "             LAUNCHING EXCHANGE             "
echo "--------------------------------------------"

# build backend
echo "[BUILD] Preparing Backend..."
mkdir -p build
cd build

echo "[BUILD] Running CMake and Make..."
cmake ..
if make -j$(nproc); then
    echo "[BUILD] Backend compiled successfully."
else
    echo "[ERROR] Build failed. Please check the compiler output above."
    exit 1
fi

# Return to backend dir
cd ..

# Start the Exchange Server (C++)
SERVER_BIN="./build/exchange_server"

if [ -f "$SERVER_BIN" ]; then
    echo "[SYSTEM] Starting Exchange Server..."
    $SERVER_BIN &
else
    echo "[ERROR] exchange_server binary not found at $SERVER_BIN"
    echo "Check if you ran 'cmake .. && make' inside backend/build"
    exit 1
fi

# Start the Bridge
BRIDGE_DIR="./bridge"
if [ -d "$BRIDGE_DIR" ]; then
    echo "[SYSTEM] Starting Node.js Bridge..."
    (cd $BRIDGE_DIR && node bridge.js) &
else
    echo "[ERROR] Bridge directory not found at $BRIDGE_DIR"
fi

# Start the Frontend
# echo "[SYSTEM] Starting Frontend..."
# cd frontend && npm run dev &

echo "--------------------------------------------"
echo " ALL COMPONENTS LIVE. PRESS CTRL+C TO STOP  "
echo "--------------------------------------------"

# Keep the script running so it doesn't immediately close the background tasks
wait