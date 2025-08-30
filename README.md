# FocusFlow - Advanced Productivity Suite

A comprehensive productivity application that combines the proven Pomodoro Technique with powerful task management and time tracking capabilities. Designed to compete with industry leaders like TickTick and Toggl Track.

![FocusFlow Timer Interface](https://github.com/user-attachments/assets/180c6f0a-05bb-4bfb-882f-06e7fef9f242)

## 🌟 Major Features

### 🎯 **Pomodoro Timer Plus**
- **Smart Timer System**: Customizable Pomodoro (25min), Short Break (5min), Long Break (15min), and Custom timers
- **Auto-flow Options**: Automatically start breaks or next pomodoros for seamless productivity
- **Ambient Focus Sounds**: Rain, cafe, forest, fire, and white noise to enhance concentration
- **Visual & Audio Alerts**: Native notifications and customizable sound alerts

### 📋 **Advanced Task Management** 
![Task Management Modal](https://github.com/user-attachments/assets/061a3e99-7176-494e-bf85-d88ab55652f5)
- **Comprehensive Task Creation**: Title, description, project assignment, priority levels, due dates
- **Project Organization**: Group tasks by Work, Personal, Study, or custom projects  
- **Priority System**: Low, Medium, High, Critical priority levels with visual indicators
- **Pomodoro Estimation**: Set estimated pomodoros needed and track completion
- **Smart Filtering**: Filter by project, completion status, priority, and due dates

### ⏱️ **Flexible Time Tracking**
- **Automatic Tracking**: Seamlessly tracks time during Pomodoro sessions
- **Manual Time Entry**: Start/stop timer for any task with custom descriptions
- **Project-based Organization**: Organize all time entries by projects
- **Detailed History**: Comprehensive log of all time entries with duration and context
- **Multiple Timer Types**: Distinguish between Pomodoro sessions and manual tracking

### 📊 **Analytics & Insights**
![Analytics Dashboard](https://github.com/user-attachments/assets/387dc3a6-4fbe-4a58-a326-c1ddc6a8ab5c)
- **Custom Date Ranges**: Analyze productivity over any time period
- **Focus Metrics**: Total focus time, completed cycles, finished tasks
- **Performance Trends**: Average session length and productivity patterns
- **Today's Progress**: Real-time dashboard of daily achievements

### 💻 **Cross-Platform Availability**

#### **Progressive Web App (PWA)**
- **📱 Mobile-First Design**: Responsive interface optimized for all devices
- **🚀 Offline Capability**: Works completely offline with service worker caching
- **📲 App-like Experience**: Install directly from browser on any device
- **🔄 Instant Updates**: Always get the latest features automatically

#### **Desktop Application (Python Qt)**
- **🖥️ Native Desktop Experience**: Full-featured Qt desktop application
- **🔔 System Integration**: Native notifications and system tray support
- **⌨️ Keyboard Shortcuts**: Hotkeys for all major functions
- **💾 Local Data Storage**: Secure local storage with auto-save functionality
- **🎨 Modern UI**: Beautiful, responsive interface matching PWA design

## 🚀 Quick Start

### Web App (PWA)
1. **Visit**: [https://Neeraj-Parekh.github.io/focusflow-app/](https://Neeraj-Parekh.github.io/focusflow-app/)
2. **Install**: Tap "Add to Home Screen" on mobile or "Install" in browser
3. **Start Focusing**: Enter your task and hit start!

### Desktop App
```bash
cd desktop-app
pip install -r requirements.txt
python focusflow_desktop.py
```

## 🏆 Competitive Advantages

### **vs TickTick**
- ✅ **Pomodoro-First Design**: Built around the proven Pomodoro Technique
- ✅ **Integrated Time Tracking**: Seamless task + time management
- ✅ **Zero Dependencies**: No account required, works offline
- ✅ **Cross-Platform**: Web + Desktop with data sync capabilities
- ✅ **Open Source**: Completely free and customizable

### **vs Toggl Track**  
- ✅ **Smart Task Integration**: Tasks and time tracking unified
- ✅ **Focus-Oriented**: Designed for deep work sessions
- ✅ **Built-in Productivity Method**: Pomodoro Technique integration
- ✅ **Comprehensive Analytics**: Beyond just time tracking
- ✅ **No Subscription**: Completely free with premium features

### **Unique FocusFlow Benefits**
- 🎯 **Psychology-Backed**: Based on proven Pomodoro Technique
- 🔄 **Holistic Approach**: Timer + Tasks + Tracking + Analytics in one
- 🏠 **Privacy-First**: All data stored locally, no cloud dependencies
- ⚡ **Lightning Fast**: Minimal resource usage, instant startup
- 🎨 **Modern Design**: Clean, intuitive interface with dark/light themes
- 📱 **True PWA**: Works offline, installs like native app

## 📱 Installation

### Mobile (Android/iOS)
1. Open [FocusFlow App](https://Neeraj-Parekh.github.io/focusflow-app/) in Chrome/Safari
2. Tap "Add to Home Screen" when prompted
3. Find FocusFlow on your home screen
4. Enjoy the native app experience!

### Desktop (Windows/Mac/Linux)
1. Download or clone this repository
2. Install Python Qt desktop app:
   ```bash
   cd desktop-app
   pip install -r requirements.txt
   python focusflow_desktop.py
   ```

## 🛠️ Technology Stack

### **PWA (Web Application)**
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **PWA Features**: Service Worker, Web App Manifest, Offline Support
- **Storage**: localStorage for data persistence
- **UI/UX**: Custom CSS with modern design system

### **Desktop Application**
- **Framework**: PyQt5 for native desktop experience
- **Language**: Python 3.7+
- **Features**: Threading, system tray, native notifications
- **Storage**: JSON file storage with auto-save

### **Architecture**
- **Modular Design**: Separate components for easy maintenance
- **Event-Driven**: Reactive UI updates and state management
- **Data Sync Ready**: Compatible data structures for future cloud sync

## ⚙️ Advanced Features

### **Keyboard Shortcuts** (Desktop)
- `Ctrl+Space`: Start/Pause timer
- `Ctrl+R`: Reset timer  
- `Ctrl+N`: Add new task
- `Ctrl+1-4`: Switch between tabs
- `Ctrl+,`: Open settings

### **Smart Automation**
- Auto-start breaks after Pomodoro completion
- Auto-start next Pomodoro after break
- Automatic time entry creation
- Smart task completion tracking

### **Data Management**
- Automatic data persistence
- Export capabilities (planned)
- Cross-platform data compatibility
- Backup and restore functionality

## 🎯 Use Cases

### **For Students**
- Track study sessions with Pomodoro technique
- Organize assignments by subject/project
- Monitor daily study time and progress
- Break down large projects into manageable tasks

### **For Professionals** 
- Manage work tasks with priority levels
- Track billable hours automatically
- Analyze productivity patterns
- Balance focused work with regular breaks

### **For Freelancers**
- Track time per client/project
- Manage multiple deadlines
- Generate productivity reports
- Maintain work-life balance

### **For Teams**
- Individual productivity tracking
- Project time allocation
- Team productivity insights
- Standardized work methodology

## 🔮 Roadmap

### **Phase 1: Core Enhancement** ✅
- [x] Advanced task management
- [x] Flexible time tracking  
- [x] Analytics dashboard
- [x] Desktop application
- [x] Modern UI/UX

### **Phase 2: Cloud Integration** 🚧
- [ ] Cloud data synchronization
- [ ] Multi-device data sync
- [ ] Backup and restore
- [ ] Account management

### **Phase 3: Collaboration** 📋
- [ ] Team workspaces
- [ ] Shared projects
- [ ] Time tracking for teams
- [ ] Collaboration features

### **Phase 4: AI & Insights** 🤖
- [ ] AI-powered productivity insights
- [ ] Smart task suggestions
- [ ] Automated time categorization
- [ ] Predictive analytics

## 🤝 Contributing

We welcome contributions! This project aims to create the best productivity app by combining the best features from TickTick, Toggl Track, and other productivity tools.

### **How to Contribute**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### **Areas for Contribution**
- UI/UX improvements
- New productivity features
- Performance optimizations
- Mobile app development
- Cloud sync implementation

## 📄 License

Open source and free to use. See LICENSE file for details.

## 🆘 Support

- 📧 **Issues**: Report bugs or request features via GitHub Issues
- 💬 **Discussions**: Join community discussions
- 📖 **Documentation**: Check the wiki for detailed guides
- 🔧 **Development**: See contributing guidelines

## 🏅 Credits

Built with inspiration from the best productivity tools:
- **Pomodoro Technique**: Francesco Cirillo
- **TickTick**: Task management inspiration
- **Toggl Track**: Time tracking methodology
- **ActivityWatch**: Open source time tracking concepts

---

**FocusFlow** - Where productivity meets simplicity. Start your focused work sessions today! 🚀
