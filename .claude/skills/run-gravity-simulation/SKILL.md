---
name: run-gravity-simulation
description: Build, launch, and drive the gravity simulation web app from a clean machine. Uses google-chrome to programmatically control the browser and interact with the running app.
---

# Gravity Simulation Run Skill

This skill builds and runs the NASA terminal-style gravity simulation web app, then uses google-chrome to drive it programmatically.

## Prerequisites

```bash
# Install system dependencies for Chrome/Chromium in headless mode
apt-get update && apt-get install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils
```

## Build

```bash
# Install dependencies and build the app
npm install
npm run build
```

## Run (Agent Path)

This skill uses google-chrome to drive the app. The following heredoc contains the complete script:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Build the app first
echo "Building app..."
npm run build

# Start a simple static server to serve the dist directory
npx serve dist -l 5000 &
APP_PID=$!

# Wait for the app to be ready
echo "Waiting for app to start..."
for i in {1..30}; do
  if curl -s http://localhost:5000 > /dev/null; then
    echo "App is ready!"
    break
  fi
  sleep 1
done

if ! curl -s http://localhost:5000 > /dev/null; then
  echo "Failed to start app"
  kill $APP_PID 2>/dev/null || true
  exit 1
fi

# Take a screenshot of the initial state
google-chrome --headless --disable-gpu --screenshot=/tmp/gravity-simulation-initial.png --window-size=1280,720 http://localhost:5000

# Interact with the app - wait a bit and take another screenshot to show it's running
sleep 3
google-chrome --headless --disable-gpu --screenshot=/tmp/gravity-simulation-running.png --window-size=1280,720 http://localhost:5000

# Clean up
kill $APP_PID 2>/dev/null || true

echo "Screenshots saved to:"
echo "  /tmp/gravity-simulation-initial.png"
echo "  /tmp/gravity-simulation-running.png"
```

Make the script executable and run it:
```bash
chmod +x /tmp/run-gravity-simulation.sh
/tmp/run-gravity-simulation.sh
```

## Run (Human Path)

For manual testing:
```bash
npm run dev
```
Then visit http://localhost:5173 in your browser.

## Gotchas

- The vite preview command has issues with the void plugin's wrangler config, so we build and serve with a static server instead
- The app uses port 5000 when served with the static server (not the default Vite ports)
- Chrome/Chromium requires specific dependencies for headless operation on Linux
- The initial build takes time due to TypeScript compilation and asset bundling
- Rapier physics engine (WebAssembly) may require additional permissions in some environments
- The favicon.svg returns 404 (expected, as it's not configured in this project)

## Troubleshooting

- "App is not ready" timeout: Increase the loop count in the script or check if the build succeeded
- Google-chrome not found: Install with `apt-get install -y google-chrome-stable` or use chromium instead
- Port already in use: Kill existing processes on port 5000 with `lsof -ti:5000 | xargs kill -9`
- If serve is not found, it will be automatically installed via npx