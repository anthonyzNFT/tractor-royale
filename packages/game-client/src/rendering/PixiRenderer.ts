import * as PIXI from 'pixi.js';

export interface TractorSprite {
  body: string;
  cab: string;
  wheels: string;
  paintColor: number;
}

export class PixiRenderer {
  private app: PIXI.Application;
  private stage: PIXI.Container;
  private tractorSprites: Map<string, PIXI.Container> = new Map();
  private particleContainer: PIXI.ParticleContainer;

  constructor(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x87CEEB, // Sky blue
      antialias: true,
      resolution: window.devicePixelRatio,
    });

    this.stage = this.app.stage;

    // Particle container for mud (high-performance, limited features)
    this.particleContainer = new PIXI.ParticleContainer(10000, {
      position: true,
      rotation: true,
      scale: true,
      alpha: true,
    });
    this.stage.addChild(this.particleContainer);

    this.setupTrack();
  }

  private setupTrack(): void {
    // Draw track lanes
    const trackGraphics = new PIXI.Graphics();
    const laneWidth = 150;
    const laneCount = 8;
    
    for (let i = 0; i < laneCount; i++) {
      const y = 100 + i * laneWidth;
      
      // Dirt lane
      trackGraphics.beginFill(0x8B4513); // Brown
      trackGraphics.drawRect(0, y, window.innerWidth, laneWidth * 0.8);
      trackGraphics.endFill();
      
      // Lane divider
      trackGraphics.lineStyle(2, 0xFFFFFF, 0.5);
      trackGraphics.moveTo(0, y);
      trackGraphics.lineTo(window.innerWidth, y);
    }
    
    this.stage.addChild(trackGraphics);
  }

  createTractor(playerId: string, config: TractorSprite): void {
    const container = new PIXI.Container();
    container.name = playerId;

    // Load sprite atlas
    const bodyTexture = PIXI.Texture.from(config.body);
    const cabTexture = PIXI.Texture.from(config.cab);
    const wheelTexture = PIXI.Texture.from(config.wheels);

    // Body (9-slice for stretching)
    const body = new PIXI.Sprite(bodyTexture);
    body.anchor.set(0.5);
    body.tint = config.paintColor;
    container.addChild(body);

    // Cab
    const cab = new PIXI.Sprite(cabTexture);
    cab.anchor.set(0.5);
    cab.x = -20;
    cab.y = -40;
    container.addChild(cab);

    // Wheels (4 sprites with rotation animation)
    const wheels = [
      { x: -60, y: 30 },
      { x: 60, y: 30 },
      { x: -60, y: -30 },
      { x: 60, y: -30 },
    ];

    for (const pos of wheels) {
      const wheel = new PIXI.Sprite(wheelTexture);
      wheel.anchor.set(0.5);
      wheel.x = pos.x;
      wheel.y = pos.y;
      wheel.name = 'wheel'; // Tag for animation
      container.addChild(wheel);
    }

    // Add smoke emitter placeholder
    const smokeEmitter = new PIXI.Graphics();
    smokeEmitter.beginFill(0x555555, 0.5);
    smokeEmitter.drawCircle(0, 0, 5);
    smokeEmitter.x = -80;
    smokeEmitter.y = -60;
    smokeEmitter.name = 'exhaust';
    container.addChild(smokeEmitter);

    this.stage.addChild(container);
    this.tractorSprites.set(playerId, container);
  }

  updateTractor(playerId: string, position: number, wheelRotation: number): void {
    const tractor = this.tractorSprites.get(playerId);
    if (!tractor) return;

    // Update position (position is in meters, convert to pixels)
    const pixelsPerMeter = 10; // Scale factor
    tractor.x = position * pixelsPerMeter;

    // Rotate wheels
    tractor.children.forEach((child) => {
      if (child.name === 'wheel') {
        child.rotation = wheelRotation;
      }
    });

    // Emit mud particles if moving
    if (Math.random() < 0.3) {
      this.emitMudParticle(tractor.x, tractor.y + 30);
    }
  }

  private emitMudParticle(x: number, y: number): void {
    const particle = new PIXI.Sprite(PIXI.Texture.WHITE);
    particle.tint = 0x654321; // Brown
    particle.width = 8;
    particle.height = 8;
    particle.anchor.set(0.5);
    particle.x = x + (Math.random() - 0.5) * 20;
    particle.y = y;
    particle.alpha = 0.8;

    // Add velocity for animation
    (particle as any).vx = (Math.random() - 0.5) * 4;
    (particle as any).vy = -Math.random() * 3 - 2;
    (particle as any).life = 1.0;

    this.particleContainer.addChild(particle);

    // Animate in ticker
    const ticker = (delta: number) => {
      (particle as any).vy += 0.2 * delta; // Gravity
      particle.x += (particle as any).vx * delta;
      particle.y += (particle as any).vy * delta;
      (particle as any).life -= 0.02 * delta;
      particle.alpha = (particle as any).life;

      if ((particle as any).life <= 0) {
        this.particleContainer.removeChild(particle);
        this.app.ticker.remove(ticker);
      }
    };

    this.app.ticker.add(ticker);
  }

  render(): void {
    // PixiJS auto-renders via ticker
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
```

---

## G. Marketing Materials

### Tagline

**"Rev, Race, Reign — The World's First Browser Tractor Royale"**

### 30-Second Launch Trailer Script
```
[0:00-0:03] OPEN: Black screen → Sound of distant engine rumble
            Text fades in: "From your browser..."

[0:03-0:06] CUT TO: Garage scene, player customizing tractor
            Quick cuts: swapping wheels, painting, adding cow catcher
            Voiceover: "Build your beast."

[0:06-0:09] CUT TO: Lobby screen, 8 player cards filling up
            Text overlay: "4-20 PLAYERS • REAL-TIME"
            Sound: Engines revving in sequence

[0:09-0:15] CUT TO: Race start, countdown "3...2...1...GO!"
            Split-screen showing 4 tractors launching
            Mud flying, wheels spinning, turbo flames
            Voiceover: "Race the world."

[0:15-0:20] POWER-UPS: Quick cuts:
            - Nitrous cow power-up (tractor boosts forward)
            - Oil slick (opponent spins out)
            - Speed magnet (pulling ahead)
            Bass drop music intensifies

[0:20-0:24] CLIMAX: Photo finish, first tractor crosses 100m
            Slow-motion, confetti cannons, crowd goes wild
            Winner's tractor does celebratory donut

[0:24-0:28] REVEAL: Logo flies in: "TRACTOR ROYALE"
            Text: "Play FREE now • No downloads"
            URL: tractorroyale.github.io

[0:28-0:30] END CARD: "Challenge your friends" + Share button
            Sound: Engine idle, fade to black
