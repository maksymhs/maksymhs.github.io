import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

// Screen bounds (local to monitor screen group at [0, 0.4, 0.18])
const SW = 0.9   // screen width
const SH = 0.55  // screen height
const HALF_W = SW / 2
const HALF_H = SH / 2
const FONT = '/fonts/PressStart2P-Regular.ttf'

// ==================== SNAKE ====================
const SNAKE_COLS = 20
const SNAKE_ROWS = 14
const CELL_W = SW / SNAKE_COLS
const CELL_H = SH / SNAKE_ROWS

function cellPos(col, row) {
  return [
    -HALF_W + col * CELL_W + CELL_W / 2,
    HALF_H - row * CELL_H - CELL_H / 2,
    0
  ]
}

function randomFood(snake) {
  let pos
  do {
    pos = [Math.floor(Math.random() * SNAKE_COLS), Math.floor(Math.random() * SNAKE_ROWS)]
  } while (snake.some(s => s[0] === pos[0] && s[1] === pos[1]))
  return pos
}

export function SnakeGame({ onExit }) {
  const stateRef = useRef({
    snake: [[10, 7], [9, 7], [8, 7]],
    dir: [1, 0],
    nextDir: [1, 0],
    food: [15, 5],
    score: 0,
    gameOver: false,
    timer: 0,
    speed: 0.12,
  })
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const s = stateRef.current
    s.snake = [[10, 7], [9, 7], [8, 7]]
    s.dir = [1, 0]
    s.nextDir = [1, 0]
    s.food = [15, 5]
    s.score = 0
    s.gameOver = false
    s.timer = 0
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      const s = stateRef.current
      if (s.gameOver) {
        if (e.key === 'Enter') {
          s.snake = [[10, 7], [9, 7], [8, 7]]
          s.dir = [1, 0]
          s.nextDir = [1, 0]
          s.food = randomFood(s.snake)
          s.score = 0
          s.gameOver = false
          s.timer = 0
        }
        if (e.key === 'Escape') { e.stopImmediatePropagation(); onExit?.() }
        return
      }
      if (e.key === 'Escape') { e.stopImmediatePropagation(); onExit?.(); return }
      const { dir } = s
      if ((e.key === 'ArrowUp' || e.key === 'w') && dir[1] !== 1) s.nextDir = [0, -1]
      if ((e.key === 'ArrowDown' || e.key === 's') && dir[1] !== -1) s.nextDir = [0, 1]
      if ((e.key === 'ArrowLeft' || e.key === 'a') && dir[0] !== 1) s.nextDir = [-1, 0]
      if ((e.key === 'ArrowRight' || e.key === 'd') && dir[0] !== -1) s.nextDir = [1, 0]
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  useFrame((_, delta) => {
    const s = stateRef.current
    if (s.gameOver) return
    s.timer += delta
    if (s.timer < s.speed) return
    s.timer = 0

    s.dir = s.nextDir
    const head = [s.snake[0][0] + s.dir[0], s.snake[0][1] + s.dir[1]]

    // Wall collision
    if (head[0] < 0 || head[0] >= SNAKE_COLS || head[1] < 0 || head[1] >= SNAKE_ROWS) {
      s.gameOver = true
      forceUpdate(n => n + 1)
      return
    }
    // Self collision
    if (s.snake.some(seg => seg[0] === head[0] && seg[1] === head[1])) {
      s.gameOver = true
      forceUpdate(n => n + 1)
      return
    }

    s.snake.unshift(head)
    if (head[0] === s.food[0] && head[1] === s.food[1]) {
      s.score += 10
      s.food = randomFood(s.snake)
      s.speed = Math.max(0.06, s.speed - 0.003)
    } else {
      s.snake.pop()
    }
    forceUpdate(n => n + 1)
  })

  const s = stateRef.current
  return (
    <group>
      {/* Border */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[SW + 0.01, SH + 0.01]} />
        <meshBasicMaterial color="#103010" />
      </mesh>
      {/* Snake body */}
      {s.snake.map((seg, i) => (
        <mesh key={i} position={cellPos(seg[0], seg[1])}>
          <planeGeometry args={[CELL_W * 0.85, CELL_H * 0.85]} />
          <meshBasicMaterial color={i === 0 ? '#80ff80' : '#40c040'} />
        </mesh>
      ))}
      {/* Food */}
      <mesh position={cellPos(s.food[0], s.food[1])}>
        <planeGeometry args={[CELL_W * 0.7, CELL_H * 0.7]} />
        <meshBasicMaterial color="#ff4040" />
      </mesh>
      {/* Score */}
      <Text position={[0, HALF_H + 0.02, 0]} fontSize={0.02} color="#60d0a0" anchorX="center" anchorY="bottom" font={FONT}>
        {`SCORE: ${s.score}`}
      </Text>
      {/* Game Over */}
      {s.gameOver && (
        <group>
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.5, 0.15]} />
            <meshBasicMaterial color="#000000" opacity={0.8} transparent />
          </mesh>
          <Text position={[0, 0.02, 0.002]} fontSize={0.025} color="#ff4040" anchorX="center" anchorY="middle" font={FONT}>
            GAME OVER
          </Text>
          <Text position={[0, -0.03, 0.002]} fontSize={0.014} color="#aaaaaa" anchorX="center" anchorY="middle" font={FONT}>
            ENTER: Retry  ESC: Exit
          </Text>
        </group>
      )}
    </group>
  )
}

// ==================== PONG ====================
export function PongGame({ onExit }) {
  const stateRef = useRef({
    ballX: 0, ballY: 0,
    ballVX: 0.4, ballVY: 0.3,
    padL: 0, padR: 0,
    scoreL: 0, scoreR: 0,
    gameOver: false,
    keys: {},
  })
  const [, forceUpdate] = useState(0)

  const PAD_H = 0.12
  const PAD_W = 0.02
  const BALL_S = 0.018
  const PAD_X = HALF_W - 0.04

  useEffect(() => {
    const s = stateRef.current
    s.ballX = 0; s.ballY = 0
    s.ballVX = 0.4; s.ballVY = 0.3
    s.padL = 0; s.padR = 0
    s.scoreL = 0; s.scoreR = 0
    s.gameOver = false
  }, [])

  useEffect(() => {
    const handleDown = (e) => {
      stateRef.current.keys[e.key] = true
      if (e.key === 'Escape') { e.stopImmediatePropagation(); onExit?.() }
      if (e.key === 'Enter' && stateRef.current.gameOver) {
        const s = stateRef.current
        s.ballX = 0; s.ballY = 0
        s.ballVX = 0.4; s.ballVY = 0.3
        s.padL = 0; s.padR = 0
        s.scoreL = 0; s.scoreR = 0
        s.gameOver = false
      }
    }
    const handleUp = (e) => { stateRef.current.keys[e.key] = false }
    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp) }
  }, [onExit])

  useFrame((_, delta) => {
    const s = stateRef.current
    if (s.gameOver) return
    const spd = 0.6

    // Player paddle (left) - W/S or arrows
    if (s.keys['w'] || s.keys['ArrowUp']) s.padL = Math.min(s.padL + spd * delta, HALF_H - PAD_H / 2)
    if (s.keys['s'] || s.keys['ArrowDown']) s.padL = Math.max(s.padL - spd * delta, -HALF_H + PAD_H / 2)

    // AI paddle (right)
    const aiSpeed = 0.4
    if (s.ballY > s.padR + 0.02) s.padR = Math.min(s.padR + aiSpeed * delta, HALF_H - PAD_H / 2)
    if (s.ballY < s.padR - 0.02) s.padR = Math.max(s.padR - aiSpeed * delta, -HALF_H + PAD_H / 2)

    // Ball movement
    s.ballX += s.ballVX * delta
    s.ballY += s.ballVY * delta

    // Top/bottom bounce
    if (s.ballY > HALF_H - BALL_S || s.ballY < -HALF_H + BALL_S) s.ballVY *= -1

    // Left paddle collision
    if (s.ballX < -PAD_X + PAD_W && s.ballX > -PAD_X &&
        s.ballY > s.padL - PAD_H / 2 && s.ballY < s.padL + PAD_H / 2) {
      s.ballVX = Math.abs(s.ballVX) * 1.05
      s.ballVY += (s.ballY - s.padL) * 2
    }
    // Right paddle collision
    if (s.ballX > PAD_X - PAD_W && s.ballX < PAD_X &&
        s.ballY > s.padR - PAD_H / 2 && s.ballY < s.padR + PAD_H / 2) {
      s.ballVX = -Math.abs(s.ballVX) * 1.05
      s.ballVY += (s.ballY - s.padR) * 2
    }

    // Score
    if (s.ballX < -HALF_W) {
      s.scoreR++
      s.ballX = 0; s.ballY = 0; s.ballVX = 0.4; s.ballVY = 0.3
    }
    if (s.ballX > HALF_W) {
      s.scoreL++
      s.ballX = 0; s.ballY = 0; s.ballVX = -0.4; s.ballVY = -0.3
    }

    if (s.scoreL >= 5 || s.scoreR >= 5) s.gameOver = true
    forceUpdate(n => n + 1)
  })

  const s = stateRef.current
  return (
    <group>
      {/* Background */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[SW, SH]} />
        <meshBasicMaterial color="#0a0a2a" />
      </mesh>
      {/* Center line */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[0, HALF_H - i * (SH / 10) - SH / 20, 0]}>
          <planeGeometry args={[0.005, SH / 12]} />
          <meshBasicMaterial color="#304060" />
        </mesh>
      ))}
      {/* Left paddle */}
      <mesh position={[-PAD_X, s.padL, 0]}>
        <planeGeometry args={[PAD_W, PAD_H]} />
        <meshBasicMaterial color="#40c0ff" />
      </mesh>
      {/* Right paddle */}
      <mesh position={[PAD_X, s.padR, 0]}>
        <planeGeometry args={[PAD_W, PAD_H]} />
        <meshBasicMaterial color="#ff6060" />
      </mesh>
      {/* Ball */}
      <mesh position={[s.ballX, s.ballY, 0]}>
        <planeGeometry args={[BALL_S * 2, BALL_S * 2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Scores */}
      <Text position={[-0.12, HALF_H + 0.02, 0]} fontSize={0.025} color="#40c0ff" anchorX="center" anchorY="bottom" font={FONT}>
        {`${s.scoreL}`}
      </Text>
      <Text position={[0.12, HALF_H + 0.02, 0]} fontSize={0.025} color="#ff6060" anchorX="center" anchorY="bottom" font={FONT}>
        {`${s.scoreR}`}
      </Text>
      {/* Game Over */}
      {s.gameOver && (
        <group>
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.5, 0.15]} />
            <meshBasicMaterial color="#000000" opacity={0.8} transparent />
          </mesh>
          <Text position={[0, 0.02, 0.002]} fontSize={0.022} color={s.scoreL >= 5 ? '#40c0ff' : '#ff6060'} anchorX="center" anchorY="middle" font={FONT}>
            {s.scoreL >= 5 ? 'YOU WIN!' : 'YOU LOSE!'}
          </Text>
          <Text position={[0, -0.03, 0.002]} fontSize={0.014} color="#aaaaaa" anchorX="center" anchorY="middle" font={FONT}>
            ENTER: Retry  ESC: Exit
          </Text>
        </group>
      )}
    </group>
  )
}

// ==================== TETRIS ====================
const TET_COLS = 10
const TET_ROWS = 18
const T_CELL_W = SH / TET_ROWS * 0.95  // square cells based on height
const T_CELL_H = T_CELL_W
const BOARD_W = TET_COLS * T_CELL_W
const BOARD_H = TET_ROWS * T_CELL_H
const BOARD_X = -BOARD_W / 2
const BOARD_Y = BOARD_H / 2

const SHAPES = [
  { blocks: [[0,0],[1,0],[2,0],[3,0]], color: '#00f0f0' }, // I
  { blocks: [[0,0],[1,0],[0,1],[1,1]], color: '#f0f000' }, // O
  { blocks: [[0,0],[1,0],[2,0],[1,1]], color: '#a000f0' }, // T
  { blocks: [[0,0],[1,0],[2,0],[2,1]], color: '#f0a000' }, // L
  { blocks: [[0,0],[1,0],[2,0],[0,1]], color: '#0000f0' }, // J
  { blocks: [[0,0],[1,0],[1,1],[2,1]], color: '#00f000' }, // S
  { blocks: [[1,0],[2,0],[0,1],[1,1]], color: '#f00000' }, // Z
]

function tCellPos(col, row) {
  return [
    BOARD_X + col * T_CELL_W + T_CELL_W / 2,
    BOARD_Y - row * T_CELL_H - T_CELL_H / 2,
    0
  ]
}

function newPiece() {
  const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  return { blocks: s.blocks.map(b => [...b]), color: s.color, x: 3, y: 0 }
}

function collides(board, piece, ox = 0, oy = 0) {
  for (const [bx, by] of piece.blocks) {
    const nx = piece.x + bx + ox
    const ny = piece.y + by + oy
    if (nx < 0 || nx >= TET_COLS || ny >= TET_ROWS) return true
    if (ny >= 0 && board[ny][nx]) return true
  }
  return false
}

function rotatePiece(piece) {
  const rotated = piece.blocks.map(([x, y]) => [-y, x])
  const minX = Math.min(...rotated.map(b => b[0]))
  const minY = Math.min(...rotated.map(b => b[1]))
  return rotated.map(([x, y]) => [x - minX, y - minY])
}

export function TetrisGame({ onExit }) {
  const stateRef = useRef({
    board: Array.from({ length: TET_ROWS }, () => Array(TET_COLS).fill(null)),
    piece: newPiece(),
    timer: 0,
    speed: 0.5,
    score: 0,
    lines: 0,
    gameOver: false,
  })
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const s = stateRef.current
    s.board = Array.from({ length: TET_ROWS }, () => Array(TET_COLS).fill(null))
    s.piece = newPiece()
    s.timer = 0; s.speed = 0.5; s.score = 0; s.lines = 0; s.gameOver = false
  }, [])

  const lockPiece = useCallback(() => {
    const s = stateRef.current
    for (const [bx, by] of s.piece.blocks) {
      const ny = s.piece.y + by
      const nx = s.piece.x + bx
      if (ny >= 0 && ny < TET_ROWS && nx >= 0 && nx < TET_COLS) {
        s.board[ny][nx] = s.piece.color
      }
    }
    // Clear lines
    let cleared = 0
    for (let r = TET_ROWS - 1; r >= 0; r--) {
      if (s.board[r].every(c => c !== null)) {
        s.board.splice(r, 1)
        s.board.unshift(Array(TET_COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared > 0) {
      s.lines += cleared
      s.score += [0, 100, 300, 500, 800][cleared] || 800
      s.speed = Math.max(0.15, 0.5 - s.lines * 0.02)
    }
    s.piece = newPiece()
    if (collides(s.board, s.piece)) s.gameOver = true
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      const s = stateRef.current
      if (s.gameOver) {
        if (e.key === 'Enter') {
          s.board = Array.from({ length: TET_ROWS }, () => Array(TET_COLS).fill(null))
          s.piece = newPiece()
          s.timer = 0; s.speed = 0.5; s.score = 0; s.lines = 0; s.gameOver = false
        }
        if (e.key === 'Escape') { e.stopImmediatePropagation(); onExit?.() }
        return
      }
      if (e.key === 'Escape') { e.stopImmediatePropagation(); onExit?.(); return }
      if ((e.key === 'ArrowLeft' || e.key === 'a') && !collides(s.board, s.piece, -1, 0)) s.piece.x--
      if ((e.key === 'ArrowRight' || e.key === 'd') && !collides(s.board, s.piece, 1, 0)) s.piece.x++
      if (e.key === 'ArrowDown' || e.key === 's') {
        if (!collides(s.board, s.piece, 0, 1)) s.piece.y++
        else lockPiece()
      }
      if (e.key === 'ArrowUp' || e.key === 'w') {
        const rotated = rotatePiece(s.piece)
        const test = { ...s.piece, blocks: rotated }
        if (!collides(s.board, test)) s.piece.blocks = rotated
      }
      if (e.key === ' ') {
        while (!collides(s.board, s.piece, 0, 1)) s.piece.y++
        lockPiece()
      }
      forceUpdate(n => n + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit, lockPiece])

  useFrame((_, delta) => {
    const s = stateRef.current
    if (s.gameOver) return
    s.timer += delta
    if (s.timer < s.speed) return
    s.timer = 0
    if (!collides(s.board, s.piece, 0, 1)) {
      s.piece.y++
    } else {
      lockPiece()
    }
    forceUpdate(n => n + 1)
  })

  const s = stateRef.current
  return (
    <group>
      {/* Board background */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[BOARD_W + 0.01, BOARD_H + 0.01]} />
        <meshBasicMaterial color="#0a0a1a" />
      </mesh>
      {/* Grid lines */}
      {Array.from({ length: TET_COLS + 1 }).map((_, i) => (
        <mesh key={`v${i}`} position={[BOARD_X + i * T_CELL_W, 0, 0]}>
          <planeGeometry args={[0.001, BOARD_H]} />
          <meshBasicMaterial color="#1a1a3a" />
        </mesh>
      ))}
      {Array.from({ length: TET_ROWS + 1 }).map((_, i) => (
        <mesh key={`h${i}`} position={[0, BOARD_Y - i * T_CELL_H, 0]}>
          <planeGeometry args={[BOARD_W, 0.001]} />
          <meshBasicMaterial color="#1a1a3a" />
        </mesh>
      ))}
      {/* Board cells */}
      {s.board.map((row, r) => row.map((cell, c) => cell ? (
        <mesh key={`${r}-${c}`} position={tCellPos(c, r)}>
          <planeGeometry args={[T_CELL_W * 0.9, T_CELL_H * 0.9]} />
          <meshBasicMaterial color={cell} />
        </mesh>
      ) : null))}
      {/* Current piece */}
      {s.piece.blocks.map(([bx, by], i) => {
        const px = s.piece.x + bx
        const py = s.piece.y + by
        if (py < 0) return null
        return (
          <mesh key={`p${i}`} position={tCellPos(px, py)}>
            <planeGeometry args={[T_CELL_W * 0.9, T_CELL_H * 0.9]} />
            <meshBasicMaterial color={s.piece.color} />
          </mesh>
        )
      })}
      {/* Score */}
      <Text position={[BOARD_W / 2 + 0.08, BOARD_H / 2 - 0.02, 0]} fontSize={0.015} color="#60d0a0" anchorX="left" anchorY="top" font={FONT}>
        {`SCORE\n${s.score}`}
      </Text>
      <Text position={[BOARD_W / 2 + 0.08, BOARD_H / 2 - 0.1, 0]} fontSize={0.015} color="#60d0a0" anchorX="left" anchorY="top" font={FONT}>
        {`LINES\n${s.lines}`}
      </Text>
      {/* Game Over */}
      {s.gameOver && (
        <group>
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.5, 0.15]} />
            <meshBasicMaterial color="#000000" opacity={0.8} transparent />
          </mesh>
          <Text position={[0, 0.02, 0.002]} fontSize={0.025} color="#ff4040" anchorX="center" anchorY="middle" font={FONT}>
            GAME OVER
          </Text>
          <Text position={[0, -0.03, 0.002]} fontSize={0.014} color="#aaaaaa" anchorX="center" anchorY="middle" font={FONT}>
            ENTER: Retry  ESC: Exit
          </Text>
        </group>
      )}
    </group>
  )
}
