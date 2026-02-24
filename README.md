# CV Interactivo 3D

Un CV interactivo con escena 3D estilo Animal Crossing, construido con React + Three.js y chat con IA vía OpenRouter.

## Características

- **Escena 3D** con habitación acogedora (escritorio, monitor, estantería, plantas, alfombra, cuadros)
- **Personaje estilo Animal Crossing** con animaciones idle (respiración, movimiento de cabeza, balanceo de brazos)
- **Chat con IA** conectado a OpenRouter (modelo Gemini Flash) para que los visitantes pregunten sobre tu CV
- **Panel de CV** con información profesional, experiencia y educación
- **Controles orbitales** para explorar la escena arrastrando el ratón

## Setup

```bash
# Instalar dependencias
npm install

# Arrancar servidor de desarrollo
npm run dev
```

## OpenRouter API Key

1. Ve a [openrouter.ai](https://openrouter.ai) y crea una cuenta
2. Genera una API key
3. Introdúcela en el campo del chat cuando se abra la app

## Personalización

Edita estos archivos para personalizar tu CV:

- `src/components/InfoPanel.jsx` — Nombre, skills, experiencia, educación
- `src/components/ChatOverlay.jsx` — El `SYSTEM_PROMPT` con tu información personal para que la IA responda como tú
- `src/components/Character.jsx` — Colores y forma del personaje
- `src/components/Room.jsx` — Decoración de la habitación

## Tech Stack

- **Vite** + **React**
- **Three.js** via `@react-three/fiber` + `@react-three/drei`
- **OpenRouter API** para chat con IA

## Build para producción

```bash
npm run build
```

## Licencia

Este proyecto está bajo la [Licencia MIT](./LICENSE). Puedes usar, copiar, modificar y distribuir este proyecto libremente, siempre que incluyas el aviso de copyright original y la licencia. © 2026 Maksym Herasymenko
