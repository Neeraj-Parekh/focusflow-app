/**
 * Universal Activity Tracker - Browser-Compatible Version
 * Tracks user activity across applications and provides real-time productivity insights
 */

class UniversalActivityTracker {
    constructor() {
        this.trackingInterval = 30000; // 30 seconds
        this.isTracking = false;
        this.activityBuffer = [];
        this.aiClassifier = new AIActivityClassifier();
        this.lastKeyboardTime = 0;
        this.lastMouseTime = 0;
        this.keyboardCount = 0;
        this.mouseCount = 0;
        
        this.setupEventListeners();
    }
    
    async startTracking(userId) {
        // Request comprehensive permissions for PWA
        const permissions = await this.requestPermissions();
        if (!permissions.granted) {
            console.warn('Limited tracking permissions - some features may not work');
        }
        
        this.isTracking = true;
        this.trackingLoop(userId);
    }
    
    async requestPermissions() {
        const requestedPermissions = [];
        
        // Request notification permission for productivity alerts
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            requestedPermissions.push(`notifications: ${permission}`);
        }
        
        // Request wake lock for preventing sleep during focus sessions
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                requestedPermissions.push('wakeLock: granted');
                wakeLock.release(); // Release immediately, just testing
            } catch (err) {
                requestedPermissions.push('wakeLock: denied');
            }
        }
        
        return {
            granted: requestedPermissions.length > 0,
            permissions: requestedPermissions
        };
    }
    
    setupEventListeners() {
        // Track keyboard activity
        document.addEventListener('keydown', () => {
            this.keyboardCount++;
            this.lastKeyboardTime = Date.now();
        });
        
        // Track mouse activity
        document.addEventListener('mousemove', () => {
            this.mouseCount++;
            this.lastMouseTime = Date.now();
        });
        
        // Track focus/blur events
        window.addEventListener('focus', () => {
            this.onWindowFocus();
        });
        
        window.addEventListener('blur', () => {
            this.onWindowBlur();
        });
        
        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.onVisibilityChange();
        });
    }
    
    async trackingLoop(userId) {
        while (this.isTracking) {
            try {
                const activityData = await this.collectActivitySnapshot();
                const classifiedActivity = await this.aiClassifier.classify(activityData);
                
                this.activityBuffer.push(classifiedActivity);
                
                // Process predictions every 5 minutes
                if (this.activityBuffer.length >= 10) {
                    await this.processPredictions(userId, this.activityBuffer);
                    this.activityBuffer = [];
                }
                
                // Real-time optimizations
                await this.performRealtimeOptimizations(classifiedActivity);
                
            } catch (error) {
                console.error('Tracking error:', error);
            }
            
            await this.sleep(this.trackingInterval);
        }
    }
    
    async collectActivitySnapshot() {
        const now = Date.now();
        
        const snapshot = {
            timestamp: now,
            activeWindow: await this.getCurrentActiveWindow(),
            applicationUsage: await this.getApplicationUsage(),
            keyboardActivity: this.getKeyboardActivity(),
            mouseActivity: this.getMouseActivity(),
            productivityScore: 0,
            category: 'NEUTRAL',
            focusIntensity: 0,
            contextSignals: await this.gatherContextSignals()
        };
        
        // Reset counters
        this.keyboardCount = 0;
        this.mouseCount = 0;
        
        return snapshot;
    }
    
    async getCurrentActiveWindow() {
        // For PWA - use Page Visibility API and focus detection
        if (document.hasFocus()) {
            return `${document.title} - ${window.location.hostname}`;
        }
        return 'Browser Background';
    }
    
    async getApplicationUsage() {
        // Track time spent on different parts of the app
        const usage = {};
        const currentUrl = window.location.pathname;
        const timeSpent = this.trackingInterval / 1000; // Convert to seconds
        
        usage[currentUrl] = timeSpent;
        return usage;
    }
    
    getKeyboardActivity() {
        const timeSinceLastKey = Date.now() - this.lastKeyboardTime;
        // If recent activity (within last 30 seconds), return count
        return timeSinceLastKey < this.trackingInterval ? this.keyboardCount : 0;
    }
    
    getMouseActivity() {
        const timeSinceLastMouse = Date.now() - this.lastMouseTime;
        return timeSinceLastMouse < this.trackingInterval ? this.mouseCount : 0;
    }
    
    async gatherContextSignals() {
        const signals = [];
        
        // Check for upcoming deadlines
        const tasks = await this.getCurrentTasks();
        const upcomingDeadlines = tasks.filter(task => 
            task.dueDate && new Date(task.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
        );
        
        if (upcomingDeadlines.length > 0) {
            signals.push({
                type: 'deadline_approaching',
                confidence: 0.9,
                data: { tasks: upcomingDeadlines }
            });
        }
        
        // Check if break is needed (based on continuous work time)
        const continuousWorkTime = await this.getContinuousWorkTime();
        if (continuousWorkTime > 90 * 60 * 1000) { // 90 minutes
            signals.push({
                type: 'break_needed',
                confidence: 0.8,
                data: { workTime: continuousWorkTime }
            });
        }
        
        return signals;
    }
    
    async performRealtimeOptimizations(activity) {
        // Auto-adjust environment based on activity
        if (activity.category === 'DEEP_WORK' && activity.productivityScore > 0.8) {
            await this.optimizeEnvironmentForDeepWork();
        }
        
        // Auto-suggest breaks if distraction detected
        if (activity.category === 'DISTRACTING' && this.getConsecutiveDistractionTime() > 300000) { // 5 minutes
            await this.suggestBreakOrRefocus();
        }
        
        // Auto-create tasks from productive patterns
        if (activity.category === 'PRODUCTIVE' && activity.focusIntensity > 0.7) {
            await this.detectPotentialTasks(activity);
        }
        
        // Send productivity insights to the main app
        this.broadcastActivityUpdate(activity);
    }
    
    async optimizeEnvironmentForDeepWork() {
        // Enable Do Not Disturb mode
        this.enableDoNotDisturb();
        
        // Suggest ambient sounds
        this.suggestAmbientSounds('focus');
        
        // Block distracting websites if possible
        this.suggestDistractingWebsiteBlocking();
    }
    
    async suggestBreakOrRefocus() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('FocusFlow: Time for a break?', {
                body: 'You\'ve been distracted for a while. Consider taking a short break or returning to your task.',
                icon: '/images/icon-192x192.png',
                tag: 'productivity-suggestion'
            });
        }
        
        // Also update the UI
        this.broadcastSuggestion({
            type: 'break_or_refocus',
            message: 'Consider taking a break or refocusing on your main task',
            confidence: 0.8
        });
    }
    
    async detectPotentialTasks(activity) {
        // Analyze current activity for potential task creation
        const potentialTask = {
            title: `Work on ${activity.activeWindow}`,
            context: activity.activeWindow,
            estimatedDuration: 25, // Default pomodoro
            confidence: activity.productivityScore
        };
        
        if (potentialTask.confidence > 0.7) {
            this.broadcastSuggestion({
                type: 'task_creation',
                message: `Would you like to create a task for "${potentialTask.title}"?`,
                data: potentialTask
            });
        }
    }
    
    enableDoNotDisturb() {
        // Signal to the main app to enable DND mode
        this.broadcastCommand('enable_dnd');
    }
    
    suggestAmbientSounds(type) {
        this.broadcastSuggestion({
            type: 'ambient_sound',
            message: `Consider enabling ${type} sounds for better concentration`,
            data: { soundType: type }
        });
    }
    
    suggestDistractingWebsiteBlocking() {
        this.broadcastSuggestion({
            type: 'website_blocking',
            message: 'Enable distraction blocking to maintain focus?',
            data: { duration: 25 * 60 * 1000 } // 25 minutes
        });
    }
    
    broadcastActivityUpdate(activity) {
        window.dispatchEvent(new CustomEvent('focusflow-activity-update', {
            detail: activity
        }));
    }
    
    broadcastSuggestion(suggestion) {
        window.dispatchEvent(new CustomEvent('focusflow-suggestion', {
            detail: suggestion
        }));
    }
    
    broadcastCommand(command) {
        window.dispatchEvent(new CustomEvent('focusflow-command', {
            detail: { command }
        }));
    }
    
    async getCurrentTasks() {
        // Get tasks from localStorage or API
        try {
            const tasks = localStorage.getItem('focusflow-tasks');
            return tasks ? JSON.parse(tasks) : [];
        } catch {
            return [];
        }
    }
    
    async getContinuousWorkTime() {
        // Calculate continuous work time from activity buffer
        const workActivities = this.activityBuffer.filter(a => 
            a.category === 'DEEP_WORK' || a.category === 'PRODUCTIVE'
        );
        return workActivities.length * this.trackingInterval;
    }
    
    getConsecutiveDistractionTime() {
        // Calculate consecutive distraction time
        let consecutiveTime = 0;
        for (let i = this.activityBuffer.length - 1; i >= 0; i--) {
            if (this.activityBuffer[i].category === 'DISTRACTING') {
                consecutiveTime += this.trackingInterval;
            } else {
                break;
            }
        }
        return consecutiveTime;
    }
    
    async processPredictions(userId, activities) {
        // Send activity data to predictive engine
        window.dispatchEvent(new CustomEvent('focusflow-process-predictions', {
            detail: { userId, activities }
        }));
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    onWindowFocus() {
        // App regained focus
        this.broadcastCommand('app_focused');
    }
    
    onWindowBlur() {
        // App lost focus
        this.broadcastCommand('app_blurred');
    }
    
    onVisibilityChange() {
        if (document.hidden) {
            this.broadcastCommand('app_hidden');
        } else {
            this.broadcastCommand('app_visible');
        }
    }
    
    stopTracking() {
        this.isTracking = false;
    }
    
    getTrackingStats() {
        return {
            isTracking: this.isTracking,
            bufferSize: this.activityBuffer.length,
            lastActivity: this.activityBuffer[this.activityBuffer.length - 1]
        };
    }
}

class AIActivityClassifier {
    constructor() {
        this.classificationCache = new Map();
    }
    
    async classify(activity) {
        const cacheKey = this.generateCacheKey(activity);
        
        if (this.classificationCache.has(cacheKey)) {
            return { ...activity, ...this.classificationCache.get(cacheKey) };
        }
        
        try {
            const classification = await this.classifyWithRules(activity);
            this.classificationCache.set(cacheKey, classification);
            return { ...activity, ...classification };
        } catch (error) {
            console.error('Classification error:', error);
            return { ...activity, ...this.fallbackClassification(activity) };
        }
    }
    
    generateCacheKey(activity) {
        return `${activity.activeWindow}_${activity.keyboardActivity > 0}_${activity.mouseActivity > 0}`;
    }
    
    async classifyWithRules(activity) {
        const productivityKeywords = [
            'github', 'stackoverflow', 'docs', 'code', 'work', 'focusflow',
            'editor', 'ide', 'terminal', 'documentation', 'jira', 'slack'
        ];
        
        const distractingKeywords = [
            'youtube', 'facebook', 'twitter', 'instagram', 'reddit', 'tiktok',
            'news', 'entertainment', 'games', 'netflix', 'twitch'
        ];
        
        const deepWorkKeywords = [
            'code', 'programming', 'writing', 'design', 'analysis', 'research'
        ];
        
        const activeWindow = activity.activeWindow.toLowerCase();
        
        let category = 'NEUTRAL';
        let productivityScore = 0.5;
        let focusIntensity = 0.5;
        
        // High keyboard/mouse activity indicates engagement
        const activityLevel = (activity.keyboardActivity + activity.mouseActivity) / 2;
        focusIntensity = Math.min(activityLevel / 20, 1.0); // Normalize to 0-1
        
        // Classify based on window content
        if (deepWorkKeywords.some(keyword => activeWindow.includes(keyword))) {
            category = 'DEEP_WORK';
            productivityScore = 0.9;
            focusIntensity = Math.max(focusIntensity, 0.8);
        } else if (productivityKeywords.some(keyword => activeWindow.includes(keyword))) {
            category = 'PRODUCTIVE';
            productivityScore = 0.8;
            focusIntensity = Math.max(focusIntensity, 0.6);
        } else if (distractingKeywords.some(keyword => activeWindow.includes(keyword))) {
            category = 'DISTRACTING';
            productivityScore = 0.2;
            focusIntensity = Math.min(focusIntensity, 0.3);
        } else if (activityLevel > 15) {
            category = 'PRODUCTIVE';
            productivityScore = 0.7;
        }
        
        // Boost score for high activity
        if (activityLevel > 25) {
            productivityScore = Math.min(productivityScore + 0.1, 1.0);
        }
        
        return {
            category,
            productivityScore,
            focusIntensity
        };
    }
    
    fallbackClassification(activity) {
        return {
            category: 'NEUTRAL',
            productivityScore: 0.5,
            focusIntensity: 0.5
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.UniversalActivityTracker = UniversalActivityTracker;
    window.AIActivityClassifier = AIActivityClassifier;
}