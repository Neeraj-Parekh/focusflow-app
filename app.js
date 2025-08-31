// Enhanced FocusFlow App with Task Management and Time Tracking
// Inspired by TickTick and Toggl Track

class FocusFlowApp {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.initializeEventListeners();
        this.loadData();
        this.updateUI();
        this.requestNotificationPermission();
        this.setupMobileAudio();
        this.initializeDateRanges();
        
        // Enhanced features
        this.initializeActivityTracking();
        this.initializePredictiveEngine();
        this.initializeEnvironmentController();
    }

    initializeElements() {
        // Timer elements
        this.timer = document.getElementById('timer');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.pomodoroBtn = document.getElementById('pomodoro');
        this.shortBreakBtn = document.getElementById('short-break');
        this.longBreakBtn = document.getElementById('long-break');
        this.customTimerBtn = document.getElementById('custom-timer');

        // Current task elements
        this.currentTaskInput = document.getElementById('current-task-input');
        this.currentProject = document.getElementById('current-project');

        // Settings elements
        this.pomodoroTime = document.getElementById('pomodoro-time');
        this.shortBreakTime = document.getElementById('short-break-time');
        this.longBreakTime = document.getElementById('long-break-time');
        this.soundEnabled = document.getElementById('sound-enabled');
        this.ambientSound = document.getElementById('ambient-sound');
        this.autoStartBreaks = document.getElementById('auto-start-breaks');
        this.autoStartPomodoros = document.getElementById('auto-start-pomodoros');

        // Tab navigation
        this.timerTab = document.getElementById('timer-tab');
        this.tasksTab = document.getElementById('tasks-tab');
        this.trackingTab = document.getElementById('tracking-tab');
        this.analyticsTab = document.getElementById('analytics-tab');

        // View panels
        this.timerView = document.getElementById('timer-view');
        this.tasksView = document.getElementById('tasks-view');
        this.trackingView = document.getElementById('tracking-view');
        this.analyticsView = document.getElementById('analytics-view');

        // Tasks elements
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.tasksList = document.getElementById('tasks-list');
        this.projectFilter = document.getElementById('project-filter');
        this.statusFilter = document.getElementById('status-filter');

        // Time tracking elements
        this.manualTaskInput = document.getElementById('manual-task-input');
        this.manualStartBtn = document.getElementById('manual-start-btn');
        this.manualTimerDisplay = document.getElementById('manual-timer-display');
        this.timeEntries = document.getElementById('time-entries');

        // Analytics elements
        this.startDate = document.getElementById('start-date');
        this.endDate = document.getElementById('end-date');
        this.totalFocusTime = document.getElementById('total-focus-time');
        this.totalCycles = document.getElementById('total-cycles');
        this.completedTasks = document.getElementById('completed-tasks');
        this.avgSession = document.getElementById('avg-session');

        // Progress stats
        this.cycleCount = document.getElementById('cycle-count');
        this.focusTime = document.getElementById('focus-time');
        this.tasksCompletedStat = document.getElementById('tasks-completed');

        // Modal elements
        this.taskModal = document.getElementById('task-modal');
        this.taskForm = document.getElementById('task-form');
        this.modalTitle = document.getElementById('modal-title');
        this.taskId = document.getElementById('task-id');
        this.taskTitle = document.getElementById('task-title');
        this.taskDescription = document.getElementById('task-description');
        this.taskProject = document.getElementById('task-project');
        this.taskPriority = document.getElementById('task-priority');
        this.taskDueDate = document.getElementById('task-due-date');
        this.estimatedPomodoros = document.getElementById('estimated-pomodoros');
        this.cancelTask = document.getElementById('cancel-task');

        // Theme toggle
        this.themeToggle = document.getElementById('theme-toggle');
        this.viewToggle = document.getElementById('view-toggle');
    }

    initializeState() {
        // Timer state
        this.timerInterval = null;
        this.timeLeft = null;
        this.isRunning = false;
        this.currentTimerMode = 'pomodoro';
        this.cycles = 0;
        this.ambientAudio = null;
        this.timerEndAudio = null;
        
        // Manual timer state
        this.manualTimerInterval = null;
        this.manualTimeElapsed = 0;
        this.isManualRunning = false;
        this.manualStartTime = null;

        // Data stores
        this.tasks = [];
        this.timeEntries = [];
        this.currentView = 'timer';
        this.isDarkTheme = true;

        // Audio setup
        try {
            this.timerEndAudio = new Audio('sounds/timer-end.mp3');
            this.timerEndAudio.load();
        } catch (e) {
            console.error("Error loading timer end sound:", e);
        }

        this.ambientSounds = {
            'rain': 'sounds/rain.mp3',
            'cafe': 'sounds/cafe.mp3',
            'forest': 'sounds/forest.mp3',
            'fire': 'sounds/fire.mp3',
            'whitenoise': 'sounds/whitenoise.mp3'
        };
    }

    initializeEventListeners() {
        // Timer controls
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        // Timer mode buttons
        this.pomodoroBtn.addEventListener('click', () => this.switchTimerMode('pomodoro'));
        this.shortBreakBtn.addEventListener('click', () => this.switchTimerMode('shortBreak'));
        this.longBreakBtn.addEventListener('click', () => this.switchTimerMode('longBreak'));
        this.customTimerBtn.addEventListener('click', () => this.switchTimerMode('custom'));

        // Tab navigation
        this.timerTab.addEventListener('click', () => this.switchView('timer'));
        this.tasksTab.addEventListener('click', () => this.switchView('tasks'));
        this.trackingTab.addEventListener('click', () => this.switchView('tracking'));
        this.analyticsTab.addEventListener('click', () => this.switchView('analytics'));

        // Settings
        this.pomodoroTime.addEventListener('change', () => this.saveSettings());
        this.shortBreakTime.addEventListener('change', () => this.saveSettings());
        this.longBreakTime.addEventListener('change', () => this.saveSettings());
        this.soundEnabled.addEventListener('change', () => this.saveSettings());
        this.ambientSound.addEventListener('change', () => this.saveSettings());
        this.autoStartBreaks.addEventListener('change', () => this.saveSettings());
        this.autoStartPomodoros.addEventListener('change', () => this.saveSettings());

        // Tasks
        this.addTaskBtn.addEventListener('click', () => this.openTaskModal());
        this.taskForm.addEventListener('submit', (e) => this.saveTask(e));
        this.cancelTask.addEventListener('click', () => this.closeTaskModal());
        this.projectFilter.addEventListener('change', () => this.renderTasks());
        this.statusFilter.addEventListener('change', () => this.renderTasks());

        // Time tracking
        this.manualStartBtn.addEventListener('click', () => this.toggleManualTimer());

        // Analytics date range
        this.startDate.addEventListener('change', () => this.updateAnalytics());
        this.endDate.addEventListener('change', () => this.updateAnalytics());

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Modal close
        document.querySelector('.close').addEventListener('click', () => this.closeTaskModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.taskModal) {
                this.closeTaskModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (this.isRunning) {
                        this.pauseTimer();
                    } else {
                        this.startTimer();
                    }
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetTimer();
                    break;
                case 'n':
                    e.preventDefault();
                    this.openTaskModal();
                    break;
                case '1':
                    e.preventDefault();
                    this.switchView('timer');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchView('tasks');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchView('tracking');
                    break;
                case '4':
                    e.preventDefault();
                    this.switchView('analytics');
                    break;
            }
        }
    }

    // Timer Methods
    startTimer() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;

        if (!this.timeLeft) {
            switch (this.currentTimerMode) {
                case 'pomodoro':
                    this.timeLeft = this.pomodoroTime.value * 60;
                    break;
                case 'shortBreak':
                    this.timeLeft = this.shortBreakTime.value * 60;
                    break;
                case 'longBreak':
                    this.timeLeft = this.longBreakTime.value * 60;
                    break;
                case 'custom':
                    this.timeLeft = 25 * 60; // Default custom time
                    break;
            }
        }

        if (this.soundEnabled.checked && this.ambientSound.value !== 'none') {
            this.playAmbientSound(this.ambientSound.value);
        }

        this.requestWakeLock();

        // Record time entry start if working on a task
        if (this.currentTimerMode === 'pomodoro' && this.currentTaskInput.value) {
            this.startTimeEntry();
        }

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay(this.timeLeft);

            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        if (!this.isRunning) return;

        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;

        if (this.ambientAudio) {
            this.ambientAudio.pause();
        }

        // Pause time entry
        this.pauseTimeEntry();
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        
        switch (this.currentTimerMode) {
            case 'pomodoro':
                this.timeLeft = this.pomodoroTime.value * 60;
                break;
            case 'shortBreak':
                this.timeLeft = this.shortBreakTime.value * 60;
                break;
            case 'longBreak':
                this.timeLeft = this.longBreakTime.value * 60;
                break;
            case 'custom':
                this.timeLeft = 25 * 60;
                break;
        }

        this.updateTimerDisplay(this.timeLeft);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;

        if (this.ambientAudio) {
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
        }

        // Cancel current time entry
        this.cancelTimeEntry();
    }

    timerComplete() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timeLeft = 0;

        if (this.soundEnabled.checked) {
            this.playTimerEndSound();
        }

        // Complete time entry
        this.completeTimeEntry();

        if (this.currentTimerMode === 'pomodoro') {
            this.cycles++;
            this.cycleCount.textContent = this.cycles;
            this.saveData();
            
            // Auto-start break if enabled
            if (this.autoStartBreaks.checked) {
                setTimeout(() => {
                    this.switchTimerMode('shortBreak');
                    this.startTimer();
                }, 2000);
            }
        } else {
            // Auto-start pomodoro if enabled
            if (this.autoStartPomodoros.checked) {
                setTimeout(() => {
                    this.switchTimerMode('pomodoro');
                    this.startTimer();
                }, 2000);
            }
        }

        this.showNotification();
        this.updateStats();
    }

    switchTimerMode(mode) {
        this.currentTimerMode = mode;
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;

        // Update UI
        document.querySelectorAll('.timer-btn').forEach(btn => btn.classList.remove('active'));
        
        switch (mode) {
            case 'pomodoro':
                this.updateTimerDisplay(this.pomodoroTime.value * 60);
                this.pomodoroBtn.classList.add('active');
                break;
            case 'shortBreak':
                this.updateTimerDisplay(this.shortBreakTime.value * 60);
                this.shortBreakBtn.classList.add('active');
                break;
            case 'longBreak':
                this.updateTimerDisplay(this.longBreakTime.value * 60);
                this.longBreakBtn.classList.add('active');
                break;
            case 'custom':
                this.updateTimerDisplay(25 * 60);
                this.customTimerBtn.classList.add('active');
                break;
        }

        this.timeLeft = null;
    }

    // Time Tracking Methods
    toggleManualTimer() {
        if (this.isManualRunning) {
            this.stopManualTimer();
        } else {
            this.startManualTimer();
        }
    }

    startManualTimer() {
        if (!this.manualTaskInput.value.trim()) {
            alert('Please enter a task description');
            return;
        }

        this.isManualRunning = true;
        this.manualStartTime = new Date();
        this.manualTimeElapsed = 0;
        this.manualStartBtn.textContent = 'Stop Timer';
        this.manualStartBtn.classList.add('btn-danger');

        this.manualTimerInterval = setInterval(() => {
            this.manualTimeElapsed++;
            this.updateManualTimerDisplay();
        }, 1000);
    }

    stopManualTimer() {
        if (!this.isManualRunning) return;

        clearInterval(this.manualTimerInterval);
        this.isManualRunning = false;
        this.manualStartBtn.textContent = 'Start Timer';
        this.manualStartBtn.classList.remove('btn-danger');

        // Save time entry
        const entry = {
            id: Date.now(),
            description: this.manualTaskInput.value,
            project: this.currentProject.value,
            startTime: this.manualStartTime,
            endTime: new Date(),
            duration: this.manualTimeElapsed,
            type: 'manual'
        };

        this.timeEntries.push(entry);
        this.manualTaskInput.value = '';
        this.manualTimeElapsed = 0;
        this.updateManualTimerDisplay();
        this.renderTimeEntries();
        this.saveData();
        this.updateStats();
    }

    updateManualTimerDisplay() {
        const hours = Math.floor(this.manualTimeElapsed / 3600);
        const minutes = Math.floor((this.manualTimeElapsed % 3600) / 60);
        const seconds = this.manualTimeElapsed % 60;
        this.manualTimerDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Task Management Methods
    openTaskModal(task = null) {
        if (task) {
            this.modalTitle.textContent = 'Edit Task';
            this.taskId.value = task.id;
            this.taskTitle.value = task.title;
            this.taskDescription.value = task.description || '';
            this.taskProject.value = task.project || '';
            this.taskPriority.value = task.priority;
            this.taskDueDate.value = task.dueDate || '';
            this.estimatedPomodoros.value = task.estimatedPomodoros || 1;
        } else {
            this.modalTitle.textContent = 'Add New Task';
            this.taskForm.reset();
            this.taskId.value = '';
        }
        
        this.taskModal.style.display = 'block';
        this.taskTitle.focus();
    }

    closeTaskModal() {
        this.taskModal.style.display = 'none';
        this.taskForm.reset();
    }

    saveTask(e) {
        e.preventDefault();
        
        const taskData = {
            id: this.taskId.value || Date.now(),
            title: this.taskTitle.value,
            description: this.taskDescription.value,
            project: this.taskProject.value,
            priority: this.taskPriority.value,
            dueDate: this.taskDueDate.value,
            estimatedPomodoros: parseInt(this.estimatedPomodoros.value),
            completed: false,
            createdAt: new Date(),
            completedAt: null,
            pomodorosCompleted: 0
        };

        if (this.taskId.value) {
            // Update existing task
            const index = this.tasks.findIndex(t => t.id == this.taskId.value);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData };
            }
        } else {
            // Add new task
            this.tasks.push(taskData);
        }

        this.saveData();
        this.renderTasks();
        this.closeTaskModal();
        this.updateStats();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.renderTasks();
            this.updateStats();
        }
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date() : null;
            this.saveData();
            this.renderTasks();
            this.updateStats();
        }
    }

    renderTasks() {
        const projectFilter = this.projectFilter.value;
        const statusFilter = this.statusFilter.value;

        let filteredTasks = this.tasks;

        if (projectFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.project === projectFilter);
        }

        if (statusFilter === 'pending') {
            filteredTasks = filteredTasks.filter(t => !t.completed);
        } else if (statusFilter === 'completed') {
            filteredTasks = filteredTasks.filter(t => t.completed);
        }

        this.tasksList.innerHTML = '';

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.tasksList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority`;
        
        div.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${task.title}</div>
                    ${task.project ? `<span class="task-project">${task.project}</span>` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="app.toggleTaskComplete(${task.id})" title="Toggle Complete">
                        ${task.completed ? '✓' : '○'}
                    </button>
                    <button class="task-action-btn" onclick="app.openTaskModal(app.tasks.find(t => t.id === ${task.id}))" title="Edit">✏️</button>
                    <button class="task-action-btn" onclick="app.deleteTask(${task.id})" title="Delete">🗑️</button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                <span>Priority: ${task.priority}</span>
                <span>Pomodoros: ${task.pomodorosCompleted}/${task.estimatedPomodoros}</span>
                ${task.dueDate ? `<span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
            </div>
        `;

        return div;
    }

    // Time Entry Methods
    startTimeEntry() {
        if (this.currentTaskInput.value) {
            this.currentTimeEntry = {
                id: Date.now(),
                description: this.currentTaskInput.value,
                project: this.currentProject.value,
                startTime: new Date(),
                duration: 0,
                type: 'pomodoro'
            };
        }
    }

    pauseTimeEntry() {
        if (this.currentTimeEntry) {
            this.currentTimeEntry.duration += Date.now() - this.currentTimeEntry.startTime.getTime();
        }
    }

    completeTimeEntry() {
        if (this.currentTimeEntry) {
            this.currentTimeEntry.endTime = new Date();
            this.currentTimeEntry.duration = this.pomodoroTime.value * 60;
            this.timeEntries.push(this.currentTimeEntry);
            this.currentTimeEntry = null;
            this.renderTimeEntries();
            this.saveData();
        }
    }

    cancelTimeEntry() {
        this.currentTimeEntry = null;
    }

    renderTimeEntries() {
        this.timeEntries.innerHTML = '';
        
        const sortedEntries = this.timeEntries
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
            .slice(0, 20); // Show last 20 entries

        sortedEntries.forEach(entry => {
            const entryElement = this.createTimeEntryElement(entry);
            this.timeEntries.appendChild(entryElement);
        });
    }

    createTimeEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'time-entry';
        
        const duration = this.formatDuration(entry.duration);
        const date = new Date(entry.startTime).toLocaleDateString();
        
        div.innerHTML = `
            <div class="time-entry-info">
                <h4>${entry.description}</h4>
                <p>${entry.project ? entry.project + ' • ' : ''}${date} • ${entry.type}</p>
            </div>
            <div class="time-entry-duration">${duration}</div>
        `;

        return div;
    }

    // Analytics Methods
    initializeDateRanges() {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        this.startDate.value = weekAgo.toISOString().split('T')[0];
        this.endDate.value = today.toISOString().split('T')[0];
    }

    updateAnalytics() {
        const startDate = new Date(this.startDate.value);
        const endDate = new Date(this.endDate.value);
        endDate.setHours(23, 59, 59, 999);

        const filteredEntries = this.timeEntries.filter(entry => {
            const entryDate = new Date(entry.startTime);
            return entryDate >= startDate && entryDate <= endDate;
        });

        const totalSeconds = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
        const totalCycles = filteredEntries.filter(entry => entry.type === 'pomodoro').length;
        const completedTasks = this.tasks.filter(task => {
            if (!task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return completedDate >= startDate && completedDate <= endDate;
        }).length;

        this.totalFocusTime.textContent = this.formatDuration(totalSeconds);
        this.totalCycles.textContent = totalCycles;
        this.completedTasks.textContent = completedTasks;
        this.avgSession.textContent = totalCycles > 0 ? 
            this.formatDuration(totalSeconds / totalCycles) : '0m';
    }

    // UI Methods
    switchView(view) {
        this.currentView = view;
        
        // Update tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
        
        switch (view) {
            case 'timer':
                this.timerTab.classList.add('active');
                this.timerView.classList.add('active');
                break;
            case 'tasks':
                this.tasksTab.classList.add('active');
                this.tasksView.classList.add('active');
                this.renderTasks();
                break;
            case 'tracking':
                this.trackingTab.classList.add('active');
                this.trackingView.classList.add('active');
                this.renderTimeEntries();
                break;
            case 'analytics':
                this.analyticsTab.classList.add('active');
                this.analyticsView.classList.add('active');
                this.updateAnalytics();
                break;
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
        this.themeToggle.textContent = this.isDarkTheme ? '☀️' : '🌙';
        localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    }

    updateTimerDisplay(seconds) {
        this.timer.textContent = this.formatTime(seconds);
        document.title = `${this.formatTime(seconds)} - FocusFlow`;
    }

    updateStats() {
        const today = new Date().toDateString();
        const todayEntries = this.timeEntries.filter(entry => 
            new Date(entry.startTime).toDateString() === today
        );
        
        const todaySeconds = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
        const todayTasks = this.tasks.filter(task => 
            task.completedAt && new Date(task.completedAt).toDateString() === today
        ).length;

        this.focusTime.textContent = this.formatDuration(todaySeconds);
        this.tasksCompletedStat.textContent = todayTasks;
        this.cycleCount.textContent = this.cycles;
    }

    // Utility Methods
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    // Audio Methods
    playTimerEndSound() {
        if (!this.timerEndAudio) return;
        
        try {
            this.timerEndAudio.currentTime = 0;
            const playPromise = this.timerEndAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.info("Timer sound playback requires user interaction");
                    this.timer.classList.add('timer-ended');
                    setTimeout(() => {
                        this.timer.classList.remove('timer-ended');
                    }, 1000);
                });
            }
        } catch (e) {
            console.error("Error playing timer end sound:", e);
        }
    }

    playAmbientSound(sound) {
        if (this.ambientAudio) {
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
        }
        
        if (sound !== 'none' && this.soundEnabled.checked) {
            try {
                this.ambientAudio = new Audio(this.ambientSounds[sound]);
                this.ambientAudio.loop = true;
                this.ambientAudio.volume = 0.5;
                
                const playPromise = this.ambientAudio.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.info("Audio playback requires user interaction");
                        document.body.classList.add('audio-blocked');
                    });
                }
            } catch (e) {
                console.error("Error playing ambient sound:", e);
            }
        }
    }

    // Notification Methods
    showNotification() {
        if (Notification.permission === 'granted') {
            const message = this.currentTimerMode === 'pomodoro' ? 
                'Pomodoro completed! Take a break!' : 
                'Break time is over! Back to work!';
            
            new Notification('FocusFlow Timer', {
                body: message,
                icon: 'images/icon-192x192.png'
            });
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                await navigator.wakeLock.request('screen');
                console.log('Screen wake lock is active');
            } catch (err) {
                console.log('Wake lock request failed:', err.message);
            }
        }
    }

    setupMobileAudio() {
        const unlockAudio = () => {
            document.body.classList.remove('audio-blocked');
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const emptySource = audioContext.createBufferSource();
            emptySource.start();
            emptySource.stop();
            
            if (this.timerEndAudio) {
                this.timerEndAudio.load();
            }
            
            if (this.isRunning && this.soundEnabled.checked && this.ambientSound.value !== 'none') {
                this.playAmbientSound(this.ambientSound.value);
            }
            
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('click', unlockAudio);
        };
        
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('click', unlockAudio);
    }

    // Data Persistence Methods
    loadData() {
        const savedData = localStorage.getItem('focusflowData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.tasks = data.tasks || [];
            this.timeEntries = data.timeEntries || [];
            this.cycles = data.cycles || 0;
        }

        // Load settings
        this.pomodoroTime.value = localStorage.getItem('pomodoroTime') || 25;
        this.shortBreakTime.value = localStorage.getItem('shortBreakTime') || 5;
        this.longBreakTime.value = localStorage.getItem('longBreakTime') || 15;
        this.soundEnabled.checked = localStorage.getItem('soundEnabled') !== 'false';
        this.ambientSound.value = localStorage.getItem('ambientSound') || 'none';
        this.autoStartBreaks.checked = localStorage.getItem('autoStartBreaks') === 'true';
        this.autoStartPomodoros.checked = localStorage.getItem('autoStartPomodoros') === 'true';

        // Load theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.isDarkTheme = savedTheme === 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        this.themeToggle.textContent = this.isDarkTheme ? '☀️' : '🌙';

        // Set initial timer display
        this.updateTimerDisplay(this.pomodoroTime.value * 60);
    }

    saveData() {
        const data = {
            tasks: this.tasks,
            timeEntries: this.timeEntries,
            cycles: this.cycles
        };
        localStorage.setItem('focusflowData', JSON.stringify(data));
    }

    saveSettings() {
        localStorage.setItem('pomodoroTime', this.pomodoroTime.value);
        localStorage.setItem('shortBreakTime', this.shortBreakTime.value);
        localStorage.setItem('longBreakTime', this.longBreakTime.value);
        localStorage.setItem('soundEnabled', this.soundEnabled.checked);
        localStorage.setItem('ambientSound', this.ambientSound.value);
        localStorage.setItem('autoStartBreaks', this.autoStartBreaks.checked);
        localStorage.setItem('autoStartPomodoros', this.autoStartPomodoros.checked);
        
        // Update timer display if not running and in pomodoro mode
        if (!this.isRunning && this.currentTimerMode === 'pomodoro') {
            this.updateTimerDisplay(this.pomodoroTime.value * 60);
        } else if (!this.isRunning && this.currentTimerMode === 'shortBreak') {
            this.updateTimerDisplay(this.shortBreakTime.value * 60);
        } else if (!this.isRunning && this.currentTimerMode === 'longBreak') {
            this.updateTimerDisplay(this.longBreakTime.value * 60);
        }
    }

    updateUI() {
        this.updateStats();
        this.renderTasks();
        this.renderTimeEntries();
        this.updateAnalytics();
    }

    // ====== ENHANCED AI FEATURES ======
    
    initializeActivityTracking() {
        // Import activity tracker if available
        if (typeof UniversalActivityTracker !== 'undefined') {
            this.activityTracker = new UniversalActivityTracker();
            this.setupActivityListeners();
            
            // Start tracking for current user
            const userId = this.getUserId();
            this.activityTracker.startTracking(userId);
            
            console.log('✓ Activity tracking initialized');
        } else {
            console.warn('Activity tracker not available');
            this.initializeBasicTracking();
        }
    }

    initializeBasicTracking() {
        // Fallback basic tracking without external dependencies
        this.basicTracker = {
            keyboardActivity: 0,
            mouseActivity: 0,
            lastActivity: Date.now(),
            
            trackActivity: () => {
                this.basicTracker.lastActivity = Date.now();
            }
        };

        // Track basic user activity
        document.addEventListener('keydown', () => {
            this.basicTracker.keyboardActivity++;
            this.basicTracker.trackActivity();
        });

        document.addEventListener('mousemove', () => {
            this.basicTracker.mouseActivity++;
            this.basicTracker.trackActivity();
        });

        // Check for inactivity every minute
        setInterval(() => {
            const timeSinceActivity = Date.now() - this.basicTracker.lastActivity;
            if (timeSinceActivity > 5 * 60 * 1000) { // 5 minutes
                this.suggestBreak('You\'ve been inactive for a while. Consider taking a break!');
            }
        }, 60000);
    }

    setupActivityListeners() {
        // Listen for activity tracking events
        window.addEventListener('focusflow-activity-update', (event) => {
            this.handleActivityUpdate(event.detail);
        });

        window.addEventListener('focusflow-suggestion', (event) => {
            this.handleAISuggestion(event.detail);
        });

        window.addEventListener('focusflow-command', (event) => {
            this.handleAICommand(event.detail);
        });

        window.addEventListener('focusflow-process-predictions', (event) => {
            this.processPredictions(event.detail);
        });
    }

    handleActivityUpdate(activity) {
        // Update UI based on activity classification
        this.updateProductivityIndicator(activity);
        
        // Store activity data for analytics
        this.storeActivityData(activity);
        
        // Trigger real-time optimizations
        if (activity.category === 'DEEP_WORK' && activity.productivityScore > 0.8) {
            this.enableFocusMode();
        }
    }

    updateProductivityIndicator(activity) {
        // Create or update productivity indicator in UI
        let indicator = document.getElementById('productivity-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'productivity-indicator';
            indicator.className = 'productivity-indicator';
            document.querySelector('.app-header').appendChild(indicator);
        }

        const score = Math.round(activity.productivityScore * 100);
        const category = activity.category;
        
        indicator.innerHTML = `
            <div class="productivity-score ${category.toLowerCase()}">
                <span class="score">${score}%</span>
                <span class="category">${category.replace('_', ' ')}</span>
            </div>
        `;

        // Add CSS classes for styling
        indicator.className = `productivity-indicator ${category.toLowerCase()}`;
    }

    enableFocusMode() {
        // Enable focus mode automatically
        if (!this.focusModeEnabled) {
            this.focusModeEnabled = true;
            document.body.classList.add('focus-mode');
            
            // Show focus mode notification
            this.showNotification('Focus Mode Enabled', 'Deep work detected - distractions minimized');
            
            // Auto-enable ambient sounds if not already playing
            if (!this.isAmbientSoundPlaying()) {
                this.playAmbientSound('forest');
            }
        }
    }

    handleAISuggestion(suggestion) {
        // Display AI suggestions to user
        this.showAISuggestion(suggestion);
    }

    showAISuggestion(suggestion) {
        // Create suggestion notification
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'ai-suggestion';
        suggestionDiv.innerHTML = `
            <div class="suggestion-content">
                <div class="suggestion-icon">🤖</div>
                <div class="suggestion-text">
                    <strong>AI Suggestion:</strong>
                    <p>${suggestion.message}</p>
                </div>
                <div class="suggestion-actions">
                    <button onclick="app.acceptSuggestion('${suggestion.type}', ${JSON.stringify(suggestion.data).replace(/"/g, '&quot;')})">Accept</button>
                    <button onclick="app.dismissSuggestion(this)">Dismiss</button>
                </div>
            </div>
        `;

        // Add to suggestions container
        let container = document.getElementById('ai-suggestions');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-suggestions';
            container.className = 'ai-suggestions-container';
            document.body.appendChild(container);
        }

        container.appendChild(suggestionDiv);

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (suggestionDiv.parentNode) {
                suggestionDiv.remove();
            }
        }, 30000);
    }

    acceptSuggestion(type, data) {
        switch (type) {
            case 'task_creation':
                this.createTaskFromSuggestion(data);
                break;
            case 'break_or_refocus':
                this.startBreak();
                break;
            case 'ambient_sound':
                this.playAmbientSound(data.soundType);
                break;
            case 'website_blocking':
                this.enableDistractingWebsiteBlocking(data.duration);
                break;
        }
    }

    dismissSuggestion(button) {
        const suggestion = button.closest('.ai-suggestion');
        if (suggestion) {
            suggestion.remove();
        }
    }

    createTaskFromSuggestion(data) {
        // Create task from AI suggestion
        const task = {
            id: Date.now(),
            title: data.title,
            description: `Auto-created from activity: ${data.context}`,
            project: this.currentProject.value || 'Work',
            priority: 'medium',
            estimatedPomodoros: Math.ceil(data.estimatedDuration / 25),
            completed: false,
            createdAt: new Date(),
            tags: ['ai-generated']
        };

        this.tasks.push(task);
        this.saveData();
        this.renderTasks();
        
        this.showNotification('Task Created', `Created task: ${task.title}`);
    }

    initializePredictiveEngine() {
        this.predictiveEngine = {
            patterns: new Map(),
            predictions: [],
            
            generatePredictions: () => {
                return this.generateTaskPredictions();
            },
            
            analyzePatterns: () => {
                return this.analyzeUserPatterns();
            }
        };

        // Generate predictions every 5 minutes
        setInterval(() => {
            this.generateAndDisplayPredictions();
        }, 5 * 60 * 1000);

        console.log('✓ Predictive engine initialized');
    }

    generateTaskPredictions() {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        const predictions = [];

        // Time-based predictions
        if (hour === 9 && !this.hasTasksForToday()) {
            predictions.push({
                title: 'Plan your day',
                description: 'Start by creating your daily task list',
                priority: 'high',
                confidence: 0.9,
                reasoning: 'Morning planning session detected'
            });
        }

        if (hour >= 14 && hour <= 16 && this.getCompletedTodayCount() === 0) {
            predictions.push({
                title: 'Afternoon focus session',
                description: 'Tackle your most important task of the day',
                priority: 'high',
                confidence: 0.8,
                reasoning: 'Afternoon productivity peak'
            });
        }

        // Pattern-based predictions
        const recentTasks = this.getRecentTasks(7); // Last 7 days
        const commonTasks = this.findCommonTasks(recentTasks);
        
        for (const commonTask of commonTasks) {
            predictions.push({
                title: commonTask.title,
                description: `Recurring task based on your patterns`,
                priority: commonTask.priority,
                confidence: commonTask.frequency,
                reasoning: `You typically do this on ${this.getDayName(dayOfWeek)}`
            });
        }

        return predictions.slice(0, 5); // Top 5 predictions
    }

    generateAndDisplayPredictions() {
        const predictions = this.generateTaskPredictions();
        
        if (predictions.length > 0) {
            this.displayPredictions(predictions);
        }
    }

    displayPredictions(predictions) {
        // Show high-confidence predictions as suggestions
        const highConfidencePredictions = predictions.filter(p => p.confidence > 0.7);
        
        for (const prediction of highConfidencePredictions) {
            this.showAISuggestion({
                type: 'task_creation',
                message: `Would you like to add: "${prediction.title}"?`,
                data: prediction,
                confidence: prediction.confidence
            });
        }
    }

    initializeEnvironmentController() {
        this.environmentController = {
            currentProfile: null,
            profiles: {
                'deep_work': {
                    name: 'Deep Work Focus',
                    ambientSound: 'forest',
                    notifications: 'dnd',
                    theme: 'focus'
                },
                'creative': {
                    name: 'Creative Mode',
                    ambientSound: 'cafe',
                    notifications: 'minimal',
                    theme: 'creative'
                },
                'break': {
                    name: 'Break Time',
                    ambientSound: 'rain',
                    notifications: 'normal',
                    theme: 'relaxed'
                }
            }
        };

        console.log('✓ Environment controller initialized');
    }

    optimizeEnvironmentForTask(taskType) {
        const profile = this.selectOptimalProfile(taskType);
        this.applyEnvironmentProfile(profile);
    }

    selectOptimalProfile(taskType) {
        const profileMap = {
            'focus': 'deep_work',
            'creative': 'creative',
            'break': 'break',
            'meeting': 'minimal'
        };

        return this.environmentController.profiles[profileMap[taskType] || 'deep_work'];
    }

    applyEnvironmentProfile(profile) {
        if (!profile) return;

        // Apply ambient sound
        if (profile.ambientSound) {
            this.playAmbientSound(profile.ambientSound);
        }

        // Apply notification settings
        if (profile.notifications === 'dnd') {
            this.enableDoNotDisturb();
        }

        // Apply theme
        if (profile.theme) {
            this.applyTheme(profile.theme);
        }

        this.environmentController.currentProfile = profile;
        this.showNotification('Environment Optimized', `Applied ${profile.name} profile`);
    }

    enableDoNotDisturb() {
        document.body.classList.add('dnd-mode');
        this.dndEnabled = true;
        
        // Minimize non-essential notifications
        this.notificationSettings = {
            social: false,
            nonWork: false,
            critical: true
        };
    }

    applyTheme(themeName) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
    }

    // Helper methods
    getUserId() {
        let userId = localStorage.getItem('focusflow-user-id');
        if (!userId) {
            userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('focusflow-user-id', userId);
        }
        return userId;
    }

    storeActivityData(activity) {
        const activityLog = JSON.parse(localStorage.getItem('focusflow-activity-log') || '[]');
        activityLog.push({
            ...activity,
            timestamp: Date.now()
        });

        // Keep only last 1000 entries
        if (activityLog.length > 1000) {
            activityLog.splice(0, activityLog.length - 1000);
        }

        localStorage.setItem('focusflow-activity-log', JSON.stringify(activityLog));
    }

    hasTasksForToday() {
        const today = new Date().toDateString();
        return this.tasks.some(task => 
            !task.completed && 
            (!task.dueDate || new Date(task.dueDate).toDateString() === today)
        );
    }

    getCompletedTodayCount() {
        const today = new Date().toDateString();
        return this.tasks.filter(task => 
            task.completed && 
            task.completedAt && 
            new Date(task.completedAt).toDateString() === today
        ).length;
    }

    getRecentTasks(days) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return this.tasks.filter(task => 
            task.createdAt && new Date(task.createdAt).getTime() > cutoff
        );
    }

    findCommonTasks(tasks) {
        const taskGroups = {};
        
        tasks.forEach(task => {
            const key = task.title.toLowerCase().trim();
            if (!taskGroups[key]) {
                taskGroups[key] = {
                    title: task.title,
                    priority: task.priority,
                    count: 0
                };
            }
            taskGroups[key].count++;
        });

        return Object.values(taskGroups)
            .filter(group => group.count > 1)
            .map(group => ({
                ...group,
                frequency: group.count / tasks.length
            }))
            .sort((a, b) => b.frequency - a.frequency);
    }

    getDayName(dayOfWeek) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek];
    }

    isAmbientSoundPlaying() {
        return this.currentAmbientSound && !this.currentAmbientSound.paused;
    }

    playAmbientSound(soundType) {
        // Stop current sound if playing
        if (this.currentAmbientSound) {
            this.currentAmbientSound.pause();
        }

        // Play new sound
        const soundMap = {
            'forest': './sounds/forest.mp3',
            'rain': './sounds/rain.mp3',
            'cafe': './sounds/cafe.mp3',
            'fire': './sounds/fire.mp3',
            'whitenoise': './sounds/whitenoise.mp3'
        };

        if (soundMap[soundType]) {
            this.currentAmbientSound = new Audio(soundMap[soundType]);
            this.currentAmbientSound.loop = true;
            this.currentAmbientSound.volume = 0.3;
            this.currentAmbientSound.play().catch(e => {
                console.warn('Could not play ambient sound:', e);
            });
        }
    }

    suggestBreak(message) {
        this.showAISuggestion({
            type: 'break_or_refocus',
            message: message || 'Time for a break?',
            confidence: 0.8
        });
    }

    enableDistractingWebsiteBlocking(duration) {
        // Placeholder for website blocking functionality
        // In a real implementation, this would integrate with browser extensions
        this.showNotification('Focus Mode', `Distraction blocking enabled for ${Math.round(duration / 60000)} minutes`);
        
        // Store the blocking state
        localStorage.setItem('focusflow-blocking-until', Date.now() + duration);
    }

    handleAICommand(command) {
        switch (command.command) {
            case 'enable_dnd':
                this.enableDoNotDisturb();
                break;
            case 'app_focused':
                this.onAppFocused();
                break;
            case 'app_blurred':
                this.onAppBlurred();
                break;
            case 'app_hidden':
                this.onAppHidden();
                break;
            case 'app_visible':
                this.onAppVisible();
                break;
        }
    }

    onAppFocused() {
        // App gained focus - user is actively using it
        this.appFocusTime = Date.now();
    }

    onAppBlurred() {
        // App lost focus - user switched to something else
        if (this.appFocusTime) {
            const focusedDuration = Date.now() - this.appFocusTime;
            this.recordFocusSession(focusedDuration);
        }
    }

    onAppHidden() {
        // App is hidden/minimized
        this.isAppVisible = false;
    }

    onAppVisible() {
        // App is visible again
        this.isAppVisible = true;
    }

    recordFocusSession(duration) {
        // Record how long user stayed focused on the app
        const sessions = JSON.parse(localStorage.getItem('focusflow-focus-sessions') || '[]');
        sessions.push({
            duration: duration,
            timestamp: Date.now()
        });

        // Keep only last 100 sessions
        if (sessions.length > 100) {
            sessions.splice(0, sessions.length - 100);
        }

        localStorage.setItem('focusflow-focus-sessions', JSON.stringify(sessions));
    }

    processPredictions(data) {
        // Process activity data to generate predictions
        const { userId, activities } = data;
        
        // Analyze patterns in activities
        const patterns = this.analyzeActivityPatterns(activities);
        
        // Generate predictions based on patterns
        const predictions = this.generatePredictionsFromPatterns(patterns);
        
        // Display relevant predictions
        if (predictions.length > 0) {
            this.displayPredictions(predictions);
        }
    }

    analyzeActivityPatterns(activities) {
        const patterns = {
            productiveHours: new Map(),
            commonTasks: new Map(),
            breakPatterns: []
        };

        activities.forEach(activity => {
            const hour = new Date(activity.timestamp).getHours();
            
            // Track productive hours
            if (activity.category === 'DEEP_WORK' || activity.category === 'PRODUCTIVE') {
                const current = patterns.productiveHours.get(hour) || 0;
                patterns.productiveHours.set(hour, current + 1);
            }

            // Track break patterns
            if (activity.category === 'DISTRACTING') {
                patterns.breakPatterns.push({
                    hour: hour,
                    timestamp: activity.timestamp
                });
            }
        });

        return patterns;
    }

    generatePredictionsFromPatterns(patterns) {
        const predictions = [];
        const currentHour = new Date().getHours();

        // Predict based on productive hours
        if (patterns.productiveHours.has(currentHour)) {
            const productivity = patterns.productiveHours.get(currentHour);
            if (productivity > 2) { // If typically productive at this hour
                predictions.push({
                    title: 'Focus session',
                    description: 'This is typically a productive time for you',
                    priority: 'high',
                    confidence: Math.min(productivity / 5, 1),
                    reasoning: `You're usually productive at ${currentHour}:00`
                });
            }
        }

        return predictions;
    }
}

// Enhanced CSS for new features
const enhancedCSS = `
    .productivity-indicator {
        display: inline-flex;
        align-items: center;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 10px;
    }

    .productivity-indicator.deep_work {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
    }

    .productivity-indicator.productive {
        background: linear-gradient(135deg, #3498db, #5dade2);
        color: white;
    }

    .productivity-indicator.neutral {
        background: linear-gradient(135deg, #95a5a6, #bdc3c7);
        color: white;
    }

    .productivity-indicator.distracting {
        background: linear-gradient(135deg, #e74c3c, #ec7063);
        color: white;
    }

    .ai-suggestions-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 1000;
        max-width: 350px;
    }

    .ai-suggestion {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
    }

    .suggestion-content {
        display: flex;
        gap: 10px;
        align-items: flex-start;
    }

    .suggestion-icon {
        font-size: 20px;
        flex-shrink: 0;
    }

    .suggestion-text {
        flex: 1;
    }

    .suggestion-text strong {
        color: #2c3e50;
        font-size: 14px;
    }

    .suggestion-text p {
        margin: 5px 0 10px 0;
        color: #666;
        font-size: 13px;
        line-height: 1.4;
    }

    .suggestion-actions {
        display: flex;
        gap: 5px;
        margin-top: 10px;
    }

    .suggestion-actions button {
        padding: 5px 10px;
        border: none;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .suggestion-actions button:first-child {
        background: #3498db;
        color: white;
    }

    .suggestion-actions button:first-child:hover {
        background: #2980b9;
    }

    .suggestion-actions button:last-child {
        background: #ecf0f1;
        color: #666;
    }

    .suggestion-actions button:last-child:hover {
        background: #d5dbdb;
    }

    .focus-mode {
        --primary-color: #2c3e50;
        --accent-color: #27ae60;
    }

    .focus-mode .container {
        max-width: 800px;
        margin: 0 auto;
    }

    .focus-mode .tab-navigation button:not(.active) {
        opacity: 0.5;
    }

    .dnd-mode .notification {
        display: none !important;
    }

    .theme-focus {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .theme-creative {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
    }

    .theme-relaxed {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Inject enhanced CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedCSS;
document.head.appendChild(styleSheet);

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FocusFlowApp();
});