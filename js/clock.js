// Clock Module - SVG Clock Rendering
const Clock = {
    // Generate random time based on level type
    generateTime(timeType) {
        let hours, minutes, seconds;
        
        switch (timeType) {
            case 'hour-only':
                hours = Math.floor(Math.random() * 12) + 1;
                minutes = 0;
                seconds = 0;
                break;
                
            case 'half-hour':
                hours = Math.floor(Math.random() * 12) + 1;
                minutes = Math.random() < 0.5 ? 0 : 30;
                seconds = 0;
                break;
                
            case 'five-minute':
                hours = Math.floor(Math.random() * 12) + 1;
                minutes = Math.floor(Math.random() * 12) * 5;
                seconds = 0;
                break;
                
            case 'any-minute':
                hours = Math.floor(Math.random() * 12) + 1;
                minutes = Math.floor(Math.random() * 60);
                seconds = 0;
                break;
                
            case 'with-seconds':
                hours = Math.floor(Math.random() * 12) + 1;
                minutes = Math.floor(Math.random() * 60);
                seconds = Math.floor(Math.random() * 60);
                break;
                
            default:
                hours = Math.floor(Math.random() * 12) + 1;
                minutes = 0;
                seconds = 0;
        }
        
        return { hours, minutes, seconds };
    },

    // Calculate hand angles
    calculateAngles(hours, minutes, seconds) {
        // Hour hand: 360° / 12 hours = 30° per hour
        // Plus additional rotation for minutes: 30° / 60 = 0.5° per minute
        const hourAngle = (hours % 12) * 30 + minutes * 0.5;
        
        // Minute hand: 360° / 60 minutes = 6° per minute
        const minuteAngle = minutes * 6;
        
        // Second hand: 360° / 60 seconds = 6° per second
        const secondAngle = seconds * 6;
        
        return { hourAngle, minuteAngle, secondAngle };
    },

    // Update clock hands on the game clock
    updateGameClock(hours, minutes, seconds, showSeconds = false) {
        const { hourAngle, minuteAngle, secondAngle } = this.calculateAngles(hours, minutes, seconds);
        
        const hourHand = document.getElementById('hour-hand');
        const minuteHand = document.getElementById('minute-hand');
        const secondHand = document.getElementById('second-hand');
        
        // Set rotation transform
        hourHand.setAttribute('transform', `rotate(${hourAngle}, 150, 150)`);
        minuteHand.setAttribute('transform', `rotate(${minuteAngle}, 150, 150)`);
        
        if (showSeconds && secondHand) {
            secondHand.style.display = 'block';
            secondHand.setAttribute('transform', `rotate(${secondAngle}, 150, 150)`);
        } else if (secondHand) {
            secondHand.style.display = 'none';
        }
    },

    // Update feedback clock
    updateFeedbackClock(hours, minutes, seconds, showSeconds = false) {
        const { hourAngle, minuteAngle, secondAngle } = this.calculateAngles(hours, minutes, seconds);
        
        const hourHand = document.getElementById('feedback-hour-hand');
        const minuteHand = document.getElementById('feedback-minute-hand');
        const secondHand = document.getElementById('feedback-second-hand');
        
        hourHand.setAttribute('transform', `rotate(${hourAngle}, 100, 100)`);
        minuteHand.setAttribute('transform', `rotate(${minuteAngle}, 100, 100)`);
        
        if (showSeconds && secondHand) {
            secondHand.style.display = 'block';
            secondHand.setAttribute('transform', `rotate(${secondAngle}, 100, 100)`);
        } else if (secondHand) {
            secondHand.style.display = 'none';
        }
    },

    // Show the game clock
    show() {
        const clock = document.getElementById('game-clock');
        clock.classList.remove('hidden');
    },

    // Hide the game clock
    hide() {
        const clock = document.getElementById('game-clock');
        clock.classList.add('hidden');
    },

    // Format time for display
    formatTime(hours, minutes, seconds, showSeconds = false, use24Hour = false) {
        let displayHours = hours;
        let period = '';
        
        if (!use24Hour) {
            period = hours >= 12 ? ' PM' : ' AM';
            displayHours = hours % 12;
            if (displayHours === 0) displayHours = 12;
        }
        
        const formattedHours = displayHours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        
        if (showSeconds) {
            const formattedSeconds = seconds.toString().padStart(2, '0');
            return `${formattedHours}:${formattedMinutes}:${formattedSeconds}${period}`;
        }
        
        return `${formattedHours}:${formattedMinutes}${period}`;
    },

    // Format time for simple display (no padding for hours)
    formatTimeSimple(hours, minutes, seconds = 0, showSeconds = false) {
        const formattedMinutes = minutes.toString().padStart(2, '0');
        
        if (showSeconds) {
            const formattedSeconds = seconds.toString().padStart(2, '0');
            return `${hours}:${formattedMinutes}:${formattedSeconds}`;
        }
        
        return `${hours}:${formattedMinutes}`;
    },

    // Generate wrong answers for multiple choice
    generateWrongAnswers(correctTime, timeType, count = 3) {
        const wrongAnswers = [];
        const { hours, minutes } = correctTime;
        
        while (wrongAnswers.length < count) {
            let wrongHours, wrongMinutes;
            
            if (timeType === 'hour-only') {
                // Generate different hour
                do {
                    wrongHours = Math.floor(Math.random() * 12) + 1;
                } while (wrongHours === hours);
                wrongMinutes = 0;
            } else if (timeType === 'half-hour') {
                // Either change hour or half-hour, or both
                const changeHour = Math.random() < 0.7;
                const changeMinute = Math.random() < 0.5;
                
                if (changeHour) {
                    do {
                        wrongHours = Math.floor(Math.random() * 12) + 1;
                    } while (wrongHours === hours);
                } else {
                    wrongHours = hours;
                }
                
                if (changeMinute || !changeHour) {
                    wrongMinutes = minutes === 0 ? 30 : 0;
                } else {
                    wrongMinutes = minutes;
                }
            } else {
                // For higher levels (shouldn't use multiple choice but fallback)
                do {
                    wrongHours = Math.floor(Math.random() * 12) + 1;
                    wrongMinutes = Math.floor(Math.random() * 12) * 5;
                } while (wrongHours === hours && wrongMinutes === minutes);
            }
            
            const wrongTime = { hours: wrongHours, minutes: wrongMinutes, seconds: 0 };
            const wrongTimeStr = this.formatTimeSimple(wrongHours, wrongMinutes);
            
            // Check if this answer is not already in the list and not the correct answer
            const isDuplicate = wrongAnswers.some(ans => 
                ans.hours === wrongHours && ans.minutes === wrongMinutes
            );
            
            if (!isDuplicate) {
                wrongAnswers.push(wrongTime);
            }
        }
        
        return wrongAnswers;
    },

    // Calculate score based on guess accuracy
    calculateScore(correctTime, guessedTime, guessTimeMs, maxGuessTimeMs, includesSeconds = false) {
        let score = 0;
        let isExact = false;
        
        const hourDiff = Math.abs(correctTime.hours - guessedTime.hours);
        const minuteDiff = Math.abs(correctTime.minutes - guessedTime.minutes);
        
        // Handle 12-hour wrap around
        const adjustedHourDiff = Math.min(hourDiff, 12 - hourDiff);
        
        // Check for exact match
        if (adjustedHourDiff === 0 && minuteDiff === 0) {
            if (includesSeconds) {
                const secondDiff = Math.abs(correctTime.seconds - guessedTime.seconds);
                if (secondDiff <= 5) {
                    // Allow 5 second tolerance for expert level
                    score = SCORING.exactMatch;
                    isExact = secondDiff === 0;
                } else {
                    score = Math.max(0, SCORING.exactMatch - secondDiff);
                }
            } else {
                score = SCORING.exactMatch;
                isExact = true;
            }
        } else {
            // Calculate total minute difference
            let totalMinuteDiff = adjustedHourDiff * 60 + minuteDiff;
            
            // Deduct points based on difference
            score = Math.max(0, SCORING.exactMatch - (totalMinuteDiff * SCORING.minutePenalty));
        }
        
        // Speed bonus: if answered in less than half the time
        const halfTime = maxGuessTimeMs * SCORING.speedBonusThreshold;
        if (guessTimeMs < halfTime && score > 0) {
            score += SCORING.speedBonus;
        }
        
        return { score, isExact };
    },

    // Parse time string input
    parseTimeInput(hourStr, minuteStr, secondStr = '0') {
        const hours = parseInt(hourStr, 10) || 0;
        const minutes = parseInt(minuteStr, 10) || 0;
        const seconds = parseInt(secondStr, 10) || 0;
        
        return {
            hours: Math.min(12, Math.max(1, hours)),
            minutes: Math.min(59, Math.max(0, minutes)),
            seconds: Math.min(59, Math.max(0, seconds))
        };
    },

    // Validate time input
    isValidTimeInput(hours, minutes, seconds = 0) {
        return (
            !isNaN(hours) && hours >= 1 && hours <= 12 &&
            !isNaN(minutes) && minutes >= 0 && minutes <= 59 &&
            !isNaN(seconds) && seconds >= 0 && seconds <= 59
        );
    }
};
