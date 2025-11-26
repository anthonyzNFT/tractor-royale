# Tractor Royale Architecture

## Overview

Tractor Royale is a real-time multiplayer browser game built with a modern web stack, designed to be fully hostable on static platforms like GitHub Pages.

## Core Architecture

### Client-Server Model
```
┌─────────────────┐
│  GitHub Pages   │  Static hosting
│  (CDN/Edge)     │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Client  │  React + Three.js/PixiJS
    │ (Game)  │
    └────┬────┘
         │
    ┌────▼────────┐
    │   WebRTC    │  P2P connections
    │ (DataChan.) │
    └────┬────────┘
         │
    ┌────▼────────┐
    │  Signaling  │  Optional WS server
    │   Server    │  (Fly.io)
    └─────────────┘
```

### Rendering Pipeline

The game uses a dual-renderer system:

1. **WebGPU** (Primary): Modern, high-performance 3D rendering
2. **PixiJS** (Fallback): 2D canvas rendering for compatibility

Detection logic:
```typescript
if ('gpu' in navigator) {
  // Use WebGPU
} else {
  // Fallback to PixiJS
}
```

### Physics System

- **Tick Rate**: 60 Hz fixed timestep
- **Integration**: Semi-implicit Euler
- **Model**: Torque curves, tire slip, weather effects
- **Determinism**: All clients run identical physics

### Networking

**WebRTC P2P Architecture:**
- Mesh network for ≤8 players
- Star topology (host relay) for 8-20 players
- Client prediction + server reconciliation
- Delta compression for state updates

**State Sync:**
```
Client → Input (60 FPS) → Host
Host → Process + Reconcile → State (20 Hz) → Clients
Clients → Predict + Interpolate → Smooth visuals
```

### Storage

**Primary**: IndexedDB (local-first)
- Player profiles
- Unlocked parts
- Settings

**Optional**: Supabase (cloud sync)
- Cross-device profiles
- Leaderboards
- Persistent stats

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript 5.6**: Type safety
- **Vite 5**: Build tool
- **Tailwind CSS 3.4**: Styling
- **Three.js**: 3D rendering
- **PixiJS 8**: 2D fallback

### Networking
- **SimplePeer**: WebRTC abstraction
- **WebSocket**: Signaling

### State Management
- **Zustand**: Global state
- **IndexedDB (idb)**: Local persistence

### Backend (Optional)
- **Fastify**: WebSocket server
- **Supabase**: Database & auth

## File Structure
```
packages/
├── game-client/       # Main game
│   ├── src/
│   │   ├── core/     # Game engine
│   │   ├── rendering/ # Graphics
│   │   ├── multiplayer/ # Networking
│   │   ├── ui/       # React components
│   │   └── storage/  # Persistence
│   └── public/       # Static assets
├── signaling-server/  # WebRTC signaling
└── shared/           # Common types
```

## Performance Targets

- **Bundle Size**: <120 KB initial
- **FPS**: 60 (desktop), 30+ (mobile)
- **Latency**: <60ms P2P
- **Assets**: <2MB gzipped
- **Lighthouse**: 100/100

## Deployment

1. Build: `npm run build`
2. Output: `packages/game-client/dist/`
3. Deploy: GitHub Pages / Vercel / Cloudflare Pages
4. Result: Fully playable game at static URL
