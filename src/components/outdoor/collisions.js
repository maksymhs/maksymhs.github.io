// Furniture bounding boxes [minX, maxX, minZ, maxZ] with padding for cat
export const obstacles = [
  [-1.4, 1.4, -2.5, -1.1],   // Desk
  [-0.5, 0.5, -1.1, -0.1],   // Chair
  [1.7, 3.9, 1.2, 3.9],      // Bed
  [-3.4, -2.2, 1.4, 3.6],    // Sofa
  [3.2, 4.0, -2.1, -0.9],    // Bookshelf
  [-3.8, -2.5, -3.8, -2.5],  // Chest (diagonal in corner)
  [-3.6, -3.0, -1.8, -1.2],  // Plant (left wall)
  [1.2, 1.8, -3.8, -3.2],   // Plant (back wall)
  [-2.5, -1.1, 2.1, 2.9],    // Coffee table
  [-3.7, -3.1, 0.8, 1.6],    // Floor lamp
  [1.2, 2.0, 3.0, 3.8],      // Nightstand
]

export function isInsideObstacle(x, z) {
  for (const [x1, x2, z1, z2] of obstacles) {
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) return true
  }
  return false
}

// Wall colliders — ALWAYS enforced (even when airborne / jumping)
const wallColliders = [
  [-4.5, 4.5, -4.5, -3.8],  // back wall
  [-4.5, 4.5, 3.8, 4.5],    // front wall
  [-4.5, -3.8, -4.5, 4.5],  // left wall
  [3.8, 4.5, -4.5, 4.5],    // right wall
]

// Other colliders — only enforced near ground (can jump over)
const groundColliders = [
  // Trees — back side (radius ~0.6)
  ...[ [-6,-10],[-3,-12],[2,-11],[6,-9],[10,-13],[-10,-14],[14,-11] ]
    .map(([x,z]) => [x-0.6, x+0.6, z-0.6, z+0.6]),
  // Trees — left side
  ...[ [-10,-4],[-12,2],[-13,10],[-11,-8] ]
    .map(([x,z]) => [x-0.6, x+0.6, z-0.6, z+0.6]),
  // Trees — right side
  ...[ [10,-5],[12,2],[14,8],[11,14],[9,-12] ]
    .map(([x,z]) => [x-0.6, x+0.6, z-0.6, z+0.6]),
  // Trees — front side
  ...[ [-8,10],[-4,12],[3,11],[7,13],[-12,14] ]
    .map(([x,z]) => [x-0.6, x+0.6, z-0.6, z+0.6]),
  // Trees — far outside fence
  ...[ [-20,-20],[20,-18],[-18,18],[18,20],[0,-22],[-22,0],[22,0],[0,22] ]
    .map(([x,z]) => [x-0.6, x+0.6, z-0.6, z+0.6]),
  // Benches
  [-7.6, -6.4, 4.4, 5.6],
  [9.4, 10.6, -8.6, -7.4],
  [7.4, 8.6, 11.4, 12.6],
  // Vegetable garden fence (center -15, -15)
  [-17.8, -12.2, -17.25, -17.05],  // back fence
  [-17.8, -15.5, -12.95, -12.75],  // front fence left
  [-14.5, -12.2, -12.95, -12.75],  // front fence right
  [-17.8, -17.6, -17.25, -12.75],  // left fence
  [-12.4, -12.2, -17.25, -12.75],  // right fence
]

function collideList(x, z, prevX, prevZ, list) {
  const r = 0.25
  for (const [x1, x2, z1, z2] of list) {
    if (x + r > x1 && x - r < x2 && z + r > z1 && z - r < z2) {
      const inX = prevX + r > x1 && prevX - r < x2
      const inZ = prevZ + r > z1 && prevZ - r < z2
      if (!inX) x = prevX
      if (!inZ) z = prevZ
      if (x + r > x1 && x - r < x2 && z + r > z1 && z - r < z2) {
        x = prevX; z = prevZ
      }
    }
  }
  return [x, z]
}

export function outdoorCollide(x, z, prevX, prevZ, airborne) {
  // Walls always block
  ;[x, z] = collideList(x, z, prevX, prevZ, wallColliders)
  // Ground obstacles only block near ground
  if (!airborne) {
    ;[x, z] = collideList(x, z, prevX, prevZ, groundColliders)
  }
  return [x, z]
}
