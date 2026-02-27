import React from 'react'

// Room interior
import Floor from './room/Floor'
import Walls from './room/Walls'
import { Desk, Monitor, DeskItems, Keyboard, Mouse, CoffeeMug } from './room/Desk'
import Chair from './room/Chair'
import Bookshelf from './room/Bookshelf'
import Chest from './room/Chest'
import { Bed, Sofa, CoffeeTable, Nightstand, BedRug } from './room/Furniture'
import { Plant, Rug, LivingRug, WallClock, Poster, WallShelf, Curtain } from './room/Decor'
import { Lamp, CeilingLamp, FloorLamp, FairyLights } from './room/Lighting'
import WallArt from './room/WallArt'

// Outdoor & Cat
import Cat from './outdoor/Cat'
import Outdoor from './outdoor/Outdoor'

// Re-export outdoorCollide so Character.jsx can still import from './Room.jsx'
export { outdoorCollide } from './outdoor/collisions'

export default function Room({ onBookshelfClick, onChestClick, chestOpen, onBookClick, view, onGithubFrameClick, onLinkedinFrameClick, onBack, onCatClick, catRef, onControllerClick, onHeadphonesClick, onWindowClick, onBedClick, onSofaClick, onDoorClick, playerRef, onNpcNear, npcInteractRef, currentLang }) {
  return (
    <group>
      <Floor />
      <Walls onWindowClick={onWindowClick} windowOpen={view === 'outdoor'} onDoorClick={onDoorClick} view={view} />
      <Desk />
      <Monitor onClick={onControllerClick} view={view} />
      <DeskItems />
      <Keyboard />
      <Mouse />
      <Chair view={view} />
      <Bookshelf onClick={onBookshelfClick} onBookClick={onBookClick} interactive={view === 'bookshelf'} currentLang={currentLang} />
      <Chest onClick={onChestClick} open={chestOpen} />
      <Bed onClick={onBedClick} />
      <BedRug />
      <Sofa onClick={onSofaClick} />
      <Nightstand />
      <CoffeeTable onHeadphonesClick={onHeadphonesClick} />
      <CeilingLamp />
      <FloorLamp />
      <WallClock />
      <Poster />
      <FairyLights />
      <WallShelf />
      <Curtain position={[0, 2, -3.97]} />
      <Curtain position={[-3.97, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Plant position={[-3.3, 0, -1.5]} />
      <Plant position={[1.5, 0, -3.5]} />
      <Rug />
      <LivingRug />
      <CoffeeMug />
      <WallArt onGithubClick={onGithubFrameClick} onLinkedinClick={onLinkedinFrameClick} onBack={onBack} view={view} />
      <Lamp />
      <Cat onClick={onCatClick} catRef={catRef} view={view} />
      <Outdoor view={view} playerRef={playerRef} catRef={catRef} onNpcNear={onNpcNear} npcInteractRef={npcInteractRef} currentLang={currentLang} />
    </group>
  )
}
