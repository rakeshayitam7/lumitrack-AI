# LumiTrack AI

**LumiTrack: AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile Free-Space Optical Communication (FSOC) Terminals**

SIH26169 web control and visualization layer. Built with Next.js for Vercel. The dashboard provides a 640×480 virtual camera, beacon simulation, motion modes, disturbance injection, live tracking metrics, and SIH benchmark targets.

> **Tagline:** Track the Light. Maintain the Link.

## Features

- 640×480 virtual camera viewport
- Straight Line, Circular, Figure 8 and Random beacon motion
- Gaussian, Salt & Pepper and Poisson disturbance modes
- Beacon size control: 5–20 px
- Camera jitter: 0–20 px/frame
- Target-loss injection
- Virtual pan/tilt control with 5–10°/s limit
- Live X/Y, tracking error, confidence and FPS
- SIH26169 benchmark dashboard
- Tracking pipeline visualization
- `/api/status` health endpoint
- Responsive aerospace-style UI

## Stack

- Next.js
- React
- Lucide React
- Vercel

The Python/OpenCV engine is the reference implementation for the standalone SIH execution path; this repository is the web demo, control and visualization layer.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

## SIH26169 benchmark targets

| Metric | Target |
|---|---:|
| Processing | ≥ 20 FPS |
| Acquisition | ≤ 2 s |
| Tracking error | ≤ 10 px |
| Reacquisition | ≤ 1 s |
| Target loss | < 5% |
| Beacon size | 5–20 px |
| Camera update | ≥ 20 Hz |
| Pan/tilt limit | 5–10°/s |

## Project

**Problem Statement:** SIH26169  
**Domain:** Smart Automation / Space Technology  
**System:** AI-assisted virtual camera tracking for coarse FSOC terminal alignment.
