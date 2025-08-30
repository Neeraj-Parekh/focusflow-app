# FocusFlow Desktop - Python Qt Companion App

A powerful desktop companion for the FocusFlow PWA with enhanced native features and deep system integration.

## Features

### Core Timer Functionality
- **Pomodoro Timer**: Customizable work sessions (default 25 minutes)
- **Break Timers**: Short breaks (5 minutes) and long breaks (15 minutes)
- **Custom Timers**: Flexible timing for any type of work
- **Auto-start Options**: Automatically start breaks or next pomodoros

### Advanced Task Management
- **Task Creation**: Add tasks with titles, descriptions, projects, and priorities
- **Project Organization**: Group tasks by projects (Work, Personal, Study, etc.)
- **Priority Levels**: Low, Medium, High, Critical priority settings
- **Due Dates**: Set deadlines and track upcoming tasks
- **Tags System**: Organize tasks with custom tags
- **Estimation**: Set estimated pomodoros needed for each task
- **Progress Tracking**: Monitor pomodoros completed per task

### Comprehensive Time Tracking
- **Automatic Tracking**: Tracks time during pomodoro sessions
- **Manual Time Entry**: Start/stop timer for any task
- **Project-based Tracking**: Organize time entries by projects
- **Detailed History**: View all time entries with descriptions and duration
- **Multiple Timer Types**: Distinguish between pomodoro and manual tracking

### Analytics & Reporting
- **Date Range Analysis**: Filter data by custom date ranges
- **Focus Time Statistics**: Total time spent in focus sessions
- **Productivity Metrics**: Cycles completed, tasks finished, average session length
- **Progress Visualization**: Track productivity trends over time

### Native Desktop Features
- **System Tray Integration**: Minimize to system tray
- **Desktop Notifications**: Native notifications for timer completion
- **Keyboard Shortcuts**: Quick access with hotkeys
- **Auto-save**: Automatic data persistence every 30 seconds
- **Offline Operation**: Works completely offline with local data storage

### Data Management
- **Local Storage**: Data stored in JSON format in user home directory
- **Export/Import**: Backup and restore data (planned feature)
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites
- Python 3.7 or higher
- pip package manager

### Install Dependencies
```bash
cd desktop-app
pip install -r requirements.txt
```

### Run the Application
```bash
python focusflow_desktop.py
```

### Creating an Executable (Optional)
To create a standalone executable:

```bash
pip install pyinstaller
pyinstaller --onefile --windowed focusflow_desktop.py
```

## Usage

### Getting Started
1. Launch the application
2. The timer tab opens by default with a 25-minute pomodoro timer
3. Enter what you're working on in the "Current Task" field
4. Select a project if desired
5. Click "Start" to begin your focus session

### Managing Tasks
1. Switch to the "Tasks" tab
2. Click "Add Task" to create new tasks
3. Fill in task details including title, description, project, priority, and due date
4. Use filters to view tasks by project or completion status
5. Double-click tasks to edit them

### Time Tracking
1. Use the "Timer" tab for pomodoro-based tracking
2. Switch to "Tracking" tab for manual time tracking
3. Enter a task description and click "Start Timer"
4. View time entries in the table below

### Analytics
1. Go to the "Analytics" tab
2. Set your desired date range
3. Click "Update" to see productivity statistics
4. View total focus time, cycles completed, and tasks finished

### Settings
- Access settings via File > Settings or Ctrl+,
- Customize timer durations
- Configure notifications and auto-start options
- Set application preferences

## Keyboard Shortcuts

- **Ctrl+Space**: Start/Pause timer
- **Ctrl+R**: Reset timer
- **Ctrl+N**: Add new task
- **Ctrl+1-4**: Switch between tabs
- **Ctrl+,**: Open settings
- **Ctrl+Q**: Quit application

## Data Storage

The application stores data locally in your home directory:
- **File**: `~/.focusflow_desktop.json`
- **Format**: JSON with tasks, time entries, and settings
- **Auto-save**: Every 30 seconds while running

## Integration with PWA

This desktop app is designed to complement the FocusFlow PWA:
- Similar data structures for easy sync (future feature)
- Consistent UI/UX design principles
- Enhanced features that leverage native desktop capabilities

## Competing with TickTick and Toggl Track

### TickTick-inspired Features
- ✅ Comprehensive task management
- ✅ Project organization
- ✅ Priority levels and due dates
- ✅ Tags and categories
- ✅ Progress tracking

### Toggl Track-inspired Features
- ✅ Flexible time tracking
- ✅ Manual time entries
- ✅ Project-based time organization
- ✅ Detailed time reports
- ✅ Multiple timer types

### Unique FocusFlow Advantages
- 🎯 **Pomodoro-First Design**: Built around the proven Pomodoro Technique
- 🔄 **Integrated Approach**: Seamlessly combines task management with time tracking
- 💻 **Cross-Platform**: Works on web (PWA) and desktop (Qt)
- 🏠 **Privacy-Focused**: All data stored locally, no cloud dependencies
- 🚀 **Lightweight**: Fast startup and minimal resource usage
- 🎨 **Modern UI**: Clean, intuitive interface with dark/light themes

## Future Enhancements

### Planned Features
- [ ] Cloud sync between PWA and desktop app
- [ ] Data export to CSV/JSON
- [ ] Import from other productivity apps
- [ ] Advanced reporting with charts
- [ ] Team collaboration features
- [ ] Calendar integration
- [ ] Mobile companion app
- [ ] AI-powered productivity insights

### Performance Improvements
- [ ] Database backend for large datasets
- [ ] Optimized rendering for thousands of tasks
- [ ] Background sync capabilities
- [ ] Plugin system for extensions

## Development

### Architecture
- **GUI Framework**: PyQt5 for native desktop experience
- **Threading**: Background timer thread for responsive UI
- **Data Persistence**: JSON file storage with auto-save
- **Settings**: Qt Settings API for user preferences

### Code Organization
- `FocusFlowDesktop`: Main application window class
- `TimerThread`: Background timer implementation
- `TaskDialog`: Task creation/editing interface
- `SettingsDialog`: Application preferences
- Modular design for easy feature additions

## Contributing

This desktop app is part of the larger FocusFlow ecosystem. Contributions are welcome for:
- Bug fixes and performance improvements
- New features that enhance productivity
- UI/UX improvements
- Cross-platform compatibility
- Integration with other productivity tools

## License

Same as the main FocusFlow project - open source and free to use.

## Support

For issues, feature requests, or questions about the desktop app, please create an issue in the main FocusFlow repository.