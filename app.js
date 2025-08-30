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
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FocusFlowApp();
});