import React, { useRef, useCallback } from 'react'

export default function MobileControls({ mobileMoveRef, mobileLookRef, mobileShootRef }) {
  const joyLRef = useRef(null)
  const knobLRef = useRef(null)
  const joyRRef = useRef(null)
  const knobRRef = useRef(null)
  const joyLOrigin = useRef({ x: 0, y: 0 })
  const joyROrigin = useRef({ x: 0, y: 0 })
  const touchIdL = useRef(null)
  const touchIdR = useRef(null)

  const KNOB_MAX = 40
  const LOOK_SENS = 5.5

  // --- Left joystick (movement) ---
  const onLStart = useCallback((e) => {
    e.preventDefault()
    const t = e.changedTouches[0]
    touchIdL.current = t.identifier
    const rect = joyLRef.current.getBoundingClientRect()
    joyLOrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const onLMove = useCallback((e) => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdL.current) {
        let dx = t.clientX - joyLOrigin.current.x
        let dy = t.clientY - joyLOrigin.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > KNOB_MAX) { dx = dx / dist * KNOB_MAX; dy = dy / dist * KNOB_MAX }
        if (knobLRef.current) knobLRef.current.style.transform = `translate(${dx}px, ${dy}px)`
        mobileMoveRef.current = { x: dx / KNOB_MAX, y: -dy / KNOB_MAX }
      }
    }
  }, [mobileMoveRef])

  const onLEnd = useCallback((e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdL.current) {
        touchIdL.current = null
        mobileMoveRef.current = { x: 0, y: 0 }
        if (knobLRef.current) knobLRef.current.style.transform = 'translate(0px, 0px)'
      }
    }
  }, [mobileMoveRef])

  // --- Right joystick (look) ---
  const onRStart = useCallback((e) => {
    e.preventDefault()
    const t = e.changedTouches[0]
    touchIdR.current = t.identifier
    const rect = joyRRef.current.getBoundingClientRect()
    joyROrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const onRMove = useCallback((e) => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdR.current) {
        let dx = t.clientX - joyROrigin.current.x
        let dy = t.clientY - joyROrigin.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > KNOB_MAX) { dx = dx / dist * KNOB_MAX; dy = dy / dist * KNOB_MAX }
        if (knobRRef.current) knobRRef.current.style.transform = `translate(${dx}px, ${dy}px)`
        mobileLookRef.current.dx += dx / KNOB_MAX * LOOK_SENS
        mobileLookRef.current.dy += dy / KNOB_MAX * LOOK_SENS
      }
    }
  }, [mobileLookRef])

  const onREnd = useCallback((e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdR.current) {
        touchIdR.current = null
        if (knobRRef.current) knobRRef.current.style.transform = 'translate(0px, 0px)'
      }
    }
  }, [])

  const baseStyle = {
    position: 'absolute', borderRadius: '50%', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
  }
  const joyStyle = {
    ...baseStyle, width: '120px', height: '120px',
    background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70,
  }
  const knobStyle = {
    width: '50px', height: '50px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)', border: '2px solid rgba(255,255,255,0.5)',
    transition: 'transform 0.05s',
  }

  return (
    <>
      {/* Left joystick — movement */}
      <div ref={joyLRef} onTouchStart={onLStart} onTouchMove={onLMove} onTouchEnd={onLEnd} onTouchCancel={onLEnd}
        style={{ ...joyStyle, left: '25px', bottom: '160px' }}>
        <div ref={knobLRef} style={knobStyle} />
      </div>

      {/* Right joystick — look */}
      <div ref={joyRRef} onTouchStart={onRStart} onTouchMove={onRMove} onTouchEnd={onREnd} onTouchCancel={onREnd}
        style={{ ...joyStyle, right: '25px', bottom: '160px' }}>
        <div ref={knobRRef} style={knobStyle} />
      </div>

      {/* Shoot button */}
      <div
        onTouchStart={(e) => { e.preventDefault(); mobileShootRef.current = true }}
        style={{
          ...baseStyle, right: '35px', bottom: '300px', width: '70px', height: '70px',
          background: 'rgba(255,60,60,0.3)', border: '2px solid rgba(255,60,60,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 75, fontSize: '24px', color: 'rgba(255,255,255,0.8)',
        }}
      >
        🔫
      </div>

      {/* Jump button */}
      <div
        onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })) }}
        style={{
          ...baseStyle, right: '120px', bottom: '300px', width: '55px', height: '55px',
          background: 'rgba(100,200,255,0.25)', border: '2px solid rgba(100,200,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 75, fontSize: '16px', color: 'rgba(255,255,255,0.7)',
        }}
      >
        ⬆
      </div>
    </>
  )
}
