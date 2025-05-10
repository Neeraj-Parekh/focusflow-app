#!/bin/bash
# Script to generate QR code for Android installation

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "════════════════════════════════════════════"
echo "   FocusFlow PWA QR Code Generator   "
echo "════════════════════════════════════════════"
echo -e "${NC}"

# Check if qrencode is installed
if ! command -v qrencode &> /dev/null; then
    echo -e "${YELLOW}The 'qrencode' utility is not installed. Installing it now...${NC}"
    sudo apt-get update
    sudo apt-get install -y qrencode
    echo -e "${GREEN}✓ qrencode installed successfully${NC}"
fi

# URL of the GitHub Pages site
URL="https://Neeraj-Parekh.github.io/focusflow-app/"

# Directory for QR code file
output_dir="/media/neeraj/20265E15265DEC72/study/CODE/projects/linux projects/pomodoro/WebApp/images"
output_file="$output_dir/focusflow_android_qr.png"

# Generate QR code
echo -e "${YELLOW}Generating QR code for Android installation...${NC}"
qrencode -o "$output_file" "$URL"

# Check if QR code was generated successfully
if [ -f "$output_file" ]; then
    echo -e "${GREEN}✓ QR code generated successfully!${NC}"
    echo -e "QR code saved to: ${BLUE}$output_file${NC}"
    echo ""
    echo -e "${YELLOW}How to use this QR code:${NC}"
    echo "1. Print this QR code or display it on another device"
    echo "2. Have Android users scan it with their phone camera"
    echo "3. Users will be directed to the FocusFlow PWA page"
    echo "4. They can then install it from the browser"
    echo ""
    echo -e "${BLUE}You can include this QR code in:${NC}"
    echo "- Documentation"
    echo "- Social media posts"
    echo "- Your website"
    echo "- Emails to users"
    
    # Try to display the QR code if possible
    if command -v display &> /dev/null; then
        echo -e "${YELLOW}Displaying the QR code...${NC}"
        display "$output_file" &
    elif command -v xdg-open &> /dev/null; then
        echo -e "${YELLOW}Opening the QR code image...${NC}"
        xdg-open "$output_file" &
    else
        echo -e "${YELLOW}To view the QR code, open:${NC} $output_file"
    fi
else
    echo -e "${RED}Failed to generate QR code.${NC}"
fi

echo ""
echo -e "${YELLOW}To add this QR code to your README, use:${NC}"
echo ""
echo '![Install FocusFlow on Android](images/focusflow_android_qr.png)'
echo "Scan this QR code with your Android device to install FocusFlow Pomodoro Timer"
