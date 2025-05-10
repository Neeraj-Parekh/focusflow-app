#!/bin/bash
# Script to check DNS propagation for focusflow-app.io

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "════════════════════════════════════════════"
echo "      FocusFlow DNS Propagation Check       "
echo "════════════════════════════════════════════"
echo -e "${NC}"

# Check if dig command is available
if ! command -v dig &> /dev/null; then
    echo -e "${YELLOW}The 'dig' command is not installed. Installing dnsutils...${NC}"
    sudo apt-get update
    sudo apt-get install -y dnsutils
    echo ""
fi

DOMAIN="focusflow-app.io"
echo -e "Checking DNS propagation for ${GREEN}$DOMAIN${NC}..."
echo ""

# Check A records
echo -e "${YELLOW}Checking A records:${NC}"
dig +short $DOMAIN A
echo ""

# Check CNAME record
echo -e "${YELLOW}Checking CNAME record for www:${NC}"
dig +short www.$DOMAIN CNAME
echo ""

# Check GitHub Pages IP addresses
echo -e "${YELLOW}Expected GitHub Pages IP addresses:${NC}"
echo -e "185.199.108.153"
echo -e "185.199.109.153"
echo -e "185.199.110.153"
echo -e "185.199.111.153"
echo ""

# Check if site is accessible
echo -e "${YELLOW}Checking if site is accessible:${NC}"
if curl -s --head https://$DOMAIN | grep "200 OK" > /dev/null; then
    echo -e "${GREEN}✓ Site is accessible at https://$DOMAIN${NC}"
else
    echo -e "${RED}✗ Site is not yet accessible at https://$DOMAIN${NC}"
    echo -e "${BLUE}This is normal if DNS is still propagating or if the site isn't fully set up yet.${NC}"
fi
echo ""

echo -e "${YELLOW}Checking if HTTPS is properly configured:${NC}"
if curl -s --head https://$DOMAIN | grep -i "Server: GitHub.com" > /dev/null; then
    echo -e "${GREEN}✓ HTTPS is properly configured with GitHub Pages${NC}"
else
    echo -e "${RED}✗ HTTPS configuration not detected${NC}"
    echo -e "${BLUE}This could be because DNS is still propagating or HTTPS isn't enforced yet.${NC}"
fi
echo ""

echo -e "${BLUE}DNS propagation can take 24-48 hours. Run this script periodically to check status.${NC}"
echo -e "${GREEN}Once propagation is complete, make sure to enable 'Enforce HTTPS' in your GitHub repository settings.${NC}"
