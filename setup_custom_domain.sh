#!/bin/bash
# Script to deploy FocusFlow PWA with custom domain

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "════════════════════════════════════════════"
echo "  FocusFlow Custom Domain Deployment Tool   "
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

# Check for CNAME file
if [ ! -f "CNAME" ]; then
    echo -e "${RED}Error: CNAME file not found.${NC}"
    echo -e "Creating CNAME file with domain 'focusflow-app.io'..."
    echo "focusflow-app.io" > CNAME
    echo -e "${GREEN}CNAME file created.${NC}"
fi

# Update version number in service-worker.js
current_date=$(date +"%Y%m%d%H%M")
sed -i "s/focusflow-static-v[0-9]*/focusflow-static-v$current_date/" service-worker.js
sed -i "s/focusflow-dynamic-v[0-9]*/focusflow-dynamic-v$current_date/" service-worker.js

echo -e "${YELLOW}Updated cache version in service-worker.js${NC}"

# Commit changes
echo -e "${YELLOW}Committing changes for custom domain setup...${NC}"
git add .
git commit -m "Setup custom domain focusflow-app.io and update cache - $(date)"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push

# DNS configuration instructions
echo -e "${GREEN}✓ Successfully updated GitHub repository with custom domain settings!${NC}"
echo -e "${YELLOW}"
echo "════════════════════════════════════════════"
echo "       IMPORTANT NEXT STEPS                 "
echo "════════════════════════════════════════════"
echo -e "${NC}"
echo -e "1. ${BLUE}Purchase the domain 'focusflow-app.io' if you haven't already${NC}"
echo -e "2. ${BLUE}Configure DNS at your domain registrar with these records:${NC}"
echo ""
echo -e "   ${YELLOW}A Records:${NC} (point @ to these GitHub Pages IP addresses)"
echo -e "   - 185.199.108.153"
echo -e "   - 185.199.109.153"
echo -e "   - 185.199.110.153"
echo -e "   - 185.199.111.153"
echo ""
echo -e "   ${YELLOW}CNAME Record:${NC}"
echo -e "   - Name: www"
echo -e "   - Value: Neeraj-Parekh.github.io."
echo ""
echo -e "3. ${BLUE}In your GitHub repository settings:${NC}"
echo -e "   - Go to Settings > Pages"
echo -e "   - Under 'Custom Domain', enter focusflow-app.io"
echo -e "   - Check 'Enforce HTTPS' once certificate is provisioned"
echo ""
echo -e "   URL: https://github.com/Neeraj-Parekh/focusflow-app/settings/pages"
echo ""
echo -e "${YELLOW}DNS changes may take up to 24-48 hours to propagate fully.${NC}"
echo -e "${GREEN}Once propagation is complete, your app will be available at https://focusflow-app.io${NC}"
