# 🎮 Premium Tic-Tac-Toe

A beautiful, modern Tic-Tac-Toe game with glass-morphism UI, WebAudio sound effects, and CPU opponent.

## ✨ Features

- **Premium Glass UI** – Modern glass-morphism design with smooth animations
- **Sound Effects** – WebAudio synthesized sounds for every interaction (mute toggle included)
- **Two Play Modes** – Player vs Player or Player vs Smart CPU
- **Score Tracking** – Keep track of wins across multiple rounds
- **Fully Responsive** – Works perfectly on desktop, tablet, and mobile
- **Keyboard Friendly** – Play using Enter or Space keys
- **No Dependencies** – Pure HTML, CSS, and JavaScript

## 🎯 How to Play

1. Open the game in your browser
2. Click cells to place your mark (X goes first)
3. Win by getting three marks in a row (horizontal, vertical, or diagonal)
4. Toggle "Play vs CPU" to challenge the AI opponent
5. Use "Restart Round" to play again with the same opponent
6. Use "New Match" to reset scores and start fresh
7. Click the sound button (🔊) to mute/unmute audio

## 🚀 Deployment Options

### Option 1: Netlify (Recommended – Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub or email
3. Drag and drop the entire `tictactoe` folder onto Netlify
4. Your site goes live instantly with a free URL

### Option 2: GitHub Pages (Free)
1. Create a GitHub repository
2. Push all files to the main branch
3. Go to **Settings → Pages** and select "Deploy from a branch"
4. Select `main` branch and root folder
5. Your site will be live at `https://yourusername.github.io/repo-name`

### Option 3: Vercel (Free & Fast)
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project" and import your repository
4. Deploy instantly

### Option 4: Local Server (Development)
```bash
# With Python 3
python -m http.server 8000

# With Node.js (if installed)
npx http-server

# Then open http://localhost:8000
```

## 📁 File Structure

```
tictactoe/
├── index.html       # Main HTML
├── styles.css       # All styling (glass UI + animations)
├── script.js        # Game logic + WebAudio
└── README.md        # This file
```

## 🎮 Game Logic

- **Win Detection** – 8 possible winning combinations
- **CPU AI** – Prioritizes: win move → block opponent → center → corners → random
- **Draw Detection** – Ends when all 9 cells are filled
- **Score Persistence** – Scores remain until "New Match" is clicked

## 🔧 Customization

### Change Colors
Edit `:root` variables in `styles.css`:
```css
:root {
  --accent: #7c5cff;      /* Primary accent */
  --accent-2: #3fe0c6;    /* Secondary accent */
  --bg1: #0f1724;         /* Light background */
  --bg2: #071226;         /* Dark background */
}
```

### Adjust Volume
In `script.js`, find this line:
```javascript
masterGain.gain.value = 0.18;  // Change 0.18 to any value 0–1
```

## 🌐 Live Demo

**Coming soon!** Deploy using any option above and share your URL.

## 📝 License

Free to use and modify. Enjoy! 🎉

---

**Made with ❤️ using HTML, CSS, and JavaScript**
