# portfolio-threejs

An interactive 3D portfolio built with React Three Fiber. Features a hacker room scene where hovering over the monitor zooms the camera in and reveals a retro Windows 95 desktop overlay with portfolio content.

## Stack

- **React 19** + **Vite**
- **React Three Fiber** + **drei** — 3D scene, camera, controls
- **GSAP** — smooth camera zoom animations
- **Tailwind CSS v4**

## Features

- 3D hacker room model with interactive monitor
- Mouse-movement-triggered camera zoom (12px threshold)
- Win95 desktop overlay with CRT effects (scanlines, jitter, flicker, rolling scan band)
- Portfolio content in a Win95 Explorer-style window: About, Experience, Projects, Contact
- Playable Tetris window
- Responsive overlay that tracks the 3D screen mesh in world space

## Getting Started

```bash
npm install
npm run dev
```

```bash
npm run build   # production build
npm run preview # preview build locally
```

## Interaction

- **Hover + move mouse** over the scene → camera zooms into the monitor
- **Click** or press **Escape** → zoom out
- Inside the overlay: double-click desktop icons to open windows
