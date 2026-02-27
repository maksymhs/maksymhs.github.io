import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import GameCatRunner from './components/game/GameCatRunner.jsx'
import GamePlatformer from './components/game/GamePlatformer.jsx'
import GamePixelStrike from './components/game/GamePixelStrike.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/game_catrunner" element={<GameCatRunner />} />
        <Route path="/game_platformer" element={<GamePlatformer />} />
        <Route path="/game_pixelstrike" element={<GamePixelStrike />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
