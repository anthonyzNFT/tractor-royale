# 🚜 Tractor Royale

The ultimate browser-based multiplayer tractor racing game. No downloads, no servers, just pure arcade racing action.

## Features

- 🎮 **4-20 Player Real-Time Racing** - WebRTC P2P multiplayer
- 🎨 **1000+ Customization Parts** - Build your dream tractor
- ⚡ **Zero Server Required** - Fully static hosting on GitHub Pages
- 🤖 **AI Bot Fallback** - Always playable, even solo
- 🎯 **Client Prediction** - Butter-smooth netcode
- 💎 **WebGPU + PixiJS** - Gorgeous 3D with 2D fallback
- 📱 **Cross-Platform** - Works on desktop, mobile, and tablets

## Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

Visit `http://localhost:5173` to play!

## Tech Stack

- **Frontend**: React 18 + TypeScript 5.6
- **Rendering**: Three.js (WebGPU) / PixiJS (fallback)
- **Multiplayer**: WebRTC (SimplePeer)
- **Build**: Vite 5 + Turbo
- **Styling**: Tailwind CSS 3.4
- **Storage**: IndexedDB + Optional Supabase

## Project Structure
```
tractor-royale/
├── packages/
│   ├── game-client/       # Main game (GitHub Pages target)
│   ├── signaling-server/  # Optional WebRTC signaling
│   └── shared/            # Shared types & constants
├── scripts/               # Asset optimization scripts
└── docs/                  # Documentation
```

## Development

### Requirements

- Node.js 20+
- npm 10+

### Available Scripts

- `npm run dev` - Start all packages in dev mode
- `npm run build` - Build all packages
- `npm run deploy` - Deploy to GitHub Pages
- `npm run lint` - Lint all packages
- `npm run optimize-assets` - Compress game assets

## Deployment

### GitHub Pages (Recommended)

1. Enable GitHub Pages in repo settings
2. Set source to "GitHub Actions"
3. Push to `main` branch
4. Game auto-deploys to `https://username.github.io/tractor-royale/`

### Vercel / Cloudflare Pages
```bash
npm run build
# Upload packages/game-client/dist
```

## License

MIT License - see LICENSE file for details

## Credits

Built with ❤️ for the browser gaming community
```

### `LICENSE`
```
MIT License

Copyright (c) 2025 Tractor Royale Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
