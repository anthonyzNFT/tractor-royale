# Deployment Guide

## GitHub Pages (Recommended)

### Automatic Deployment

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"

2. **Push to main branch**:
```bash
   git add .
   git commit -m "Deploy"
   git push origin main
```

3. **Workflow runs automatically**:
   - Builds the game client
   - Deploys to GitHub Pages
   - Available at `https://username.github.io/tractor-royale/`

### Manual Deployment
```bash
npm run build
npm run deploy
```

## Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd packages/game-client
vercel --prod
```

## Cloudflare Pages

1. Connect your GitHub repository
2. Build settings:
   - Build command: `cd packages/game-client && npm run build`
   - Output directory: `packages/game-client/dist`
3. Deploy

## Custom Domain

### GitHub Pages

1. Add `CNAME` file to `packages/game-client/public/`:
```
   tractorroyale.com
```

2. Configure DNS:
```
   A    185.199.108.153
   A    185.199.109.153
   A    185.199.110.153
   A    185.199.111.153
```

## Signaling Server (Optional)

### Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
cd packages/signaling-server
npm run build
fly launch
fly deploy
```

### Environment Variables

Create `.env`:
```
PORT=3001
NODE_ENV=production
```

## Post-Deployment

### Verify

- [ ] Game loads at URL
- [ ] Can create/join rooms
- [ ] Multiplayer works
- [ ] Assets load correctly
- [ ] No console errors

### Monitoring

- Use browser DevTools → Network tab
- Check bundle sizes
- Verify CORS headers
- Test on mobile devices

### Performance

Run Lighthouse audit:
```bash
npm install -g lighthouse
lighthouse https://your-game-url.com
```

Target scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
