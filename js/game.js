// Game Module - Gameplay Logic
const Game = {
    currentLevel: null,
    currentRound: 0,
    currentScore: 0,
    currentTime: null,
    roundResults: [],
    showTimer: null,
    guessTimer: null,
    guessStartTime: null,
    isShowPhase: true,
    gameActive: false,

    // Start a level
    startLevel(levelId) {
        const levelConfig = LEVELS.find(l => l.id === levelId);
        if (!levelConfig) return;

        this.currentLevel = levelConfig;
        this.currentRound = 0;
        this.currentScore = 0;
        this.roundResults = [];
        this.gameActive = true;

        // Update UI
        document.getElementById('current-round').textContent = '1';
        document.getElementById('current-score').textContent = '0';

        // Setup input type
        this.setupInputType();

        // Start first round
        this.startRound();
    },

    // Setup input type based on level
    setupInputType() {
        const multipleChoice = document.getElementById('multiple-choice-container');
        const timeInput = document.getElementById('time-input-container');
        const secondSeparator = document.getElementById('second-separator');
        const secondInput = document.getElementById('second-input');

        if (this.currentLevel.inputType === 'multiple-choice') {
            multipleChoice.style.display = 'grid';
            timeInput.style.display = 'none';
        } else {
            multipleChoice.style.display = 'none';
            timeInput.style.display = 'block';

            // Setup hour options
            const hourSelect = document.getElementById('hour-input');
            hourSelect.innerHTML = '<option value="">HH</option>';
            for (let i = 1; i <= 12; i++) {
                hourSelect.innerHTML += `<option value="${i}">${i}</option>`;
            }

            // Setup minute options based on level
            const minuteSelect = document.getElementById('minute-input');
            minuteSelect.innerHTML = '<option value="">MM</option>';
            
            if (this.currentLevel.timeType === 'five-minute') {
                for (let i = 0; i < 60; i += 5) {
                    minuteSelect.innerHTML += `<option value="${i}">${i.toString().padStart(2, '0')}</option>`;
                }
            } else {
                for (let i = 0; i < 60; i++) {
                    minuteSelect.innerHTML += `<option value="${i}">${i.toString().padStart(2, '0')}</option>`;
                }
            }

            // Show/hide seconds
            if (this.currentLevel.timeType === 'with-seconds') {
                secondSeparator.style.display = 'inline';
                secondInput.style.display = 'inline-block';
                secondInput.innerHTML = '<option value="">SS</option>';
                for (let i = 0; i < 60; i++) {
                    secondInput.innerHTML += `<option value="${i}">${i.toString().padStart(2, '0')}</option>`;
                }
            } else {
                secondSeparator.style.display = 'none';
                secondInput.style.display = 'none';
            }
        }
    },

    // Start a round
    startRound() {
        if (!this.gameActive) return;

        this.currentRound++;
        this.isShowPhase = true;

        // Update round display
        document.getElementById('current-round').textContent = this.currentRound;

        // Generate random time
        this.currentTime = Clock.generateTime(this.currentLevel.timeType);
        
        // Show seconds hand for expert level
        const showSeconds = this.currentLevel.timeType === 'with-seconds';
        
        // Update and show clock
        Clock.updateGameClock(
            this.currentTime.hours,
            this.currentTime.minutes,
            this.currentTime.seconds,
            showSeconds
        );
        Clock.show();

        // Hide guess container
        document.getElementById('guess-container').style.display = 'none';

        // Update timer text
        document.getElementById('timer-text').textContent = 'Memorize the time!';

        // Start show timer
        this.startShowTimer();
    },

    // Start the show phase timer
    startShowTimer() {
        const showTime = this.currentLevel.showTime * 1000;
        const timerBar = document.getElementById('timer-bar');
        let elapsed = 0;
        const interval = 50;

        timerBar.style.width = '100%';
        timerBar.classList.remove('warning', 'danger');

        this.showTimer = setInterval(() => {
            elapsed += interval;
            const percentage = 100 - (elapsed / showTime * 100);
            timerBar.style.width = `${percentage}%`;

            // Change color as time runs out
            if (percentage < 30) {
                timerBar.classList.add('danger');
            } else if (percentage < 50) {
                timerBar.classList.add('warning');
            }

            // Play tick sound
            if (AppSettings.soundEnabled && elapsed % 1000 === 0) {
                this.playTick();
            }

            if (elapsed >= showTime) {
                clearInterval(this.showTimer);
                this.startGuessPhase();
            }
        }, interval);
    },

    // Start the guess phase
    startGuessPhase() {
        this.isShowPhase = false;
        
        // Hide clock
        Clock.hide();

        // Show guess container
        document.getElementById('guess-container').style.display = 'block';

        // Update timer text
        document.getElementById('timer-text').textContent = 'What time was it?';

        // Setup multiple choice if needed
        if (this.currentLevel.inputType === 'multiple-choice') {
            this.setupMultipleChoice();
        } else {
            // Reset input fields
            document.getElementById('hour-input').value = '';
            document.getElementById('minute-input').value = '';
            document.getElementById('second-input').value = '';
        }

        // Record start time for speed bonus
        this.guessStartTime = Date.now();

        // Start guess timer
        this.startGuessTimer();
    },

    // Setup multiple choice options
    setupMultipleChoice() {
        const wrongAnswers = Clock.generateWrongAnswers(
            this.currentTime,
            this.currentLevel.timeType,
            3
        );

        // Combine correct answer with wrong answers
        const allAnswers = [this.currentTime, ...wrongAnswers];

        // Shuffle answers
        for (let i = allAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
        }

        // Update buttons
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach((btn, index) => {
            const answer = allAnswers[index];
            btn.textContent = Clock.formatTimeSimple(answer.hours, answer.minutes);
            btn.dataset.hours = answer.hours;
            btn.dataset.minutes = answer.minutes;
            btn.dataset.seconds = answer.seconds || 0;
            btn.classList.remove('selected', 'correct', 'incorrect');
            btn.disabled = false;
        });
    },

    // Start the guess phase timer
    startGuessTimer() {
        const guessTime = this.currentLevel.guessTime * 1000;
        const timerBar = document.getElementById('timer-bar');
        let elapsed = 0;
        const interval = 50;

        timerBar.style.width = '100%';
        timerBar.classList.remove('warning', 'danger');

        this.guessTimer = setInterval(() => {
            elapsed += interval;
            const percentage = 100 - (elapsed / guessTime * 100);
            timerBar.style.width = `${percentage}%`;

            if (percentage < 30) {
                timerBar.classList.add('danger');
            } else if (percentage < 50) {
                timerBar.classList.add('warning');
            }

            if (elapsed >= guessTime) {
                clearInterval(this.guessTimer);
                this.submitGuess(null); // Time's up, no guess
            }
        }, interval);
    },

    // Handle multiple choice selection
    handleChoiceClick(button) {
        if (!this.gameActive || this.isShowPhase) return;

        // Stop timer
        clearInterval(this.guessTimer);

        const guessedTime = {
            hours: parseInt(button.dataset.hours),
            minutes: parseInt(button.dataset.minutes),
            seconds: parseInt(button.dataset.seconds) || 0
        };

        // Visual feedback
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            const btnHours = parseInt(btn.dataset.hours);
            const btnMinutes = parseInt(btn.dataset.minutes);
            
            if (btnHours === this.currentTime.hours && btnMinutes === this.currentTime.minutes) {
                btn.classList.add('correct');
            } else if (btn === button && (btnHours !== this.currentTime.hours || btnMinutes !== this.currentTime.minutes)) {
                btn.classList.add('incorrect');
            }
        });

        // Process guess after brief delay
        setTimeout(() => {
            this.submitGuess(guessedTime);
        }, 500);
    },

    // Handle input submission
    handleInputSubmit() {
        if (!this.gameActive || this.isShowPhase) return;

        const hours = parseInt(document.getElementById('hour-input').value);
        const minutes = parseInt(document.getElementById('minute-input').value);
        let seconds = 0;

        if (this.currentLevel.timeType === 'with-seconds') {
            seconds = parseInt(document.getElementById('second-input').value) || 0;
        }

        if (!Clock.isValidTimeInput(hours, minutes, seconds)) {
            UI.showToast('Please enter a valid time', 'error');
            return;
        }

        // Stop timer
        clearInterval(this.guessTimer);

        const guessedTime = { hours, minutes, seconds };
        this.submitGuess(guessedTime);
    },

    // Submit guess and calculate score
    submitGuess(guessedTime) {
        const guessTimeMs = guessedTime ? Date.now() - this.guessStartTime : Infinity;
        const maxGuessTimeMs = this.currentLevel.guessTime * 1000;
        
        let roundScore = 0;
        let isCorrect = false;

        if (guessedTime) {
            const result = Clock.calculateScore(
                this.currentTime,
                guessedTime,
                guessTimeMs,
                maxGuessTimeMs,
                this.currentLevel.timeType === 'with-seconds'
            );
            roundScore = result.score;
            isCorrect = result.isExact;
        }

        // Update total score
        this.currentScore += roundScore;
        document.getElementById('current-score').textContent = this.currentScore;

        // Store round result
        this.roundResults.push({
            correctTime: { ...this.currentTime },
            guessedTime: guessedTime ? { ...guessedTime } : null,
            score: roundScore,
            isCorrect,
            timeMs: guessTimeMs
        });

        // Play sound
        if (AppSettings.soundEnabled) {
            if (isCorrect) {
                this.playCorrect();
            } else {
                this.playIncorrect();
            }
        }

        // Show feedback
        this.showFeedback(isCorrect, roundScore, guessedTime);
    },

    // Show feedback overlay
    showFeedback(isCorrect, score, guessedTime) {
        const overlay = document.getElementById('feedback-overlay');
        const icon = document.getElementById('feedback-icon');
        const title = document.getElementById('feedback-title');
        const message = document.getElementById('feedback-message');
        const points = document.getElementById('feedback-points');
        
        // Update feedback content
        if (isCorrect) {
            icon.className = 'feedback-icon correct';
            title.className = 'correct';
            title.textContent = 'Correct!';
        } else if (guessedTime) {
            icon.className = 'feedback-icon incorrect';
            title.className = 'incorrect';
            title.textContent = 'Not quite!';
        } else {
            icon.className = 'feedback-icon incorrect';
            title.className = 'incorrect';
            title.textContent = "Time's up!";
        }

        const showSeconds = this.currentLevel.timeType === 'with-seconds';
        const correctTimeStr = Clock.formatTimeSimple(
            this.currentTime.hours,
            this.currentTime.minutes,
            this.currentTime.seconds,
            showSeconds
        );
        message.textContent = `The time was ${correctTimeStr}`;

        if (score > 0) {
            points.textContent = `+${score} points`;
            points.style.color = 'var(--primary-color)';
        } else {
            points.textContent = '+0 points';
            points.style.color = 'var(--text-secondary)';
        }

        // Update feedback clock
        Clock.updateFeedbackClock(
            this.currentTime.hours,
            this.currentTime.minutes,
            this.currentTime.seconds,
            showSeconds
        );

        // Update second hand visibility in feedback clock
        const feedbackSecondHand = document.getElementById('feedback-second-hand');
        if (feedbackSecondHand) {
            feedbackSecondHand.style.display = showSeconds ? 'block' : 'none';
        }

        // Update button text
        const nextBtn = document.getElementById('next-round-btn');
        if (this.currentRound >= this.currentLevel.roundCount) {
            nextBtn.textContent = 'See Results';
        } else {
            nextBtn.textContent = 'Next Round';
        }

        // Show overlay
        overlay.style.display = 'flex';
    },

    // Continue to next round or show summary
    continueGame() {
        // Hide feedback
        document.getElementById('feedback-overlay').style.display = 'none';

        if (this.currentRound >= this.currentLevel.roundCount) {
            this.endLevel();
        } else {
            this.startRound();
        }
    },

    // End level and show summary
    async endLevel() {
        this.gameActive = false;

        // Update progress
        const result = await Auth.updateProgress(this.currentLevel.id, this.currentScore);

        // Show summary screen
        this.showSummary(result);
    },

    // Show level summary
    showSummary(updateResult) {
        UI.showScreen('summary-screen');

        // Calculate stars (out of 5)
        const maxScore = SCORING.exactMatch * this.currentLevel.roundCount + 
                        SCORING.speedBonus * this.currentLevel.roundCount;
        const percentage = this.currentScore / 1000; // Max 1000 points per level
        let stars = 0;
        if (percentage >= 0.9) stars = 5;
        else if (percentage >= 0.8) stars = 4;
        else if (percentage >= 0.7) stars = 3;
        else if (percentage >= 0.5) stars = 2;
        else if (percentage >= 0.3) stars = 1;

        // Update stars display
        const starsContainer = document.getElementById('stars-container');
        const starElements = starsContainer.querySelectorAll('.star');
        starElements.forEach((star, index) => {
            star.textContent = index < stars ? '★' : '☆';
            star.classList.toggle('filled', index < stars);
        });

        // Update score
        document.getElementById('summary-total-score').textContent = this.currentScore;

        // Update status
        const statusEl = document.getElementById('summary-status');
        const passed = this.currentScore >= this.currentLevel.passScore;
        statusEl.innerHTML = passed 
            ? '<span class="status-text">🎉 Level Passed!</span>'
            : '<span class="status-text">Keep practicing!</span>';
        statusEl.className = `summary-status ${passed ? 'passed' : 'failed'}`;

        // Show next level button if passed and not last level
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (passed && this.currentLevel.id < 5) {
            nextLevelBtn.style.display = 'inline-flex';
        } else {
            nextLevelBtn.style.display = 'none';
        }

        // Update breakdown
        const breakdownList = document.getElementById('breakdown-list');
        breakdownList.innerHTML = '';
        
        this.roundResults.forEach((result, index) => {
            const showSeconds = this.currentLevel.timeType === 'with-seconds';
            const correctStr = Clock.formatTimeSimple(
                result.correctTime.hours,
                result.correctTime.minutes,
                result.correctTime.seconds,
                showSeconds
            );
            
            let guessStr = '--';
            if (result.guessedTime) {
                guessStr = Clock.formatTimeSimple(
                    result.guessedTime.hours,
                    result.guessedTime.minutes,
                    result.guessedTime.seconds || 0,
                    showSeconds
                );
            }

            const item = document.createElement('div');
            item.className = `breakdown-item ${result.isCorrect ? 'correct' : 'incorrect'}`;
            item.innerHTML = `
                <span>Round ${index + 1}: ${correctStr}</span>
                <span>${guessStr} → ${result.score} pts</span>
            `;
            breakdownList.appendChild(item);
        });

        // Show new high score notification
        if (updateResult && updateResult.isNewHighScore) {
            UI.showToast('🏆 New High Score!', 'success');
        }
    },

    // Retry current level
    retryLevel() {
        if (this.currentLevel) {
            this.startLevel(this.currentLevel.id);
            UI.showScreen('gameplay-screen');
        }
    },

    // Go to next level
    goToNextLevel() {
        if (this.currentLevel && this.currentLevel.id < 5) {
            const nextLevelId = this.currentLevel.id + 1;
            UI.showLevelIntro(nextLevelId);
        }
    },

    // Cleanup timers
    cleanup() {
        if (this.showTimer) {
            clearInterval(this.showTimer);
            this.showTimer = null;
        }
        if (this.guessTimer) {
            clearInterval(this.guessTimer);
            this.guessTimer = null;
        }
        this.gameActive = false;
    },

    // Sound effects (simple beeps using Web Audio API)
    playTick() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            // Audio not supported
        }
    },

    playCorrect() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 523; // C5
            gain.gain.value = 0.2;
            osc.start();
            setTimeout(() => {
                osc.frequency.value = 659; // E5
            }, 100);
            setTimeout(() => {
                osc.frequency.value = 784; // G5
            }, 200);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            // Audio not supported
        }
    },

    playIncorrect() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.value = 200;
            gain.gain.value = 0.15;
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
            // Audio not supported
        }
    }
};
