import React, { useRef } from 'react'
import { Grass, Flowers, Fence, PixelCloud, FencedPond, GardenBench } from './Terrain'
import { PixelTree, VegetableGarden, ExteriorVegetation } from './Vegetation'
import { Roof, ExteriorDoor, ExteriorWalls } from './Buildings'
import NPCCharacter from './NPC'
import { PixelPig, PixelCow, PixelDonkey, PixelChicken, Butterfly } from './Animals'

export default function Outdoor({ view, playerRef, catRef, onNpcNear, npcInteractRef, currentLang }) {
  const pig1Ref = useRef()
  const pig2Ref = useRef()
  return (
    <group>
      <Grass />
      <Fence />
      <Flowers />
      <Roof />
      <ExteriorDoor view={view} />
      <ExteriorWalls />

      {/* Garden furniture */}
      <GardenBench position={[-7, 0, 5]} rotation={[0, Math.PI / 4, 0]} />
      <NPCCharacter position={[-7, 0.12, 5]} rotation={[0, Math.PI / 4, 0]} playerRef={playerRef} catRef={catRef} view={view} onNpcNear={onNpcNear} npcInteractRef={npcInteractRef} currentLang={currentLang} />
      <GardenBench position={[10, 0, -8]} rotation={[0, -Math.PI / 3, 0]} />
      <GardenBench position={[8, 0, 12]} rotation={[0, Math.PI, 0]} />

      {/* Vegetable garden */}
      <VegetableGarden position={[-15, 0, -15]} />

      {/* Fenced pond */}
      <FencedPond position={[15, 0, -15]} />

      {/* Clouds */}
      <PixelCloud position={[-4, 7, -14]} />
      <PixelCloud position={[5, 8, -16]} />
      <PixelCloud position={[0, 6.5, -12]} />
      <PixelCloud position={[-8, 7.5, -18]} />
      <PixelCloud position={[12, 7, -22]} />
      <PixelCloud position={[-15, 8, -25]} />
      <PixelCloud position={[-10, 6, -10]} />
      <PixelCloud position={[18, 7, 10]} />
      <PixelCloud position={[-12, 8, 15]} />
      <PixelCloud position={[8, 6.5, 20]} />

      {/* Trees all around the garden perimeter */}
      {/* Back side */}
      <PixelTree position={[-6, -0.1, -10]} />
      <PixelTree position={[-3, -0.1, -12]} trunkColor="#704828" leafColor="#38a038" />
      <PixelTree position={[2, -0.1, -11]} leafColor="#48b048" />
      <PixelTree position={[6, -0.1, -9]} trunkColor="#685020" leafColor="#30a030" />
      <PixelTree position={[10, -0.1, -13]} leafColor="#50b850" />
      <PixelTree position={[-10, -0.1, -14]} leafColor="#38a038" />
      <PixelTree position={[14, -0.1, -11]} trunkColor="#685020" leafColor="#48b048" />

      {/* Left side */}
      <PixelTree position={[-10, -0.1, -4]} leafColor="#48b848" />
      <PixelTree position={[-12, -0.1, 2]} trunkColor="#704828" leafColor="#38a038" />
      <PixelTree position={[-13, -0.1, 10]} leafColor="#48b048" />
      <PixelTree position={[-11, -0.1, -8]} trunkColor="#685020" leafColor="#50b050" />

      {/* Right side */}
      <PixelTree position={[10, -0.1, -5]} leafColor="#48b048" />
      <PixelTree position={[12, -0.1, 2]} trunkColor="#704828" leafColor="#38a838" />
      <PixelTree position={[14, -0.1, 8]} leafColor="#50b050" />
      <PixelTree position={[11, -0.1, 14]} trunkColor="#685020" leafColor="#40a040" />
      <PixelTree position={[9, -0.1, -12]} leafColor="#48b848" />

      {/* Front side */}
      <PixelTree position={[-8, -0.1, 10]} leafColor="#50b850" />
      <PixelTree position={[-4, -0.1, 12]} trunkColor="#704828" leafColor="#38a038" />
      <PixelTree position={[3, -0.1, 11]} leafColor="#48b048" />
      <PixelTree position={[7, -0.1, 13]} leafColor="#40a840" />
      <PixelTree position={[-12, -0.1, 14]} trunkColor="#685020" leafColor="#30a030" />

      {/* Far trees outside fence */}
      <PixelTree position={[-20, -0.1, -20]} leafColor="#389030" />
      <PixelTree position={[20, -0.1, -18]} leafColor="#409838" />
      <PixelTree position={[-18, -0.1, 18]} trunkColor="#604020" leafColor="#389030" />
      <PixelTree position={[18, -0.1, 20]} leafColor="#409038" />
      <PixelTree position={[0, -0.1, -22]} trunkColor="#604020" leafColor="#388830" />
      <PixelTree position={[-22, -0.1, 0]} leafColor="#409838" />
      <PixelTree position={[22, -0.1, 0]} leafColor="#389030" />
      <PixelTree position={[0, -0.1, 22]} trunkColor="#604020" leafColor="#409838" />

      {/* Exterior vegetation */}
      <ExteriorVegetation />

      {/* Pigs */}
      <PixelPig position={[20, 0, 28]} scale={1.3} facing={-0.6} groupRef={pig1Ref} siblingRef={pig2Ref} />
      <PixelPig position={[22, 0, 30]} scale={0.8} facing={0.8} groupRef={pig2Ref} siblingRef={pig1Ref} />

      {/* Cows */}
      <PixelCow position={[-28, 0, 8]} facing={0.5} />
      <PixelCow position={[28, 0, -6]} facing={Math.PI * 0.7} />

      {/* Donkey */}
      <PixelDonkey position={[-28, 0, -28]} facing={Math.PI * 0.3} />

      {/* Chickens */}
      <PixelChicken position={[-15, 0, -11]} color="#f0e8d0" facing={0.4} playerRef={playerRef} catRef={catRef} />
      <PixelChicken position={[-14, 0, -11.5]} color="#c87830" facing={-0.8} playerRef={playerRef} catRef={catRef} />
      <PixelChicken position={[-16, 0, -10.5]} color="#f0e0c0" facing={1.2} playerRef={playerRef} catRef={catRef} />
      <PixelChicken position={[-15.5, 0, -12]} color="#d09040" facing={-0.3} playerRef={playerRef} catRef={catRef} />
      <PixelChicken position={[-13.5, 0, -10.8]} color="#e8d8b8" facing={2.0} playerRef={playerRef} catRef={catRef} />

      {/* Butterflies */}
      <Butterfly startPos={[-8, 1.5, -8]} />
      <Butterfly startPos={[6, 2, -10]} />
      <Butterfly startPos={[-12, 1.8, 5]} />
      <Butterfly startPos={[10, 1.2, 8]} />
      <Butterfly startPos={[-5, 1.5, 12]} />
      <Butterfly startPos={[15, 1.8, -5]} />
      <Butterfly startPos={[-15, 1.3, -12]} />
      <Butterfly startPos={[3, 2, 15]} />
    </group>
  )
}
