#!/bin/bash

cd "$(dirname "$0")"

# Kill any existing Next.js process on port 3005
lsof -ti :3005 2>/dev/null | xargs kill -9 2>/dev/null
rm -f .next/dev/lock

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installation des dependances..."
  npm install
fi

echo "Demarrage de Lean Planning..."
npx next dev -p 3005
