<div align="center">

# Maksym's Interactive 3D Portfolio

<img src="public/favicon.svg" width="80" alt="logo" />

**A voxel-art interactive portfolio built with React + Three.js**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-maksym.site-blue?style=for-the-badge)](https://maksym.site)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square&logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

</div>

---

## Features

| Feature | Description |
|---|---|
| **Cozy Room** | Fully interactive 3D room with desk, monitor, bookshelf, sofa, bed, and decorations |
| **Voxel Character** | Animated character with multiple states: idle, dancing, sleeping, walking, seated |
| **AI Chat** | Multilingual chat (EN/ES/RU) powered by Claude with voice & text input |
| **Skills Bookshelf** | Click books to explore tech skills with detailed descriptions |
| **Experience Chest** | Treasure chest with floating scrolls showing work experience |
| **Outdoor World** | Walk through a neighborhood with NPCs, animals, and buildings |
| **Algorithm Lab** | Monitor card linking to [algorithm.maksym.site](https://algorithm.maksym.site) — sorting viz & patterns |
| **System Design Studio** | Monitor card linking to [design.maksym.site](https://design.maksym.site) — scalable system blueprints |
| **Voice Interaction** | Speech recognition + TTS with male voice selection |

## Interactive Actions

The AI chat can trigger real-time actions in the 3D scene:

```
"Let's go outside!"       → Character walks to the door and exits
"Show me your skills"     → Camera zooms to the bookshelf
"Let's dance!"            → Character starts dancing with music
"Show me your projects"   → Camera focuses on the monitor (Algorithm Lab / System Design)
"Time to sleep"           → Character walks to bed and sleeps
"Book a meeting"          → Clock opens Calendly
```

## Project Structure

```
src/
├── App.jsx                    # Main orchestrator
├── main.jsx                   # Router (single route /)
├── i18n.js                    # Language detection (en/es/ru)
├── profileContext.js          # AI system prompt & profile data
│
├── components/
│   ├── Room.jsx               # Room orchestrator
│   ├── Character.jsx          # Character orchestrator
│   ├── ChatOverlay.jsx        # Chat UI & logic
│   ├── SplashScreen.jsx       # Loading screen
│   │
│   ├── room/                  # Room interior
│   │   ├── bookshelf/         #   Bookshelf, OpenBook, FloatingScrolls
│   │   ├── chest/             #   Treasure chest
│   │   ├── Desk.jsx           #   Monitor (Algorithm Lab + System Design cards), keyboard, mouse
│   │   ├── Furniture.jsx      #   Bed, sofa, tables
│   │   ├── Walls.jsx          #   Walls, window, door
│   │   ├── Decor.jsx          #   Plants, rugs, clock, curtains
│   │   ├── Lighting.jsx       #   Lamps, fairy lights
│   │   └── WallArt.jsx        #   GitHub & LinkedIn frames
│   │
│   ├── character/             # Character states
│   │   ├── BodyParts.jsx      #   Voxel head, body, arms, legs
│   │   ├── DancingCharacter.jsx
│   │   ├── SleepingCharacter.jsx
│   │   ├── SofaSleepingCharacter.jsx
│   │   ├── OutdoorCharacter.jsx
│   │   └── ZzzEffect.jsx
│   │
│   ├── outdoor/               # Outdoor world
│   │   ├── Terrain.jsx        #   Ground, paths, fences
│   │   ├── Vegetation.jsx     #   Trees, flowers, bushes
│   │   ├── Buildings.jsx      #   Houses, shops
│   │   ├── Animals.jsx        #   Chickens, butterflies
│   │   ├── NPC.jsx            #   Walking NPCs with dialogue
│   │   ├── Cat.jsx            #   The pet cat (Michi)
│   │   └── collisions.js      #   Collision detection
│   │
│   ├── chat/                  # Chat system
│   │   ├── chatI18n.js        #   i18n strings (en/es/ru)
│   │   └── chatUtils.jsx      #   AI, TTS, Telegram, commands
│   │
│   └── common/                # Shared components
│       ├── Vox.jsx            #   Voxel box helper
│       └── Pix.jsx            #   Pixel helper
```

## Quick Start

```bash
git clone https://github.com/maksymhs/maksymhs.github.io.git
cd maksymhs.github.io
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the root:

```env
VITE_OPENROUTER_API_KEY=your-openrouter-key    # AI chat
VITE_TELEGRAM_BOT_TOKEN=your-bot-token          # Chat tracking (optional)
VITE_TELEGRAM_CHAT_ID=your-chat-id              # Chat tracking (optional)
```

> Without an API key, the chat falls back to **local command matching** — keywords still trigger scene actions offline.

## Tech Stack

| Tech | Purpose |
|---|---|
| **React 18** | UI framework |
| **Three.js** / `@react-three/fiber` | 3D rendering |
| **@react-three/drei** | 3D helpers (controls, text, etc.) |
| **Vite 5** | Build tool |
| **Claude API** (via Cloudflare Worker) | AI chat |
| **Web Speech API** | Voice recognition & TTS |
| **Telegram Bot API** | Interaction tracking |

## Subprojects

| Site | Repo | Status |
|---|---|---|
| [algorithm.maksym.site](https://algorithm.maksym.site) | [maksymhs/algorithm-lab](https://github.com/maksymhs/algorithm-lab) | Under construction |
| [design.maksym.site](https://design.maksym.site) | [maksymhs/system-design-studio](https://github.com/maksymhs/system-design-studio) | Under construction |

## Build

```bash
npm run build    # Output in dist/
npm run preview  # Preview production build
```

## License

MIT © 2026 [Maksym](https://github.com/maksymhs)

---

<div align="center">
  <sub>Built with care and lots of voxels</sub>
</div>
