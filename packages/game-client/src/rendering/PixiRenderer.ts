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
  private trackContainer: PIXI.Container;

  constructor(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application();
    
    this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x87CEEB,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      this.stage = this.app.stage;
      this.trackContainer = new PIXI.Container();
      this.stage.addChild(this.trackContainer);
      
      this.particleContainer = new PIXI.ParticleContainer(10000, {
        position: true,
        rotation: true,
        scale: true,
        alpha: true,
      });
      this.stage.addChild(this.particleContainer);
      
      this.setupTrack();
      this.setupEventListeners();
    });
  }

  private setupTrack(): void {
    const trackGraphics = new PIXI.Graphics();
    const laneWidth = 100;
    const laneCount = 8;
    const startY = 50;
    
    for (let i = 0; i < laneCount; i++) {
      const y = startY + i * laneWidth;
      
      trackGraphics.rect(0, y, window.innerWidth * 2, laneWidth * 0.9);
      trackGraphics.fill(0x8B4513);
      
      if (i < laneCount - 1) {
        trackGraphics.moveTo(0, y + laneWidth);
        trackGraphics.lineTo(window.innerWidth * 2, y + laneWidth);
        trackGraphics.stroke({ width: 2, color: 0xFFFFFF, alpha: 0.5 });
      }
    }
    
    const startLineX = 100;
    trackGraphics.rect(startLineX, startY, 5, laneCount * laneWidth);
    trackGraphics.fill(0xFFFFFF);
    
    const finishLineX = window.innerWidth - 200;
    for (let i = 0; i < 20; i++) {
      const color = i % 2 === 0 ? 0xFFFFFF : 0x000000;
      trackGraphics.rect(finishLineX, startY + i * (laneCount * laneWidth / 20), 5, laneCount * laneWidth / 20);
      trackGraphics.fill(color);
    }
    
    this.trackContainer.addChild(trackGraphics);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    });
  }

  createTractor(playerId: string, config: TractorSprite): void {
    const container = new PIXI.Container();
    container.label = playerId;

    const bodyGraphics = new PIXI.Graphics();
    bodyGraphics.rect(-40, -20, 80, 40);
    bodyGraphics.fill(config.paintColor);
    bodyGraphics.rect(-40, -20, 80, 40);
    bodyGraphics.stroke({ width: 2, color: 0x000000 });
    container.addChild(bodyGraphics);

    const cabGraphics = new PIXI.Graphics();
    cabGraphics.rect(-25, -40, 35, 40);
    cabGraphics.fill(0x333333);
    cabGraphics.rect(-25, -40, 35, 40);
    cabGraphics.stroke({ width: 2, color: 0x000000 });
    container.addChild(cabGraphics);

    const wheelPositions = [
      { x: -25, y: 25 },
      { x: 25, y: 25 },
      { x: -25, y: -25 },
      { x: 25, y: -25 },
    ];

    wheelPositions.forEach((pos, index) => {
      const wheel = new PIXI.Graphics();
      wheel.circle(0, 0, 12);
      wheel.fill(0x1a1a1a);
      wheel.circle(0, 0, 12);
      wheel.stroke({ width: 2, color: 0x000000 });
      wheel.x = pos.x;
      wheel.y = pos.y;
      wheel.label = `wheel_${index}`;
      container.addChild(wheel);
    });

    const exhaustGraphics = new PIXI.Graphics();
    exhaustGraphics.rect(-5, -5, 10, 30);
    exhaustGraphics.fill(0x555555);
    exhaustGraphics.x = -30;
    exhaustGraphics.y = -50;
    container.addChild(exhaustGraphics);

    container.x = 150;
    container.y = 100;

    this.stage.addChild(container);
    this.tractorSprites.set(playerId, container);
  }

  updateTractor(playerId: string, position: number, wheelRotation: number): void {
    const tractor = this.tractorSprites.get(playerId);
    if (!tractor) return;

    const pixelsPerMeter = (window.innerWidth - 300) / 100;
    tractor.x = 150 + position * pixelsPerMeter;

    tractor.children.forEach((child) => {
      if (child.label?.startsWith('wheel_')) {
        child.rotation += wheelRotation * 5;
      }
    });

    if (Math.random() < 0.2) {
      this.emitMudParticle(tractor.x, tractor.y + 30);
    }

    this.updateCamera(tractor.x);
  }

  private updateCamera(focusX: number): void {
    const centerX = window.innerWidth / 2;
    this.stage.x = centerX - focusX;
  }

  private emitMudParticle(x: number, y: number): void {
    const particle = new PIXI.Graphics();
    particle.circle(0, 0, 4);
    particle.fill(0x654321);
    particle.x = x + (Math.random() - 0.5) * 20;
    particle.y = y;
    particle.alpha = 0.8;

    (particle as any).vx = (Math.random() - 0.5) * 4;
    (particle as any).vy = -Math.random() * 3 - 2;
    (particle as any).life = 1.0;

    this.particleContainer.addChild(particle);

    const updateParticle = () => {
      (particle as any).vy += 0.2;
      particle.x += (particle as any).vx;
      particle.y += (particle as any).vy;
      (particle as any).life -= 0.02;
      particle.alpha = (particle as any).life;

      if ((particle as any).life <= 0) {
        this.particleContainer.removeChild(particle);
        this.app.ticker.remove(updateParticle);
      }
    };

    this.app.ticker.add(updateParticle);
  }

  removeTractor(playerId: string): void {
    const tractor = this.tractorSprites.get(playerId);
    if (tractor) {
      this.stage.removeChild(tractor);
      this.tractorSprites.delete(playerId);
    }
  }

  render(deltaTime: number): void {
    // PixiJS auto-renders via ticker
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
