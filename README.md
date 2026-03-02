<div align="center">

# 🎮 Maksym's Interactive 3D Portfolio

<img src="public/favicon.svg" width="80" alt="logo" />

**A voxel-art interactive portfolio built with React + Three.js**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-maksymhs.github.io-blue?style=for-the-badge)](https://maksymhs.github.io)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square&logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏠 **Cozy Room** | Fully interactive 3D room with desk, monitor, bookshelf, sofa, bed, and decorations |
| 🧑 **Voxel Character** | Animated character with multiple states: idle, dancing, sleeping, walking, seated |
| 🤖 **AI Chat** | Multilingual chat (EN/ES/RU) powered by OpenRouter with voice & text input |
| 📚 **Skills Bookshelf** | Click books to explore tech skills with detailed descriptions |
| 💼 **Experience Chest** | Treasure chest with floating scrolls showing work experience |
| 🌳 **Outdoor World** | Walk through a neighborhood with NPCs, animals, and buildings |
| 🎮 **Mini Games** | Built-in games playable on the in-room monitor |
| 🔫 **Pixel Strike** | FPS game with enemy AI, pathfinding, and mobile touch controls |
| 🐱 **Cat Runner** | Endless runner dodging chickens and collecting fish |
| 🔊 **Voice Interaction** | Speech recognition + TTS with male voice selection |

## 🎯 Interactive Actions

The AI chat can trigger real-time actions in the 3D scene:

```
💬 "Let's go outside!"     → 🚶 Character walks to the door and exits
💬 "Show me your skills"   → 📚 Camera zooms to the bookshelf
💬 "Let's dance!"          → 🎶 Character starts dancing with music
💬 "I want to play"        → 🎮 Camera focuses on the monitor
💬 "Time to sleep"         → 😴 Character walks to bed and sleeps
```

## 🏗️ Project Structure

```
src/
├── App.jsx                    # Main orchestrator
├── main.jsx                   # Router (/, /game_catrunner, /game_pixelstrike, /game_platformer)
├── i18n.js                    # Language detection (en/es/ru)
├── profileContext.js           # AI system prompt & profile data
│
├── components/
│   ├── Room.jsx               # Room orchestrator
│   ├── Character.jsx          # Character orchestrator
│   ├── ChatOverlay.jsx        # Chat UI & logic
│   ├── SplashScreen.jsx       # Loading screen
│   │
│   ├── room/                  # 🏠 Room interior
│   │   ├── bookshelf/         #   📚 Bookshelf, OpenBook, FloatingScrolls
│   │   ├── chest/             #   💼 Treasure chest
│   │   ├── Desk.jsx           #   Monitor, keyboard, mouse, coffee
│   │   ├── Furniture.jsx      #   Bed, sofa, tables
│   │   ├── Walls.jsx          #   Walls, window, door
│   │   ├── Decor.jsx          #   Plants, rugs, clock, curtains
│   │   ├── Lighting.jsx       #   Lamps, fairy lights
│   │   └── WallArt.jsx        #   GitHub & LinkedIn frames
│   │
│   ├── character/             # 🧑 Character states
│   │   ├── BodyParts.jsx      #   Voxel head, body, arms, legs
│   │   ├── DancingCharacter.jsx
│   │   ├── SleepingCharacter.jsx
│   │   ├── SofaSleepingCharacter.jsx
│   │   ├── OutdoorCharacter.jsx
│   │   └── ZzzEffect.jsx
│   │
│   ├── outdoor/               # 🌳 Outdoor world
│   │   ├── Terrain.jsx        #   Ground, paths, fences
│   │   ├── Vegetation.jsx     #   Trees, flowers, bushes
│   │   ├── Buildings.jsx      #   Houses, shops
│   │   ├── Animals.jsx        #   Chickens, butterflies
│   │   ├── NPC.jsx            #   Walking NPCs with dialogue
│   │   ├── Cat.jsx            #   The pet cat (Michi)
│   │   └── collisions.js      #   Collision detection
│   │
│   ├── chat/                  # 💬 Chat system
│   │   ├── chatI18n.js        #   i18n strings (en/es/ru)
│   │   └── chatUtils.jsx      #   AI, TTS, Telegram, commands
│   │
│   ├── game/                  # 🎮 Games
│   │   ├── GameSplash.jsx     #   Loading splash for games
│   │   ├── MiniGames.jsx      #   In-monitor mini games
│   │   ├── GameCatRunner.jsx  #   🐱 Cat Runner orchestrator
│   │   ├── catrunner/         #     Entities, environment, scene
│   │   ├── GamePixelStrike.jsx#   🔫 Pixel Strike orchestrator
│   │   ├── pixelstrike/       #     Map, enemies, weapons, FPS scene
│   │   └── GamePlatformer.jsx #   🏗️ Coming soon
│   │
│   └── common/                # 🧱 Shared components
│       ├── Vox.jsx            #   Voxel box helper
│       └── Pix.jsx            #   Pixel helper
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/maksymhs/maksymhs.github.io.git
cd maksymhs.github.io

# Install
npm install

# Run
npm run dev
```

## 🔑 Environment Variables

Create a `.env` file in the root:

```env
VITE_OPENROUTER_API_KEY=your-openrouter-key    # AI chat (openrouter.ai)
VITE_TELEGRAM_BOT_TOKEN=your-bot-token          # Chat tracking (optional)
VITE_TELEGRAM_CHAT_ID=your-chat-id              # Chat tracking (optional)
```

> Without an API key, the chat falls back to **local command matching** — it still recognizes keywords and triggers actions offline.

## 🛠️ Tech Stack

| Tech | Purpose |
|---|---|
| **React 18** | UI framework |
| **Three.js** / `@react-three/fiber` | 3D rendering |
| **@react-three/drei** | 3D helpers (controls, text, etc.) |
| **Vite 5** | Build tool |
| **OpenRouter API** | AI chat (GPT-oss-120b) |
| **Web Speech API** | Voice recognition & TTS |
| **Telegram Bot API** | Interaction tracking |
| **React Router** | Page routing for games |

## 📦 Build

```bash
npm run build    # Output in dist/
npm run preview  # Preview production build
```

## 📄 License

MIT © 2026 [Maksym](https://github.com/maksymhs)

---

<div align="center">
  <sub>Built with ❤️ and lots of voxels</sub>
</div>
