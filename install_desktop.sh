#!/bin/bash

# FocusFlow Desktop Installation Script
# This script installs the FocusFlow Desktop application

echo "🚀 FocusFlow Desktop Installation"
echo "=================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.7 or higher and try again."
    exit 1
fi

echo "✅ Python 3 found"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    echo "Please install pip3 and try again."
    exit 1
fi

echo "✅ pip3 found"

# Create virtual environment (optional but recommended)
read -p "🤔 Create a virtual environment? (recommended) [y/N]: " create_venv
if [[ $create_venv == "y" || $create_venv == "Y" ]]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv focusflow_env
    source focusflow_env/bin/activate
    echo "✅ Virtual environment created and activated"
fi

# Navigate to desktop app directory
cd desktop-app

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create desktop shortcut (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🖥️ Creating desktop shortcut..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    DESKTOP_FILE="$HOME/Desktop/FocusFlow.desktop"
    
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=FocusFlow Desktop
Comment=Advanced Productivity Timer with Task Management
Exec=python3 "$SCRIPT_DIR/desktop-app/focusflow_desktop.py"
Icon=$SCRIPT_DIR/images/icon-512x512.png
Terminal=false
Categories=Office;Productivity;
StartupNotify=true
EOF
    
    chmod +x "$DESKTOP_FILE"
    echo "✅ Desktop shortcut created"
fi

# Create run script
echo "📝 Creating run script..."
cat > run_focusflow.sh << 'EOF'
#!/bin/bash
# FocusFlow Desktop Runner

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Activate virtual environment if it exists
if [ -d "$SCRIPT_DIR/focusflow_env" ]; then
    source "$SCRIPT_DIR/focusflow_env/bin/activate"
fi

# Run the application
python3 "$SCRIPT_DIR/desktop-app/focusflow_desktop.py"
EOF

chmod +x run_focusflow.sh
echo "✅ Run script created"

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "To run FocusFlow Desktop:"
echo "  ./run_focusflow.sh"
echo ""
echo "Or directly:"
echo "  cd desktop-app && python3 focusflow_desktop.py"
echo ""
echo "📖 For more information, see desktop-app/README.md"