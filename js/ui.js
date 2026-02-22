// UI Module - Screen Management and User Interface
const UI = {
    currentScreen: 'landing-screen',

    // Show a specific screen
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;

            // Focus management for accessibility
            const firstFocusable = targetScreen.querySelector('button, input, select, a');
            if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
            }
        }
    },

    // Show landing screen
    showLanding() {
        this.showScreen('landing-screen');
    },

    // Show login screen
    showLogin() {
        this.showScreen('login-screen');
        this.clearForms();
    },

    // Show signup screen
    showSignup() {
        this.showScreen('signup-screen');
        this.clearForms();
    },

    // Show forgot password screen
    showForgotPassword() {
        this.showScreen('forgot-password-screen');
        this.clearForms();
    },

    // Show dashboard
    showDashboard() {
        this.showScreen('dashboard-screen');
        this.updateDashboard();
    },

    // Update dashboard with user data
    updateDashboard() {
        if (!Auth.userData) return;

        // Update user name
        document.getElementById('user-display-name').textContent = Auth.userData.displayName || 'Player';
        document.getElementById('user-avatar-text').textContent = (Auth.userData.displayName || 'P')[0].toUpperCase();

        // Update stats
        document.getElementById('total-points').textContent = Auth.userData.totalPoints || 0;
        
        // Count completed levels
        let completedCount = 0;
        Object.values(Auth.userData.progress).forEach(level => {
            if (level.completed) completedCount++;
        });
        document.getElementById('levels-completed').textContent = `${completedCount}/5`;

        // Generate level cards
        this.generateLevelCards();
    },

    // Generate level cards
    generateLevelCards() {
        const grid = document.getElementById('levels-grid');
        grid.innerHTML = '';

        LEVELS.forEach(level => {
            const progress = Auth.userData.progress[level.id];
            const isLocked = !progress.unlocked;
            const isCompleted = progress.completed;

            const card = document.createElement('div');
            card.className = `level-card ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', isLocked ? '-1' : '0');
            card.setAttribute('aria-label', `Level ${level.id}: ${level.name}${isLocked ? ' (Locked)' : ''}`);

            card.innerHTML = `
                <div class="level-number">${level.id}</div>
                <h3 class="level-title">${level.name}</h3>
                <p class="level-description">${level.description}</p>
                <div class="level-high-score-badge">
                    <span>🏆</span>
                    <span>High Score: ${progress.highScore}</span>
                </div>
            `;

            if (!isLocked) {
                card.addEventListener('click', () => this.showLevelIntro(level.id));
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.showLevelIntro(level.id);
                    }
                });
            }

            grid.appendChild(card);
        });
    },

    // Show level intro screen
    showLevelIntro(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        if (!level) return;

        const progress = Auth.userData.progress[levelId];

        document.getElementById('level-badge').textContent = level.id;
        document.getElementById('level-intro-title').textContent = `Level ${level.id}: ${level.name}`;
        document.getElementById('level-intro-description').textContent = level.description;
        document.getElementById('show-time').textContent = level.showTime;
        document.getElementById('guess-time').textContent = level.guessTime;
        document.getElementById('level-high-score').textContent = progress.highScore;

        this.showScreen('level-intro-screen');
    },

    // Show profile screen
    showProfile() {
        if (!Auth.userData) return;

        this.showScreen('profile-screen');

        // Update profile info
        document.getElementById('profile-avatar').textContent = (Auth.userData.displayName || 'P')[0].toUpperCase();
        document.getElementById('profile-display-name').textContent = Auth.userData.displayName || 'Player';
        document.getElementById('profile-email').textContent = Auth.userData.email || (isGuestMode ? 'Guest Mode' : '');

        // Update stats
        document.getElementById('profile-total-points').textContent = Auth.userData.totalPoints || 0;
        
        let completedCount = 0;
        Object.values(Auth.userData.progress).forEach(level => {
            if (level.completed) completedCount++;
        });
        document.getElementById('profile-levels-completed').textContent = completedCount;
        document.getElementById('profile-best-streak').textContent = Auth.userData.bestStreak || 0;

        // Generate level progress list
        const list = document.getElementById('level-progress-list');
        list.innerHTML = '';

        LEVELS.forEach(level => {
            const progress = Auth.userData.progress[level.id];
            const item = document.createElement('div');
            item.className = 'level-progress-item';
            
            let statusIcon = '🔒';
            if (progress.completed) {
                statusIcon = '✅';
            } else if (progress.unlocked) {
                statusIcon = '📖';
            }

            item.innerHTML = `
                <div class="level-progress-number">${level.id}</div>
                <div class="level-progress-info">
                    <div class="level-progress-name">${level.name}</div>
                    <div class="level-progress-score">High Score: ${progress.highScore}</div>
                </div>
                <div class="level-progress-status">${statusIcon}</div>
            `;
            list.appendChild(item);
        });
    },

    // Show settings screen
    showSettings() {
        this.showScreen('settings-screen');
        
        // Load current settings
        document.getElementById('dark-mode-toggle').checked = AppSettings.darkMode;
        document.getElementById('time-format-toggle').checked = AppSettings.timeFormat24;
        document.getElementById('sound-toggle').checked = AppSettings.soundEnabled;
        document.getElementById('high-contrast-toggle').checked = AppSettings.highContrast;
    },

    // Show leaderboard screen
    async showLeaderboard(levelId = 1) {
        this.showScreen('leaderboard-screen');
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === levelId);
            btn.setAttribute('aria-selected', parseInt(btn.dataset.level) === levelId);
        });

        // Load leaderboard data
        const scores = await Auth.getLeaderboard(levelId);
        const tbody = document.getElementById('leaderboard-body');
        const emptyMsg = document.getElementById('leaderboard-empty');

        if (scores.length === 0) {
            tbody.innerHTML = '';
            emptyMsg.style.display = 'block';
        } else {
            emptyMsg.style.display = 'none';
            tbody.innerHTML = scores.map((entry, index) => {
                const rankClass = index < 3 ? `rank-${index + 1}` : '';
                const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                return `
                    <tr>
                        <td class="${rankClass}">${rankIcon} ${index + 1}</td>
                        <td>${entry.odisplayName || 'Anonymous'}</td>
                        <td>${entry.score}</td>
                    </tr>
                `;
            }).join('');
        }
    },

    // Show tutorial
    showTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        overlay.style.display = 'flex';
        this.tutorialStep = 0;
        this.updateTutorialStep();
    },

    // Update tutorial step
    updateTutorialStep() {
        const step = TUTORIAL_STEPS[this.tutorialStep];
        if (!step) {
            this.hideTutorial();
            return;
        }

        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.text;

        // Update step indicators
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.tutorialStep);
        });

        // Update next button text
        const nextBtn = document.getElementById('tutorial-next');
        nextBtn.textContent = this.tutorialStep === TUTORIAL_STEPS.length - 1 ? "Let's Go!" : 'Next';
    },

    // Next tutorial step
    nextTutorialStep() {
        this.tutorialStep++;
        if (this.tutorialStep >= TUTORIAL_STEPS.length) {
            this.hideTutorial();
            Auth.completeTutorial();
        } else {
            this.updateTutorialStep();
        }
    },

    // Hide tutorial
    hideTutorial() {
        document.getElementById('tutorial-overlay').style.display = 'none';
        Auth.completeTutorial();
    },

    // Show loading overlay
    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    },

    // Clear all form inputs and errors
    clearForms() {
        document.querySelectorAll('.auth-form input').forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        document.querySelectorAll('.form-error, .form-success').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    },

    // Show form error
    showFormError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    },

    // Validate email format
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate password (min 6 characters)
    isValidPassword(password) {
        return password.length >= 6;
    }
};

// App Settings Management
const AppSettings = {
    darkMode: false,
    timeFormat24: false,
    soundEnabled: true,
    highContrast: false,

    // Load settings from localStorage
    load() {
        try {
            const saved = localStorage.getItem('analogueTimeTellerSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.darkMode = settings.darkMode ?? false;
                this.timeFormat24 = settings.timeFormat24 ?? false;
                this.soundEnabled = settings.soundEnabled ?? true;
                this.highContrast = settings.highContrast ?? false;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }

        this.apply();
    },

    // Save settings to localStorage
    save() {
        try {
            localStorage.setItem('analogueTimeTellerSettings', JSON.stringify({
                darkMode: this.darkMode,
                timeFormat24: this.timeFormat24,
                soundEnabled: this.soundEnabled,
                highContrast: this.highContrast
            }));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    },

    // Apply settings to the UI
    apply() {
        document.body.classList.toggle('dark-mode', this.darkMode);
        document.body.classList.toggle('high-contrast', this.highContrast);
    },

    // Toggle dark mode
    toggleDarkMode(enabled) {
        this.darkMode = enabled;
        this.apply();
        this.save();
    },

    // Toggle 24-hour format
    toggleTimeFormat(enabled) {
        this.timeFormat24 = enabled;
        this.save();
    },

    // Toggle sound
    toggleSound(enabled) {
        this.soundEnabled = enabled;
        this.save();
    },

    // Toggle high contrast
    toggleHighContrast(enabled) {
        this.highContrast = enabled;
        this.apply();
        this.save();
    }
};
