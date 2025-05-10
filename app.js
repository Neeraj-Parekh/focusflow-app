// DOM elements
const timer = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const pomodoroBtn = document.getElementById('pomodoro');
const shortBreakBtn = document.getElementById('short-break');
const longBreakBtn = document.getElementById('long-break');
const cycleCount = document.getElementById('cycle-count');
const pomodoroTime = document.getElementById('pomodoro-time');
const shortBreakTime = document.getElementById('short-break-time');
const longBreakTime = document.getElementById('long-break-time');
const soundEnabled = document.getElementById('sound-enabled');
const ambientSound = document.getElementById('ambient-sound');

// Timer variables
let timerInterval;
let timeLeft;
let isRunning = false;
let currentTimerMode = 'pomodoro';
let cycles = 0;
let ambientAudio = null;

// Audio files
const timerEndAudio = new Audio('sounds/timer-end.mp3');
const ambientSounds = {
    'rain': 'sounds/rain.mp3',
    'cafe': 'sounds/cafe.mp3',
    'forest': 'sounds/forest.mp3',
    'fire': 'sounds/fire.mp3',
    'whitenoise': 'sounds/whitenoise.mp3'
};

// Initialize settings from localStorage or use defaults
function initSettings() {
    pomodoroTime.value = localStorage.getItem('pomodoroTime') || 25;
    shortBreakTime.value = localStorage.getItem('shortBreakTime') || 5;
    longBreakTime.value = localStorage.getItem('longBreakTime') || 15;
    soundEnabled.checked = localStorage.getItem('soundEnabled') !== 'false';
    ambientSound.value = localStorage.getItem('ambientSound') || 'none';
    
    cycles = parseInt(localStorage.getItem('cycles') || 0);
    cycleCount.textContent = cycles;
    
    // Set initial timer display
    updateTimerDisplay(pomodoroTime.value * 60);
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('pomodoroTime', pomodoroTime.value);
    localStorage.setItem('shortBreakTime', shortBreakTime.value);
    localStorage.setItem('longBreakTime', longBreakTime.value);
    localStorage.setItem('soundEnabled', soundEnabled.checked);
    localStorage.setItem('ambientSound', ambientSound.value);
    localStorage.setItem('cycles', cycles);
}

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Update timer display
function updateTimerDisplay(seconds) {
    timer.textContent = formatTime(seconds);
    document.title = `${formatTime(seconds)} - FocusFlow`;
}

// Start timer
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // Start or resume the timer
    if (!timeLeft) {
        switch (currentTimerMode) {
            case 'pomodoro':
                timeLeft = pomodoroTime.value * 60;
                break;
            case 'shortBreak':
                timeLeft = shortBreakTime.value * 60;
                break;
            case 'longBreak':
                timeLeft = longBreakTime.value * 60;
                break;
        }
    }
    
    // Start ambient sound if enabled and selected
    if (soundEnabled.checked && ambientSound.value !== 'none') {
        playAmbientSound(ambientSound.value);
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            timeLeft = 0;
            
            // Play timer end sound if enabled
            if (soundEnabled.checked) {
                playTimerEndSound();
            }
            
            // Increment cycle count if pomodoro completed
            if (currentTimerMode === 'pomodoro') {
                cycles++;
                cycleCount.textContent = cycles;
                saveSettings();
            }
            
            // Notify user
            if (Notification.permission === 'granted') {
                const message = currentTimerMode === 'pomodoro' ? 
                    'Pomodoro completed! Take a break!' : 
                    'Break time is over! Back to work!';
                
                new Notification('FocusFlow Timer', {
                    body: message,
                    icon: 'images/icon-192x192.png'
                });
            }
        }
    }, 1000);
}

// Pause timer
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Pause ambient sound
    if (ambientAudio) {
        ambientAudio.pause();
    }
}

// Reset timer
function resetTimer() {
    clearInterval(timerInterval);
    
    switch (currentTimerMode) {
        case 'pomodoro':
            timeLeft = pomodoroTime.value * 60;
            break;
        case 'shortBreak':
            timeLeft = shortBreakTime.value * 60;
            break;
        case 'longBreak':
            timeLeft = longBreakTime.value * 60;
            break;
    }
    
    updateTimerDisplay(timeLeft);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Stop ambient sound
    if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
    }
}

// Play timer end sound
function playTimerEndSound() {
    timerEndAudio.play();
}

// Play ambient sound
function playAmbientSound(sound) {
    // Stop any currently playing ambient sound
    if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
    }
    
    if (sound !== 'none' && soundEnabled.checked) {
        ambientAudio = new Audio(ambientSounds[sound]);
        ambientAudio.loop = true;
        ambientAudio.volume = 0.5;
        ambientAudio.play();
    }
}

// Switch timer mode
function switchTimerMode(mode) {
    currentTimerMode = mode;
    // Reset timer when switching modes
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    switch (mode) {
        case 'pomodoro':
            updateTimerDisplay(pomodoroTime.value * 60);
            pomodoroBtn.classList.add('active');
            shortBreakBtn.classList.remove('active');
            longBreakBtn.classList.remove('active');
            break;
        case 'shortBreak':
            updateTimerDisplay(shortBreakTime.value * 60);
            pomodoroBtn.classList.remove('active');
            shortBreakBtn.classList.add('active');
            longBreakBtn.classList.remove('active');
            break;
        case 'longBreak':
            updateTimerDisplay(longBreakTime.value * 60);
            pomodoroBtn.classList.remove('active');
            shortBreakBtn.classList.remove('active');
            longBreakBtn.classList.add('active');
            break;
    }
    
    timeLeft = null; // This will make startTimer initialize the time properly
}

// Request notification permissions
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

pomodoroBtn.addEventListener('click', () => switchTimerMode('pomodoro'));
shortBreakBtn.addEventListener('click', () => switchTimerMode('shortBreak'));
longBreakBtn.addEventListener('click', () => switchTimerMode('longBreak'));

// Setting change listeners
pomodoroTime.addEventListener('change', () => {
    if (currentTimerMode === 'pomodoro' && !isRunning) {
        updateTimerDisplay(pomodoroTime.value * 60);
    }
    saveSettings();
});

shortBreakTime.addEventListener('change', () => {
    if (currentTimerMode === 'shortBreak' && !isRunning) {
        updateTimerDisplay(shortBreakTime.value * 60);
    }
    saveSettings();
});

longBreakTime.addEventListener('change', () => {
    if (currentTimerMode === 'longBreak' && !isRunning) {
        updateTimerDisplay(longBreakTime.value * 60);
    }
    saveSettings();
});

soundEnabled.addEventListener('change', () => {
    saveSettings();
    if (!soundEnabled.checked && ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
    } else if (soundEnabled.checked && ambientSound.value !== 'none' && isRunning) {
        playAmbientSound(ambientSound.value);
    }
});

ambientSound.addEventListener('change', () => {
    saveSettings();
    if (isRunning && soundEnabled.checked) {
        playAmbientSound(ambientSound.value);
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    requestNotificationPermission();
});
