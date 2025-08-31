/**
 * Universal Activity Tracker - Automated Intelligence System
 * Tracks user activity across applications and provides real-time productivity insights
 */

interface ActivityData {
    timestamp: number;
    activeWindow: string;
    applicationUsage: Record<string, number>;
    keyboardActivity: number;
    mouseActivity: number;
    productivityScore: number;
    category: 'DEEP_WORK' | 'PRODUCTIVE' | 'ADMINISTRATIVE' | 'NEUTRAL' | 'DISTRACTING';
    focusIntensity: number;
    contextSignals: ContextSignal[];
}

interface ContextSignal {
    type: 'calendar_event' | 'deadline_approaching' | 'meeting_starting' | 'break_needed';
    confidence: number;
    data: any;
}

class UniversalActivityTracker {
    private trackingInterval: number = 30000; // 30 seconds
    private isTracking: boolean = false;
    private activityBuffer: ActivityData[] = [];
    private aiClassifier: AIActivityClassifier;
    private lastKeyboardTime: number = 0;
    private lastMouseTime: number = 0;
    private keyboardCount: number = 0;
    private mouseCount: number = 0;
    
    constructor() {
        this.aiClassifier = new AIActivityClassifier();
        this.setupEventListeners();
    }
    
    async startTracking(userId: string): Promise<void> {
        // Request comprehensive permissions for PWA
        const permissions = await this.requestPermissions();
        if (!permissions.granted) {
            console.warn('Limited tracking permissions - some features may not work');
        }
        
        this.isTracking = true;
        this.trackingLoop(userId);
    }
    
    private async requestPermissions(): Promise<{granted: boolean, permissions: string[]}> {
        const requestedPermissions = [];
        
        // Request notification permission for productivity alerts
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            requestedPermissions.push(`notifications: ${permission}`);
        }
        
        // Request wake lock for preventing sleep during focus sessions
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await (navigator as any).wakeLock.request('screen');
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
    
    private setupEventListeners(): void {
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
    
    private async trackingLoop(userId: string): Promise<void> {
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
    
    private async collectActivitySnapshot(): Promise<ActivityData> {
        const now = Date.now();
        
        const snapshot: ActivityData = {
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
    
    private async getCurrentActiveWindow(): Promise<string> {
        // For PWA - use Page Visibility API and focus detection
        if (document.hasFocus()) {
            return `${document.title} - ${window.location.hostname}`;
        }
        return 'Browser Background';
    }
    
    private async getApplicationUsage(): Promise<Record<string, number>> {
        // Track time spent on different parts of the app
        const usage: Record<string, number> = {};
        const currentUrl = window.location.pathname;
        const timeSpent = this.trackingInterval / 1000; // Convert to seconds
        
        usage[currentUrl] = timeSpent;
        return usage;
    }
    
    private getKeyboardActivity(): number {
        const timeSinceLastKey = Date.now() - this.lastKeyboardTime;
        // If recent activity (within last 30 seconds), return count
        return timeSinceLastKey < this.trackingInterval ? this.keyboardCount : 0;
    }
    
    private getMouseActivity(): number {
        const timeSinceLastMouse = Date.now() - this.lastMouseTime;
        return timeSinceLastMouse < this.trackingInterval ? this.mouseCount : 0;
    }
    
    private async gatherContextSignals(): Promise<ContextSignal[]> {
        const signals: ContextSignal[] = [];
        
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
    
    private async performRealtimeOptimizations(activity: ActivityData): Promise<void> {
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
    
    private async optimizeEnvironmentForDeepWork(): Promise<void> {
        // Enable Do Not Disturb mode
        this.enableDoNotDisturb();
        
        // Suggest ambient sounds
        this.suggestAmbientSounds('focus');
        
        // Block distracting websites if possible
        this.suggestDistractingWebsiteBlocking();
    }
    
    private async suggestBreakOrRefocus(): Promise<void> {
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
    
    private async detectPotentialTasks(activity: ActivityData): Promise<void> {
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
    
    private enableDoNotDisturb(): void {
        // Signal to the main app to enable DND mode
        this.broadcastCommand('enable_dnd');
    }
    
    private suggestAmbientSounds(type: string): void {
        this.broadcastSuggestion({
            type: 'ambient_sound',
            message: `Consider enabling ${type} sounds for better concentration`,
            data: { soundType: type }
        });
    }
    
    private suggestDistractingWebsiteBlocking(): void {
        this.broadcastSuggestion({
            type: 'website_blocking',
            message: 'Enable distraction blocking to maintain focus?',
            data: { duration: 25 * 60 * 1000 } // 25 minutes
        });
    }
    
    private broadcastActivityUpdate(activity: ActivityData): void {
        window.dispatchEvent(new CustomEvent('focusflow-activity-update', {
            detail: activity
        }));
    }
    
    private broadcastSuggestion(suggestion: any): void {
        window.dispatchEvent(new CustomEvent('focusflow-suggestion', {
            detail: suggestion
        }));
    }
    
    private broadcastCommand(command: string): void {
        window.dispatchEvent(new CustomEvent('focusflow-command', {
            detail: { command }
        }));
    }
    
    private async getCurrentTasks(): Promise<any[]> {
        // Get tasks from localStorage or API
        try {
            const tasks = localStorage.getItem('focusflow-tasks');
            return tasks ? JSON.parse(tasks) : [];
        } catch {
            return [];
        }
    }
    
    private async getContinuousWorkTime(): Promise<number> {
        // Calculate continuous work time from activity buffer
        const workActivities = this.activityBuffer.filter(a => 
            a.category === 'DEEP_WORK' || a.category === 'PRODUCTIVE'
        );
        return workActivities.length * this.trackingInterval;
    }
    
    private getConsecutiveDistractionTime(): number {
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
    
    private async processPredictions(userId: string, activities: ActivityData[]): Promise<void> {
        // Send activity data to predictive engine
        window.dispatchEvent(new CustomEvent('focusflow-process-predictions', {
            detail: { userId, activities }
        }));
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    private onWindowFocus(): void {
        // App regained focus
        this.broadcastCommand('app_focused');
    }
    
    private onWindowBlur(): void {
        // App lost focus
        this.broadcastCommand('app_blurred');
    }
    
    private onVisibilityChange(): void {
        if (document.hidden) {
            this.broadcastCommand('app_hidden');
        } else {
            this.broadcastCommand('app_visible');
        }
    }
    
    public stopTracking(): void {
        this.isTracking = false;
    }
    
    public getTrackingStats(): any {
        return {
            isTracking: this.isTracking,
            bufferSize: this.activityBuffer.length,
            lastActivity: this.activityBuffer[this.activityBuffer.length - 1]
        };
    }
}

class AIActivityClassifier {
    private classificationCache: Map<string, any> = new Map();
    
    async classify(activity: ActivityData): Promise<ActivityData> {
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
    
    private generateCacheKey(activity: ActivityData): string {
        return `${activity.activeWindow}_${activity.keyboardActivity > 0}_${activity.mouseActivity > 0}`;
    }
    
    private async classifyWithRules(activity: ActivityData): Promise<Partial<ActivityData>> {
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
        
        let category: ActivityData['category'] = 'NEUTRAL';
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
    
    private fallbackClassification(activity: ActivityData): Partial<ActivityData> {
        return {
            category: 'NEUTRAL',
            productivityScore: 0.5,
            focusIntensity: 0.5
        };
    }
}

// Export for use in the main app
export { UniversalActivityTracker, ActivityData, ContextSignal };