#!/bin/bash
# Script to update existing GitHub Pages deployment

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "════════════════════════════════════════════"
echo "    FocusFlow Web App Update Deployment     "
echo "════════════════════════════════════════════"
echo -e "${NC}"

# Navigate to WebApp directory
cd "/media/neeraj/20265E15265DEC72/study/CODE/projects/linux projects/pomodoro/WebApp" || {
    echo -e "${RED}Error: Cannot access WebApp directory.${NC}"
    exit 1
}

# Check if git repository exists
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: This directory is not a git repository.${NC}"
    echo -e "Please run ./deploy_to_github.sh first if you haven't deployed yet."
    exit 1
fi

# Update version number in service-worker.js
current_date=$(date +"%Y%m%d%H%M")
sed -i "s/focusflow-static-v[0-9]*/focusflow-static-v$current_date/" service-worker.js
sed -i "s/focusflow-dynamic-v[0-9]*/focusflow-dynamic-v$current_date/" service-worker.js

echo -e "${YELLOW}Updated cache version in service-worker.js${NC}"

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Update app with enhancements for Android - $(date)"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push

# Success message
echo -e "${GREEN}✓ Successfully updated FocusFlow WebApp!${NC}"
echo -e "${BLUE}The updates should be live on GitHub Pages within a few minutes.${NC}"
echo -e "${YELLOW}Visit: https://$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | sed 's/\/.*//'|tr '[:upper:]' '[:lower:]').github.io/focusflow-app/${NC}"
