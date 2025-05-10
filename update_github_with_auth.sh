#!/bin/bash
# Script to update GitHub Pages deployment with credential handling

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "════════════════════════════════════════════"
echo "  FocusFlow PWA - GitHub Pages Deployment   "
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
    echo -e "Please run git init and set up the repository first."
    exit 1
fi

# Update version number in service-worker.js for cache busting
current_date=$(date +"%Y%m%d%H%M")
sed -i "s/focusflow-static-v[0-9]*/focusflow-static-v$current_date/" service-worker.js
sed -i "s/focusflow-dynamic-v[0-9]*/focusflow-dynamic-v$current_date/" service-worker.js
echo -e "${GREEN}✓ Updated cache version in service-worker.js${NC}"

# Check for GitHub credentials
echo -e "${YELLOW}To push to GitHub, you'll need to provide your credentials:${NC}"
read -p "GitHub Username: " github_username
read -sp "GitHub Password/Token (input will be hidden): " github_token
echo ""

# Set the GitHub repository URL with credentials
repo_url="https://$github_username:$github_token@github.com/$github_username/focusflow-app.git"

# Add all files
echo -e "${YELLOW}Adding files to Git...${NC}"
git add .

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Update FocusFlow PWA for GitHub Pages - $(date)"

# Pull latest changes first to avoid conflicts
echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull --rebase origin main || {
    echo -e "${RED}Failed to pull latest changes. Trying without rebase...${NC}"
    git pull origin main || {
        echo -e "${RED}Failed to pull latest changes. Continuing with push...${NC}"
    }
}

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push $repo_url main || {
    echo -e "${RED}Push failed. Trying alternative approach...${NC}"
    git push -f $repo_url main || {
        echo -e "${RED}Failed to push changes to GitHub.${NC}"
        exit 1
    }
}

# Success message
echo -e "${GREEN}✓ Successfully updated FocusFlow WebApp!${NC}"
echo -e "${BLUE}The updates should be live on GitHub Pages within a few minutes.${NC}"
echo -e "${YELLOW}Visit: https://$github_username.github.io/focusflow-app/${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}      GITHUB PAGES DEPLOYMENT SUCCESS       ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "Your FocusFlow PWA is now deployed to GitHub Pages!"
echo -e "Users can install it on their Android devices by:"
echo ""
echo -e "1. Visiting ${BLUE}https://$github_username.github.io/focusflow-app/${NC}"
echo -e "2. Tapping the menu button (three dots)"
echo -e "3. Selecting 'Add to Home Screen' or 'Install app'"
echo ""
echo -e "${YELLOW}Remember:${NC} GitHub Pages is free and you don't need a custom domain!"
echo -e "The PWA will work offline and function just like a native app once installed."
