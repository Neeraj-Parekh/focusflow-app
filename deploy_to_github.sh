#!/bin/bash
# Script to initialize and push to GitHub

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is required but not installed.${NC}"
    echo "Please install it with: sudo apt install git"
    exit 1
fi

# Print banner
echo -e "${BLUE}"
echo "════════════════════════════════════════════"
echo "    FocusFlow Web App GitHub Deployment     "
echo "════════════════════════════════════════════"
echo -e "${NC}"

# Confirm GitHub username
read -p "Enter your GitHub username: " github_username
if [ -z "$github_username" ]; then
    echo -e "${RED}Error: GitHub username cannot be empty.${NC}"
    exit 1
fi

# Create a new repository name
repo_name="focusflow-app"

echo -e "${YELLOW}This script will:"
echo -e "1. Initialize a Git repository in the WebApp directory"
echo -e "2. Create a GitHub repository called '$repo_name'"
echo -e "3. Push your web app to GitHub"
echo -e "4. Enable GitHub Pages${NC}"
echo ""

read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

# Navigate to WebApp directory
cd "/media/neeraj/20265E15265DEC72/study/CODE/projects/linux projects/pomodoro/WebApp" || {
    echo -e "${RED}Error: Could not find WebApp directory.${NC}"
    exit 1
}

# Initialize git repository
echo -e "${YELLOW}Initializing Git repository...${NC}"
git init

# Create .gitignore
echo -e "${YELLOW}Creating .gitignore...${NC}"
cat > .gitignore << EOF
# System files
.DS_Store
Thumbs.db

# IDE files
.idea/
.vscode/
*.sublime-*

# Temporary files
*.log
*.tmp
EOF

# Add all files
echo -e "${YELLOW}Adding files to Git...${NC}"
git add .

# Commit changes
echo -e "${YELLOW}Committing files...${NC}"
git commit -m "Initial commit of FocusFlow Pomodoro Timer web app"

# Create GitHub repository using GitHub CLI if available
if command -v gh &> /dev/null; then
    echo -e "${YELLOW}Creating GitHub repository using GitHub CLI...${NC}"
    gh repo create "$repo_name" --public --source=. --remote=origin
else
    # Otherwise guide the user to create it manually
    echo -e "${YELLOW}Please create a new public repository on GitHub named '$repo_name'"
    echo -e "Then run the following commands:${NC}"
    echo ""
    echo "git remote add origin https://github.com/$github_username/$repo_name.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
    read -p "Have you created the repository and want to continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
    
    # Add the remote
    git remote add origin "https://github.com/$github_username/$repo_name.git"
fi

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git branch -M main
git push -u origin main

echo -e "${GREEN}Repository has been pushed to GitHub!${NC}"
echo ""
echo -e "${YELLOW}Next steps to enable GitHub Pages:${NC}"
echo "1. Go to https://github.com/$github_username/$repo_name/settings/pages"
echo "2. Under 'Source', select 'main' branch"
echo "3. Click Save"
echo "4. Wait a few minutes for your site to deploy"
echo "5. Your web app will be available at: https://$github_username.github.io/$repo_name/"
echo ""
echo -e "${YELLOW}To share with Android users:${NC}"
echo "1. Send them the URL: https://$github_username.github.io/$repo_name/"
echo "2. Tell them to open it in Chrome on their Android device"
echo "3. Tap the menu (3 dots) and select 'Install app' or 'Add to home screen'"
echo ""
echo -e "${GREEN}Your FocusFlow app will be installed on their Android device!${NC}"
