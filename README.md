# Analogue Time Teller

An educational web application designed to help users learn and practice reading analogue clocks. Features progressive difficulty levels, Firebase authentication, and score tracking.

## Features

### Core Features
- **5 Progressive Levels**: From basic hour reading to precise second estimations
- **Real-time Scoring**: Points based on accuracy and speed
- **Progress Tracking**: Unlock levels sequentially and track high scores
- **User Profiles**: Save progress, view statistics, and compete on leaderboards

### Authentication
- Email/password signup and login
- Google OAuth sign-in
- Guest mode (Level 1 only, no progress saving)
- Password reset functionality

### Gameplay
- SVG-based analogue clock with smooth animations
- Multiple choice (Levels 1-2) and manual input (Levels 3-5)
- Countdown timers for memorizing and guessing
- Immediate feedback with visual indicators
- Speed bonuses for quick answers

### Levels
| Level | Name | Time Type | Show Time | Guess Time |
|-------|------|-----------|-----------|------------|
| 1 | Beginner | Hours only | 10s | 20s |
| 2 | Easy | Half-hours | 8s | 15s |
| 3 | Intermediate | 5-min increments | 6s | 12s |
| 4 | Advanced | Any minute | 4s | 10s |
| 5 | Expert | With seconds | 3s | 8s |

### Accessibility
- WCAG 2.1 compliant
- Keyboard navigation support
- High contrast mode
- Screen reader compatible
- Reduced motion support

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: Custom CSS with CSS Variables
- **Fonts**: Google Fonts (Roboto)

## Setup

### Prerequisites
- A Firebase project with Authentication and Firestore enabled
- A web server (local or hosted)

### Configuration

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable Authentication methods:
   - Email/Password
   - Google Sign-In

3. Create a Firestore database

4. Update `js/config.js` with your Firebase configuration:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

5. Set up Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /leaderboards/{levelId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Running Locally

Option 1: Using Python's built-in server
```bash
cd Analogue-Time-Teller
python -m http.server 8000
```

Option 2: Using Node.js
```bash
npx serve .
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
Analogue-Time-Teller/
├── index.html          # Main HTML file
├── sw.js               # Service Worker for offline support
├── css/
│   └── styles.css      # All styles with CSS variables
└── js/
    ├── config.js       # Firebase config and level settings
    ├── auth.js         # Authentication module
    ├── clock.js        # Clock rendering and time calculations
    ├── game.js         # Gameplay mechanics
    ├── ui.js           # UI management and screen navigation
    └── app.js          # Main application entry point
```

## Scoring System

- **Exact Match**: 100 points
- **Minute Penalty**: -10 points per minute off
- **Speed Bonus**: +20 points if answered in under half the time
- **Pass Threshold**: 700 points to unlock next level
- **Maximum Score**: 1000+ points per level (with speed bonuses)

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome for Android)

## License

MIT License - Feel free to use and modify for educational purposes.
