// === DUST2 MAP DATA ===
// Orientation: T Spawn south (+Z~35), CT Spawn north (-Z~-35), A Site NW, B Site NE
// Scale: ~80x80 units playable area
export const W = 4.5 // wall height
export const T = 1   // wall thickness

export const MAP_WALLS = [
  // ============ OUTER BOUNDARY ============
  { pos: [0, W/2, -40], size: [82, W, T] },    // north
  { pos: [0, W/2, 40], size: [82, W, T] },     // south
  { pos: [-41, W/2, 0], size: [T, W, 80] },    // west
  { pos: [41, W/2, 0], size: [T, W, 80] },     // east

  // ============ T SPAWN AREA (south, z=28..38) ============
  { pos: [-12, W/2, 28], size: [T, W, 6] },
  { pos: [12, W/2, 30], size: [T, W, 10] },
  { pos: [-20, W/2, 25], size: [16, W, T] },

  // ============ LONG A (west side, x=-28..-14, z=25..-20) ============
  { pos: [-30, W/2, 5], size: [T, W, 40] },
  { pos: [-22, W/2, 15], size: [T, W, 20] },
  { pos: [-22, W/2, -12], size: [T, W, 16] },
  { pos: [-26, W/2, 5], size: [T, W, 3] },
  { pos: [-24, W/2, 5], size: [T, W, 3] },
  { pos: [-26, W/2, -20], size: [8, W, T] },

  // ============ A SITE (NW area, x=-30..-14, z=-20..-32) ============
  { pos: [-22, W/2, -32], size: [18, W, T] },
  { pos: [-31, W/2, -26], size: [T, W, 12] },
  { pos: [-22, 0.5, -26], size: [10, 1, 8] },
  { pos: [-14, W/2, -30], size: [T, W, 4] },
  { pos: [-14, 0.25, -28], size: [4, 0.5, 4] },
  { pos: [-25, 1, -24], size: [2, 2, 2] },
  { pos: [-19, 0.75, -22], size: [1.5, 1.5, 1.5] },
  { pos: [-27, 1.5, -28], size: [2, 3, 2] },
  { pos: [-17, 0.6, -28], size: [1.2, 1.2, 1.2] },

  // ============ A SHORT / CATWALK (x=-14..-6, z=-10..-24) ============
  { pos: [-14, W/2, -15], size: [T, W, 18] },
  { pos: [-6, W/2, -17], size: [T, W, 14] },
  { pos: [-10, 1, -17], size: [8, 2, 14] },
  { pos: [-10, 0.75, -24], size: [8, 1.5, 2] },
  { pos: [-10, 0.4, -25.5], size: [8, 0.8, 2] },

  // ============ MID (center, x=-8..8, z=-10..18) ============
  { pos: [-6, W/2, 2], size: [T, W, 24] },
  { pos: [8, W/2, 2], size: [T, W, 24] },
  { pos: [-3, W/2, -8], size: [T, W, 4] },
  { pos: [3, W/2, -8], size: [T, W, 4] },
  { pos: [0, 0.75, 0], size: [1.5, 1.5, 1.5] },
  { pos: [4, 0.75, 5], size: [1.5, 1.5, 1.5] },
  { pos: [-3, 0.75, -4], size: [1.5, 1.5, 1.5] },
  { pos: [0, 1.5, -5], size: [2, 3, 2] },

  // ============ B TUNNELS (east side, x=12..26, z=10..28) ============
  { pos: [12, W/2, 22], size: [T, W, 12] },
  { pos: [20, W/2, 22], size: [T, W, 12] },
  { pos: [16, W/2, 16], size: [8, W, T] },
  { pos: [20, W/2, 10], size: [T, W, 12] },
  { pos: [12, W/2, 8], size: [T, W, 8] },
  { pos: [16, 0.75, 20], size: [1.5, 1.5, 1.5] },
  { pos: [14, 0.75, 12], size: [1.5, 1.5, 1.5] },

  // ============ B SITE (NE area, x=14..34, z=-8..-28) ============
  { pos: [14, W/2, -8], size: [T, W, 8] },
  { pos: [34, W/2, -18], size: [T, W, 24] },
  { pos: [24, W/2, -30], size: [20, W, T] },
  { pos: [14, W/2, -22], size: [T, W, 16] },
  { pos: [24, 0.5, -20], size: [12, 1, 8] },
  { pos: [20, W/2, -8], size: [4, W, T] },
  { pos: [30, W/2, -8], size: [8, W, T] },
  { pos: [18, 1, -18], size: [2, 2, 2] },
  { pos: [28, 0.75, -22], size: [1.5, 1.5, 1.5] },
  { pos: [30, 1.5, -16], size: [2, 3, 2] },
  { pos: [22, 0.75, -12], size: [1.5, 1.5, 1.5] },
  { pos: [16, 0.6, -14], size: [1.2, 1.2, 1.2] },
  { pos: [32, 0.6, -24], size: [1.2, 1.2, 1.2] },

  // ============ CT SPAWN (north center, x=-10..10, z=-30..-38) ============
  { pos: [-10, W/2, -32], size: [T, W, 8] },
  { pos: [10, W/2, -32], size: [T, W, 8] },
  { pos: [0, W/2, -36], size: [20, W, T] },
  { pos: [-12, W/2, -32], size: [4, W, T] },
  { pos: [12, W/2, -30], size: [4, W, T] },
  { pos: [-5, 0.75, -34], size: [1.5, 1.5, 1.5] },
  { pos: [5, 0.75, -33], size: [1.5, 1.5, 1.5] },

  // ============ CONNECTOR: MID TO B ============
  { pos: [8, W/2, -4], size: [T, W, 8] },
  { pos: [14, W/2, -4], size: [T, W, 8] },

  // ============ PIT (below A site, x=-30..-22, z=-20..-14) ============
  { pos: [-30, W/2, -14], size: [T, W, 4] },
  { pos: [-22, W/2, -20], size: [T, W, 2] },
]

// Ground height zones — platforms and ramps
export const ELEVATED_ZONES = [
  { x: [-27, -17], z: [-30, -22], y: 1 },
  { x: [-16, -12], z: [-30, -26], y: 0.5, ramp: true },
  { x: [-14, -6], z: [-24, -10], y: 2 },
  { x: [-14, -6], z: [-26, -24], y: 1.5, ramp: true },
  { x: [-14, -6], z: [-27, -26], y: 0.8, ramp: true },
  { x: [18, 30], z: [-24, -16], y: 1 },
  { x: [16, 18], z: [-24, -16], y: 0.5, ramp: true },
  { x: [-1, 3], z: [-7, -3], y: 0 },
]

export function getGroundY(x, z, playerFeetY) {
  let maxY = 0
  for (const zone of ELEVATED_ZONES) {
    if (x >= zone.x[0] && x <= zone.x[1] && z >= zone.z[0] && z <= zone.z[1]) {
      if (zone.y > maxY) maxY = zone.y
    }
  }
  const radius = 0.35
  for (const w of MAP_WALLS) {
    const [wx, wy, wz] = w.pos
    const [sx, sy, sz] = w.size
    const wallTop = wy + sy / 2
    if (sy >= W && (sx > 40 || sz > 40)) continue
    const hx = sx / 2 + radius, hz = sz / 2 + radius
    if (x > wx - hx && x < wx + hx && z > wz - hz && z < wz + hz) {
      if (playerFeetY !== undefined) {
        if (playerFeetY >= wallTop - 0.6 && wallTop > maxY) {
          maxY = wallTop
        }
      } else {
        if (wallTop > maxY) maxY = wallTop
      }
    }
  }
  return maxY
}

// Detect wall type
export function getWallType(w) {
  const [sx, sy, sz] = w.size
  if (sx <= 1.3 && sz <= 1.3 && sy <= 1.3) return 'barrel'
  if (sy <= 2 && sx <= 2.5 && sz <= 2.5) return 'crate'
  if (sy === 3 && sx <= 2.5) return 'tallcrate'
  if (sy <= 1.1) return 'platform'
  if (sy <= 2) return 'stairs'
  return 'wall'
}

export function getWallColor(i, w) {
  const t = getWallType(w)
  if (t === 'barrel') return '#887858'
  if (t === 'platform') return '#888068'
  if (t === 'stairs') return '#807860'
  return '#908870'
}

// === Wall collision helper (height-aware) ===
export function isInsideWall(x, z, radius = 0.4, playerFeetY = 0) {
  for (const w of MAP_WALLS) {
    const [wx, wy, wz] = w.pos
    const [sx, sy, sz] = w.size
    const wallTop = wy + sy / 2
    if (playerFeetY >= wallTop - 0.15) continue
    const hx = sx / 2 + radius, hz = sz / 2 + radius
    if (x > wx - hx && x < wx + hx && z > wz - hz && z < wz + hz) return true
  }
  return false
}

// Resolve position: push player out of any overlapping wall and return corrected [x, z]
export function resolveCollision(x, z, radius = 0.4, playerFeetY = 0) {
  let rx = x, rz = z
  for (let iter = 0; iter < 3; iter++) {
    let pushed = false
    for (const w of MAP_WALLS) {
      const [wx, wy, wz] = w.pos
      const [sx, sy, sz] = w.size
      const wallTop = wy + sy / 2
      if (playerFeetY >= wallTop - 0.15) continue
      const hx = sx / 2 + radius, hz = sz / 2 + radius
      if (rx > wx - hx && rx < wx + hx && rz > wz - hz && rz < wz + hz) {
        const pushLeft = (wx - hx) - rx
        const pushRight = (wx + hx) - rx
        const pushUp = (wz - hz) - rz
        const pushDown = (wz + hz) - rz
        const absL = Math.abs(pushLeft), absR = Math.abs(pushRight)
        const absU = Math.abs(pushUp), absD = Math.abs(pushDown)
        const minX = absL < absR ? pushLeft : pushRight
        const minZ = absU < absD ? pushUp : pushDown
        if (Math.abs(minX) < Math.abs(minZ)) {
          rx += minX
        } else {
          rz += minZ
        }
        pushed = true
      }
    }
    if (!pushed) break
  }
  return [rx, rz]
}
