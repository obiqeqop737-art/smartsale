#!/bin/bash
set -e

echo "Running database migrations..."
cd /vercel/share/v0-project

# Run the drizzle-kit push command to create/update tables
npm run db:push

echo "Database migrations completed successfully!"
