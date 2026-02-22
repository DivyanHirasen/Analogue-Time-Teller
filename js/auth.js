// Authentication Module
const Auth = {
    currentUser: null,
    userData: null,

    // Initialize auth state listener
    init() {
        auth.onAuthStateChanged(async (user) => {
            if (user && !isGuestMode) {
                this.currentUser = user;
                await this.loadUserData();
                UI.showDashboard();
            } else if (!isGuestMode) {
                this.currentUser = null;
                this.userData = null;
                UI.showLanding();
            }
        });
    },

    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            UI.showLoading();
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update display name
            await user.updateProfile({ displayName });
            
            // Create user document in Firestore
            await this.createUserDocument(user.uid, email, displayName);
            
            // Send email verification
            await user.sendEmailVerification();
            
            this.currentUser = user;
            await this.loadUserData();
            
            UI.hideLoading();
            UI.showToast('Account created! Verification email sent.', 'success');
            
            // Show tutorial for new users
            if (this.userData && !this.userData.tutorialCompleted) {
                UI.showTutorial();
            }
            
            return { success: true };
        } catch (error) {
            UI.hideLoading();
            return { success: false, error: this.getErrorMessage(error) };
        }
    },

    // Login with email and password
    async login(email, password) {
        try {
            UI.showLoading();
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            await this.loadUserData();
            UI.hideLoading();
            return { success: true };
        } catch (error) {
            UI.hideLoading();
            return { success: false, error: this.getErrorMessage(error) };
        }
    },

    // Google Sign In
    async googleSignIn() {
        try {
            UI.showLoading();
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if user document exists, if not create one
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await this.createUserDocument(user.uid, user.email, user.displayName || 'Player');
                
                // Show tutorial for new users
                setTimeout(() => UI.showTutorial(), 500);
            }
            
            this.currentUser = user;
            await this.loadUserData();
            UI.hideLoading();
            return { success: true };
        } catch (error) {
            UI.hideLoading();
            if (error.code === 'auth/popup-closed-by-user') {
                return { success: false, error: 'Sign in cancelled' };
            }
            return { success: false, error: this.getErrorMessage(error) };
        }
    },

    // Send password reset email
    async sendPasswordReset(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    },

    // Logout
    async logout() {
        try {
            await auth.signOut();
            isGuestMode = false;
            this.currentUser = null;
            this.userData = null;
            UI.showLanding();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Enter guest mode
    enterGuestMode() {
        isGuestMode = true;
        this.currentUser = null;
        this.userData = {
            displayName: 'Guest',
            email: '',
            progress: {
                1: { completed: false, highScore: 0, unlocked: true },
                2: { completed: false, highScore: 0, unlocked: false },
                3: { completed: false, highScore: 0, unlocked: false },
                4: { completed: false, highScore: 0, unlocked: false },
                5: { completed: false, highScore: 0, unlocked: false }
            },
            totalPoints: 0,
            bestStreak: 0,
            tutorialCompleted: false
        };
        UI.showDashboard();
        UI.showToast('Playing as guest. Progress won\'t be saved.', 'info');
    },

    // Create user document in Firestore
    async createUserDocument(userId, email, displayName) {
        const userData = {
            userId,
            email,
            displayName,
            progress: {
                1: { completed: false, highScore: 0, unlocked: true },
                2: { completed: false, highScore: 0, unlocked: false },
                3: { completed: false, highScore: 0, unlocked: false },
                4: { completed: false, highScore: 0, unlocked: false },
                5: { completed: false, highScore: 0, unlocked: false }
            },
            totalPoints: 0,
            bestStreak: 0,
            tutorialCompleted: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(userId).set(userData);
        return userData;
    },

    // Load user data from Firestore
    async loadUserData() {
        if (!this.currentUser) return;

        try {
            const doc = await db.collection('users').doc(this.currentUser.uid).get();
            if (doc.exists) {
                this.userData = doc.data();
                
                // Update last login
                await db.collection('users').doc(this.currentUser.uid).update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Create user document if it doesn't exist
                this.userData = await this.createUserDocument(
                    this.currentUser.uid,
                    this.currentUser.email,
                    this.currentUser.displayName || 'Player'
                );
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },

    // Update user display name
    async updateDisplayName(newName) {
        if (!this.currentUser || isGuestMode) return { success: false };

        try {
            await this.currentUser.updateProfile({ displayName: newName });
            await db.collection('users').doc(this.currentUser.uid).update({
                displayName: newName
            });
            this.userData.displayName = newName;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Update user progress after completing a level
    async updateProgress(levelId, score) {
        if (isGuestMode) {
            // Update local data for guest mode
            const level = this.userData.progress[levelId];
            if (score > level.highScore) {
                level.highScore = score;
            }
            
            const levelConfig = LEVELS.find(l => l.id === levelId);
            if (score >= levelConfig.passScore) {
                level.completed = true;
                
                // Unlock next level
                if (levelId < 5) {
                    this.userData.progress[levelId + 1].unlocked = true;
                }
            }
            
            this.userData.totalPoints += score;
            return { success: true };
        }

        if (!this.currentUser) return { success: false };

        try {
            const level = this.userData.progress[levelId];
            const isNewHighScore = score > level.highScore;
            
            if (isNewHighScore) {
                level.highScore = score;
            }
            
            const levelConfig = LEVELS.find(l => l.id === levelId);
            const isPassing = score >= levelConfig.passScore;
            
            if (isPassing && !level.completed) {
                level.completed = true;
                
                // Unlock next level
                if (levelId < 5) {
                    this.userData.progress[levelId + 1].unlocked = true;
                }
            }
            
            this.userData.totalPoints += score;
            
            // Update Firestore
            await db.collection('users').doc(this.currentUser.uid).update({
                progress: this.userData.progress,
                totalPoints: this.userData.totalPoints
            });

            // Update leaderboard if it's a high score
            if (isNewHighScore) {
                await this.updateLeaderboard(levelId, score);
            }

            return { success: true, isNewHighScore, isPassing };
        } catch (error) {
            console.error('Error updating progress:', error);
            return { success: false, error: error.message };
        }
    },

    // Update leaderboard
    async updateLeaderboard(levelId, score) {
        if (isGuestMode || !this.currentUser) return;

        try {
            const leaderboardRef = db.collection('leaderboards').doc(`level_${levelId}`);
            const doc = await leaderboardRef.get();
            
            const entry = {
                odisplayName: this.userData.displayName,
                score,
                oduserId: this.currentUser.uid,
                oupdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!doc.exists) {
                await leaderboardRef.set({ scores: [entry] });
            } else {
                let scores = doc.data().scores || [];
                
                // Remove existing entry from same user
                scores = scores.filter(s => s.oduserId !== this.currentUser.uid);
                
                // Add new entry
                scores.push(entry);
                
                // Sort by score descending and keep top 10
                scores.sort((a, b) => b.score - a.score);
                scores = scores.slice(0, 10);
                
                await leaderboardRef.update({ scores });
            }
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    },

    // Get leaderboard for a level
    async getLeaderboard(levelId) {
        try {
            const doc = await db.collection('leaderboards').doc(`level_${levelId}`).get();
            if (doc.exists) {
                return doc.data().scores || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    // Mark tutorial as completed
    async completeTutorial() {
        if (isGuestMode) {
            this.userData.tutorialCompleted = true;
            return;
        }

        if (!this.currentUser) return;

        try {
            this.userData.tutorialCompleted = true;
            await db.collection('users').doc(this.currentUser.uid).update({
                tutorialCompleted: true
            });
        } catch (error) {
            console.error('Error completing tutorial:', error);
        }
    },

    // Get user-friendly error messages
    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
            'auth/user-disabled': 'This account has been disabled.'
        };

        return errorMessages[error.code] || error.message || 'An error occurred.';
    }
};
