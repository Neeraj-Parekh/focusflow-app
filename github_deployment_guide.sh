#!/bin/bash
# A simple guide for deploying FocusFlow PWA to GitHub Pages

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "════════════════════════════════════════════"
echo "   FocusFlow PWA GitHub Pages Deployment    "
echo "════════════════════════════════════════════"
echo -e "${NC}"

echo -e "${YELLOW}This guide will help you deploy the FocusFlow PWA to GitHub Pages.${NC}"
echo "Please follow these steps carefully:"
echo ""

echo -e "1. ${GREEN}Add your new or modified files${NC}"
echo "   Run: git add ."
echo ""

echo -e "2. ${GREEN}Commit your changes${NC}"
echo "   Run: git commit -m \"Update FocusFlow PWA with latest changes\""
echo ""

echo -e "3. ${GREEN}Pull latest changes from GitHub${NC}"
echo "   Run: git pull origin main"
echo ""

echo -e "4. ${GREEN}Push your changes to GitHub${NC}"
echo "   Run: git push origin main"
echo ""

echo -e "5. ${GREEN}Check GitHub Pages deployment${NC}"
echo "   Visit: https://github.com/Neeraj-Parekh/focusflow-app/settings/pages"
echo "   Make sure the source is set to 'Deploy from a branch' and the branch is 'main'"
echo ""

echo -e "6. ${GREEN}Access your PWA${NC}"
echo "   After a few minutes, your app will be available at:"
echo "   https://Neeraj-Parekh.github.io/focusflow-app/"
echo ""

echo -e "${YELLOW}Note:${NC} If you're having trouble with authentication, consider:"
echo "  - Using a Personal Access Token instead of a password"
echo "  - Setting up SSH keys for GitHub"
echo ""

echo -e "${BLUE}Need to create a Personal Access Token?${NC}"
echo "  1. Go to https://github.com/settings/tokens"
echo "  2. Click 'Generate new token'"
echo "  3. Give it a name like 'FocusFlow Deployment'"
echo "  4. Select the 'repo' scope"
echo "  5. Click 'Generate token'"
echo "  6. Copy the token and use it as your password when pushing"
echo ""

echo -e "${GREEN}Happy deploying!${NC}"
