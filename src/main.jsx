import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import GameSpace from './components/GameSpace.jsx'
import GamePlatformer from './components/GamePlatformer.jsx'
import GameRacing from './components/GameRacing.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/game_space" element={<GameSpace />} />
        <Route path="/game_platformer" element={<GamePlatformer />} />
        <Route path="/game_racing" element={<GameRacing />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
