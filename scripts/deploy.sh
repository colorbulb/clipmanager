#!/bin/bash

# Generate commit message with timestamp and date
DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H:%M:%S")
COMMIT_MSG="Deploy: $DATE at $TIME"

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed! Aborting deployment."
  exit 1
fi

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
  echo "❌ Firebase deployment failed! Aborting git operations."
  exit 1
fi

# Git operations
echo "📝 Staging changes..."
git add .

echo "💾 Committing changes with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
  echo "⚠️  Commit failed (maybe no changes to commit). Continuing..."
fi

echo "📤 Pushing to repository..."
git push

if [ $? -ne 0 ]; then
  echo "❌ Git push failed!"
  exit 1
fi

echo "✅ Deployment complete!"

