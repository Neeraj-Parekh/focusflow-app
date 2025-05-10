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

# Check for any updates to the app
echo -e "${YELLOW}Checking for pending changes...${NC}"
if [[ -z $(git status -s) ]]; then
    echo -e "${BLUE}No changes detected. Do you still want to update GitHub Pages? (y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi
fi

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Update FocusFlow PWA for GitHub Pages - $(date)"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push

# Success message
echo -e "${GREEN}✓ Successfully updated FocusFlow WebApp!${NC}"
echo -e "${BLUE}The updates should be live on GitHub Pages within a few minutes.${NC}"
echo -e "${YELLOW}Visit: https://Neeraj-Parekh.github.io/focusflow-app/${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}      GITHUB PAGES DEPLOYMENT SUCCESS       ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "Your FocusFlow PWA is now deployed to GitHub Pages!"
echo -e "Users can install it on their Android devices by:"
echo ""
echo -e "1. Visiting ${BLUE}https://Neeraj-Parekh.github.io/focusflow-app/${NC}"
echo -e "2. Tapping the menu button (three dots)"
echo -e "3. Selecting 'Add to Home Screen' or 'Install app'"
echo ""
echo -e "${YELLOW}Remember:${NC} GitHub Pages is free and you don't need a custom domain!"
echo -e "The PWA will work offline and function just like a native app once installed."
