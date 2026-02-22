// Main Application Module
const App = {
    // Initialize the application
    init() {
        // Load settings
        AppSettings.load();

        // Initialize authentication
        Auth.init();

        // Setup event listeners
        this.setupEventListeners();

        // Check for reduced motion preference
        this.checkReducedMotion();

        console.log('Analogue Time Teller initialized');
    },

    // Setup all event listeners
    setupEventListeners() {
        // Landing screen buttons
        document.getElementById('show-login-btn').addEventListener('click', () => UI.showLogin());
        document.getElementById('show-signup-btn').addEventListener('click', () => UI.showSignup());
        document.getElementById('guest-mode-btn').addEventListener('click', () => Auth.enterGuestMode());

        // Back buttons
        document.getElementById('login-back-btn').addEventListener('click', () => UI.showLanding());
        document.getElementById('signup-back-btn').addEventListener('click', () => UI.showLanding());
        document.getElementById('forgot-back-btn').addEventListener('click', () => UI.showLogin());
        document.getElementById('level-intro-back-btn').addEventListener('click', () => UI.showDashboard());
        document.getElementById('profile-back-btn').addEventListener('click', () => UI.showDashboard());
        document.getElementById('settings-back-btn').addEventListener('click', () => UI.showDashboard());
        document.getElementById('leaderboard-back-btn').addEventListener('click', () => UI.showSettings());

        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            // Validation
            let valid = true;
            
            if (!UI.isValidEmail(email)) {
                UI.showFormError('login-email-error', 'Please enter a valid email');
                valid = false;
            } else {
                document.getElementById('login-email-error').textContent = '';
            }

            if (!password) {
                UI.showFormError('login-password-error', 'Password is required');
                valid = false;
            } else {
                document.getElementById('login-password-error').textContent = '';
            }

            if (!valid) return;

            const result = await Auth.login(email, password);
            if (!result.success) {
                UI.showFormError('login-form-error', result.error);
                document.getElementById('login-form-error').style.display = 'block';
            }
        });

        // Signup form
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;

            // Validation
            let valid = true;

            if (!name || name.length < 2) {
                UI.showFormError('signup-name-error', 'Name must be at least 2 characters');
                valid = false;
            } else {
                document.getElementById('signup-name-error').textContent = '';
            }

            if (!UI.isValidEmail(email)) {
                UI.showFormError('signup-email-error', 'Please enter a valid email');
                valid = false;
            } else {
                document.getElementById('signup-email-error').textContent = '';
            }

            if (!UI.isValidPassword(password)) {
                UI.showFormError('signup-password-error', 'Password must be at least 6 characters');
                valid = false;
            } else {
                document.getElementById('signup-password-error').textContent = '';
            }

            if (!valid) return;

            const result = await Auth.signUp(email, password, name);
            if (!result.success) {
                UI.showFormError('signup-form-error', result.error);
                document.getElementById('signup-form-error').style.display = 'block';
            }
        });

        // Google sign in
        document.getElementById('google-login-btn').addEventListener('click', async () => {
            const result = await Auth.googleSignIn();
            if (!result.success && result.error !== 'Sign in cancelled') {
                UI.showFormError('login-form-error', result.error);
                document.getElementById('login-form-error').style.display = 'block';
            }
        });

        document.getElementById('google-signup-btn').addEventListener('click', async () => {
            const result = await Auth.googleSignIn();
            if (!result.success && result.error !== 'Sign in cancelled') {
                UI.showFormError('signup-form-error', result.error);
                document.getElementById('signup-form-error').style.display = 'block';
            }
        });

        // Forgot password
        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            UI.showForgotPassword();
        });

        document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();

            if (!UI.isValidEmail(email)) {
                UI.showFormError('forgot-email-error', 'Please enter a valid email');
                return;
            }

            document.getElementById('forgot-email-error').textContent = '';
            const result = await Auth.sendPasswordReset(email);

            if (result.success) {
                const successEl = document.getElementById('forgot-success');
                successEl.textContent = 'Password reset email sent! Check your inbox.';
                successEl.style.display = 'block';
            } else {
                UI.showFormError('forgot-form-error', result.error);
                document.getElementById('forgot-form-error').style.display = 'block';
            }
        });

        // Header buttons
        document.getElementById('settings-btn').addEventListener('click', () => UI.showSettings());
        document.getElementById('profile-btn').addEventListener('click', () => UI.showProfile());

        // Level intro
        document.getElementById('start-level-btn').addEventListener('click', () => {
            const levelId = parseInt(document.getElementById('level-badge').textContent);
            UI.showScreen('gameplay-screen');
            Game.startLevel(levelId);
        });

        // Gameplay
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', () => Game.handleChoiceClick(btn));
        });

        document.getElementById('submit-guess-btn').addEventListener('click', () => {
            Game.handleInputSubmit();
        });

        // Allow Enter key to submit guess
        ['hour-input', 'minute-input', 'second-input'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    Game.handleInputSubmit();
                }
            });
        });

        // Feedback overlay
        document.getElementById('next-round-btn').addEventListener('click', () => {
            Game.continueGame();
        });

        // Summary screen
        document.getElementById('dashboard-btn').addEventListener('click', () => {
            Game.cleanup();
            UI.showDashboard();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            Game.retryLevel();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            Game.goToNextLevel();
        });

        // Profile screen
        document.getElementById('edit-name-btn').addEventListener('click', () => {
            document.getElementById('edit-name-form').style.display = 'flex';
            document.getElementById('new-display-name').value = Auth.userData.displayName || '';
            document.getElementById('new-display-name').focus();
        });

        document.getElementById('save-name-btn').addEventListener('click', async () => {
            const newName = document.getElementById('new-display-name').value.trim();
            if (newName.length < 2) {
                UI.showToast('Name must be at least 2 characters', 'error');
                return;
            }

            const result = await Auth.updateDisplayName(newName);
            if (result.success) {
                document.getElementById('profile-display-name').textContent = newName;
                document.getElementById('edit-name-form').style.display = 'none';
                UI.showToast('Name updated!', 'success');
            } else {
                UI.showToast('Failed to update name', 'error');
            }
        });

        document.getElementById('cancel-name-btn').addEventListener('click', () => {
            document.getElementById('edit-name-form').style.display = 'none';
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            Auth.logout();
        });

        // Settings toggles
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            AppSettings.toggleDarkMode(e.target.checked);
        });

        document.getElementById('time-format-toggle').addEventListener('change', (e) => {
            AppSettings.toggleTimeFormat(e.target.checked);
        });

        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            AppSettings.toggleSound(e.target.checked);
        });

        document.getElementById('high-contrast-toggle').addEventListener('change', (e) => {
            AppSettings.toggleHighContrast(e.target.checked);
        });

        document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
            UI.showLeaderboard(1);
        });

        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                UI.showLeaderboard(parseInt(btn.dataset.level));
            });
        });

        // Tutorial
        document.getElementById('tutorial-skip').addEventListener('click', () => {
            UI.hideTutorial();
        });

        document.getElementById('tutorial-next').addEventListener('click', () => {
            UI.nextTutorialStep();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Escape to close overlays
            if (e.key === 'Escape') {
                const feedbackOverlay = document.getElementById('feedback-overlay');
                if (feedbackOverlay.style.display === 'flex') {
                    Game.continueGame();
                }
                
                const tutorialOverlay = document.getElementById('tutorial-overlay');
                if (tutorialOverlay.style.display === 'flex') {
                    UI.hideTutorial();
                }
            }
        });

        // Handle browser back button
        window.addEventListener('popstate', () => {
            if (Game.gameActive) {
                Game.cleanup();
            }
            UI.showDashboard();
        });
    },

    // Check for reduced motion preference
    checkReducedMotion() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
            document.documentElement.style.setProperty('--transition-fast', '0.01ms');
            document.documentElement.style.setProperty('--transition-normal', '0.01ms');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Service Worker Registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
