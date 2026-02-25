// Firebase Configuration
// Replace with your own Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDemoKey12345678901234567890",
    authDomain: "analogue-time-teller.firebaseapp.com",
    projectId: "analogue-time-teller",
    storageBucket: "analogue-time-teller.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Level Configuration
const LEVELS = [
    {
        id: 1,
        name: "Beginner",
        description: "Read the hour hand position",
        showTime: 10,
        guessTime: 20,
        inputType: "multiple-choice",
        timeType: "hour-only",
        passScore: 700,
        roundCount: 10
    },
    {
        id: 2,
        name: "Easy",
        description: "Hours and half-hours",
        showTime: 8,
        guessTime: 15,
        inputType: "multiple-choice",
        timeType: "half-hour",
        passScore: 700,
        roundCount: 10
    },
    {
        id: 3,
        name: "Intermediate",
        description: "Minutes in 5-minute increments",
        showTime: 6,
        guessTime: 12,
        inputType: "input",
        timeType: "five-minute",
        passScore: 700,
        roundCount: 10
    },
    {
        id: 4,
        name: "Advanced",
        description: "Any minute position",
        showTime: 4,
        guessTime: 10,
        inputType: "input",
        timeType: "any-minute",
        passScore: 700,
        roundCount: 10
    },
    {
        id: 5,
        name: "Expert",
        description: "Include seconds",
        showTime: 3,
        guessTime: 8,
        inputType: "input",
        timeType: "with-seconds",
        passScore: 700,
        roundCount: 10
    }
];

// Scoring Configuration
const SCORING = {
    exactMatch: 100,
    minutePenalty: 10,
    speedBonus: 20,
    speedBonusThreshold: 0.5
};

// Tutorial Steps
const TUTORIAL_STEPS = [
    {
        title: "Welcome to Analogue Time Teller!",
        text: "Learn to read analogue clocks through fun challenges. Progress through 5 levels of increasing difficulty!"
    },
    {
        title: "How to Play",
        text: "A clock will appear for a few seconds. Memorize the time shown, then enter your answer before time runs out!"
    },
    {
        title: "Scoring & Progress",
        text: "Score points for correct answers and speed bonuses. Reach 700 points to unlock the next level. Good luck!"
    }
];

// Sound Effects (Base64 encoded simple beeps for demo)
const SOUNDS = {
    tick: null,
    correct: null,
    incorrect: null,
    levelUp: null
};

// App Settings Defaults
const DEFAULT_SETTINGS = {
    darkMode: false,
    timeFormat24: false,
    soundEnabled: true,
    highContrast: false
};

// Guest mode flag
let isGuestMode = false;

// Export configuration
window.AppConfig = {
    LEVELS,
    SCORING,
    TUTORIAL_STEPS,
    SOUNDS,
    DEFAULT_SETTINGS
};
