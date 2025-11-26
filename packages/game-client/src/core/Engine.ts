import { TractorPhysics, TRACTOR_PRESETS } from './Physics';
import { WebGPURenderer } from '../rendering/WebGPURenderer';
import { PixiRenderer } from '../rendering/PixiRenderer';
import { InputManager } from './InputManager';
import { WebRTCManager } from '../multiplayer/WebRTCManager';
import { AIPlayer } from '../multiplayer/AIPlayer';
import type { PlayerState, RaceConfig } from '@tractor-royale/shared';
import { GAME_CONFIG } from '@tractor-royale/shared';

export type RendererType = 'webgpu' | 'pixi';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: WebGPURenderer | PixiRenderer | null = null;
  private rendererType: RendererType;
  private physics: Map<string, TractorPhysics> = new Map();
  private inputManager: InputManager;
  private webrtcManager: WebRTCManager | null = null;
  private aiBots: Map<string, AIPlayer> = new Map();
  
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDeltaTime = 1 / GAME_CONFIG.TICK_RATE;
  
  private localPlayerId: string;
  private raceConfig: RaceConfig;
  private raceStartTime = 0;
  private isRaceActive = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputManager = new InputManager();
    this.localPlayerId = '';
    
    this.raceConfig = {
      trackLength: GAME_CONFIG.TRACK_LENGTH,
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
      weatherType: 'clear',
      powerUpsEnabled: true,
      countdown: GAME_CONFIG.COUNTDOWN_DURATION,
    };

    this.rendererType = this.detectBestRenderer();
    this.initRenderer();
  }

  private detectBestRenderer(): RendererType {
    if ('gpu' in navigator) {
      return 'webgpu';
    }
    return 'pixi';
  }

  private async initRenderer(): Promise<void> {
    try {
      if (this.rendererType === 'webgpu') {
        this.renderer = new WebGPURenderer(this.canvas);
        console.log('✅ WebGPU renderer initialized');
      } else {
        this.renderer = new PixiRenderer(this.canvas);
        console.log('✅ PixiJS renderer initialized (fallback)');
      }
    } catch (error) {
      console.error('Renderer initialization failed:', error);
      if (this.rendererType === 'webgpu') {
        console.log('Falling back to PixiJS...');
        this.rendererType = 'pixi';
        this.renderer = new PixiRenderer(this.canvas);
      }
    }
  }

  async initMultiplayer(
    playerId: string,
    roomId: string,
    isHost: boolean,
    signalingServer: string
  ): Promise<void> {
    this.localPlayerId = playerId;
    
    this.webrtcManager = new WebRTCManager({
      localPlayerId: playerId,
      isHost,
      signalingServer,
    });

    this.webrtcManager.setOnPlayerJoin((peerId) => {
      console.log(`Player joined: ${peerId}`);
      this.addPlayer(peerId);
    });

    this.webrtcManager.setOnPlayerLeave((peerId) => {
      console.log(`Player left: ${peerId}`);
      this.removePlayer(peerId);
    });

    this.webrtcManager.setOnStateUpdate((snapshot) => {
      if (!isHost) {
        this.handleServerState(snapshot);
      }
    });

    await this.webrtcManager.connectToRoom(roomId);
  }

  addPlayer(playerId: string, isAI = false): void {
    const physics = new TractorPhysics(TRACTOR_PRESETS['rookie-rust-bucket']);
    this.physics.set(playerId, physics);

    if (isAI) {
      const aiBot = new AIPlayer(playerId, physics);
      this.aiBots.set(playerId, aiBot);
    }

    if (this.renderer) {
      this.renderer.createTractor(playerId, {
        body: '/assets/sprites/body_default.png',
        cab: '/assets/sprites/cab_default.png',
        wheels: '/assets/sprites/wheel_default.png',
        paintColor: 0x8B4513,
      });
    }
  }

  removePlayer(playerId: string): void {
    this.physics.delete(playerId);
    this.aiBots.delete(playerId);
    if (this.renderer) {
      this.renderer.removeTractor?.(playerId);
    }
  }

  startRace(): void {
    this.isRaceActive = true;
    this.raceStartTime = performance.now();
    
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedDeltaTime) {
      this.fixedUpdate(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    this.render(deltaTime);

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  private fixedUpdate(dt: number): void {
    if (!this.isRaceActive) return;

    const localThrottle = this.inputManager.getThrottle();

    if (this.webrtcManager) {
      this.webrtcManager.sendInput(localThrottle);
    }

    for (const [playerId, physics] of this.physics) {
      let throttle = 0;

      if (playerId === this.localPlayerId) {
        throttle = localThrottle;
      } else if (this.aiBots.has(playerId)) {
        throttle = this.aiBots.get(playerId)!.getThrottle();
      }

      physics.update(dt, throttle);
    }

    this.aiBots.forEach(bot => bot.update(dt));

    this.checkRaceCompletion();
  }

  private render(deltaTime: number): void {
    if (!this.renderer) return;

    for (const [playerId, physics] of this.physics) {
      const state = physics.getState();
      const wheelRotation = (state.velocity / TRACTOR_PRESETS['rookie-rust-bucket'].tires.radius) * deltaTime;
      
      this.renderer.updateTractor(playerId, state.position, wheelRotation);
    }

    this.renderer.render(deltaTime);
  }

  private handleServerState(snapshot: any): void {
    const localPhysics = this.physics.get(this.localPlayerId);
    if (!localPhysics || !this.webrtcManager) return;

    this.webrtcManager.reconcileState(snapshot, localPhysics);

    for (const [playerId, playerState] of snapshot.players) {
      if (playerId !== this.localPlayerId) {
        const physics = this.physics.get(playerId);
        if (physics) {
          // TODO: Implement interpolation for smoother remote player movement
        }
      }
    }
  }

  private checkRaceCompletion(): void {
    for (const [playerId, physics] of this.physics) {
      if (physics.getPosition() >= this.raceConfig.trackLength) {
        console.log(`Player ${playerId} finished!`);
        // TODO: Emit race finish event
      }
    }
  }

  getPlayerStates(): Map<string, PlayerState> {
    const states = new Map<string, PlayerState>();
    
    for (const [playerId, physics] of this.physics) {
      const state = physics.getState();
      states.set(playerId, {
        playerId,
        username: `Player ${playerId.slice(0, 4)}`,
        position: state.position,
        velocity: state.velocity,
        throttle: state.throttle,
        timestamp: performance.now(),
        inputSequence: 0,
        tractorConfig: {
          bodyId: 'body_rust_bucket',
          cabId: 'cab_classic',
          wheelsId: 'wheels_tractor_standard',
          paintColor: '#8B4513',
          paintMetalness: 0.3,
          paintRoughness: 0.7,
        },
        powerUps: [],
        finished: state.position >= this.raceConfig.trackLength,
      });
    }
    
    return states;
  }

  stop(): void {
    this.isRunning = false;
    this.isRaceActive = false;
  }

  destroy(): void {
    this.stop();
    this.inputManager.destroy();
    this.webrtcManager?.disconnect();
    this.renderer?.destroy?.();
  }
}
