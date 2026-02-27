// === Navigation graph for enemy AI pathfinding ===

export const NAV_NODES = [
  // T Spawn (0-3)
  { x: 0, z: 34, y: 0 },
  { x: -6, z: 32, y: 0 },
  { x: 6, z: 32, y: 0 },
  { x: 0, z: 28, y: 0 },
  // Long A corridor (4-9)
  { x: -15, z: 25, y: 0 },
  { x: -26, z: 20, y: 0 },
  { x: -26, z: 10, y: 0 },
  { x: -26, z: 0, y: 0 },
  { x: -26, z: -10, y: 0 },
  { x: -26, z: -18, y: 0 },
  // A site (10-14)
  { x: -22, z: -24, y: 1 },
  { x: -25, z: -26, y: 1 },
  { x: -18, z: -22, y: 1 },
  { x: -14, z: -28, y: 0.5 },
  { x: -27, z: -28, y: 1 },
  // Catwalk / A short (15-17)
  { x: -10, z: -12, y: 2 },
  { x: -10, z: -18, y: 2 },
  { x: -10, z: -23, y: 1.5 },
  // Mid (18-23)
  { x: -3, z: 14, y: 0 },
  { x: 0, z: 10, y: 0 },
  { x: 0, z: 5, y: 0 },
  { x: 0, z: 0, y: 0 },
  { x: 0, z: -5, y: 0 },
  { x: 3, z: -8, y: 0 },
  // B tunnels (24-27)
  { x: 12, z: 26, y: 0 },
  { x: 16, z: 22, y: 0 },
  { x: 16, z: 14, y: 0 },
  { x: 16, z: 6, y: 0 },
  // B site (28-32)
  { x: 20, z: -10, y: 0 },
  { x: 18, z: -16, y: 0 },
  { x: 24, z: -18, y: 1 },
  { x: 28, z: -20, y: 1 },
  { x: 30, z: -16, y: 0 },
  // CT spawn (33-36)
  { x: 0, z: -33, y: 0 },
  { x: -5, z: -34, y: 0 },
  { x: 5, z: -33, y: 0 },
  { x: 0, z: -30, y: 0 },
  // Connector mid to B (37-38)
  { x: 11, z: -2, y: 0 },
  { x: 11, z: -6, y: 0 },
  // Extra: transitions (39-42)
  { x: -6, z: -10, y: 0 },
  { x: -14, z: -20, y: 0 },
  { x: 8, z: 22, y: 0 },
  { x: -10, z: 25, y: 0 },
]

// Edge connections — bidirectional
const NAV_EDGES = [
  [0,1],[0,2],[0,3],[1,3],[2,3],
  [3,18],[3,42],[3,41],[2,41],
  [42,4],[4,5],[5,6],[6,7],[7,8],[8,9],
  [9,13],[13,10],[13,12],[10,11],[10,12],[11,14],[10,14],
  [39,15],[15,16],[16,17],[17,12],[17,10],
  [21,39],[22,39],
  [12,40],[40,33],[40,34],
  [18,19],[19,20],[20,21],[21,22],[22,23],
  [23,36],[36,33],[36,34],[36,35],[33,34],[33,35],
  [41,24],[24,25],[25,26],[26,27],
  [27,28],[28,29],[29,30],[30,31],[31,32],[29,32],[28,37],
  [20,37],[37,38],[38,28],
  [35,38],[35,28],
]

// Build adjacency list
export const NAV_ADJ = NAV_NODES.map(() => [])
for (const [a, b] of NAV_EDGES) {
  NAV_ADJ[a].push(b)
  NAV_ADJ[b].push(a)
}

// BFS to find path between two node indices
export function navFindPath(fromIdx, toIdx) {
  if (fromIdx === toIdx) return [toIdx]
  const visited = new Set([fromIdx])
  const queue = [[fromIdx]]
  while (queue.length > 0) {
    const path = queue.shift()
    const curr = path[path.length - 1]
    for (const nb of NAV_ADJ[curr]) {
      if (nb === toIdx) return [...path, nb]
      if (!visited.has(nb)) {
        visited.add(nb)
        queue.push([...path, nb])
      }
    }
  }
  return null
}

// Find nearest nav node to a position
export function nearestNavNode(x, z) {
  let best = 0, bestD = Infinity
  for (let i = 0; i < NAV_NODES.length; i++) {
    const dx = NAV_NODES[i].x - x, dz = NAV_NODES[i].z - z
    const d = dx * dx + dz * dz
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

export function randomNavNode() {
  return Math.floor(Math.random() * NAV_NODES.length)
}
