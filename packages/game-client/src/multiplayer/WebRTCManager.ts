import SimplePeer from 'simple-peer';
import type { Instance } from 'simple-peer';
import type { PlayerState } from '@tractor-royale/shared';

export interface GameStateSnapshot {
  tick: number;
  timestamp: number;
  players: Map<string, PlayerState>;
}

type MessageType = 
  | { type: 'state'; data: GameStateSnapshot }
  | { type: 'input'; playerId: string; throttle: number; sequence: number; timestamp: number }
  | { type: 'join'; playerId: string; tractorConfig: any }
  | { type: 'chat'; playerId: string; message: string };

export class WebRTCManager {
  private localPlayerId: string;
  private isHost: boolean;
  private peers: Map<string, Instance> = new Map();
  private signalingServer: string;
  
  private inputHistory: Array<{ sequence: number; throttle: number; timestamp: number }> = [];
  private lastServerTick = 0;
  private localSequence = 0;
  
  private onStateUpdate?: (snapshot: GameStateSnapshot) => void;
  private onPlayerJoin?: (playerId: string) => void;
  private onPlayerLeave?: (playerId: string) => void;
  private onChatMessage?: (playerId: string, message: string) => void;

  constructor(config: {
    localPlayerId: string;
    isHost: boolean;
    signalingServer: string;
  }) {
    this.localPlayerId = config.localPlayerId;
    this.isHost = config.isHost;
    this.signalingServer = config.signalingServer;
  }

  async connectToRoom(roomId: string): Promise<void> {
    const ws = new WebSocket(`${this.signalingServer}?room=${roomId}&player=${this.localPlayerId}`);
    
    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'peer-list') {
        for (const peerId of message.peers) {
          if (peerId !== this.localPlayerId) {
            await this.connectToPeer(peerId, true);
          }
        }
      }
      
      if (message.type === 'signal') {
        const { from, signal } = message;
        
        if (!this.peers.has(from)) {
          await this.connectToPeer(from, false);
        }
        
        this.peers.get(from)?.signal(signal);
      }
      
      if (message.type === 'player-left') {
        this.handlePlayerLeave(message.playerId);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Signaling WebSocket error:', error);
    };
  }

  private async connectToPeer(peerId: string, initiator: boolean): Promise<void> {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    this.peers.set(peerId, peer);

    peer.on('signal', (signal) => {
      this.sendSignal(peerId, signal);
    });

    peer.on('connect', () => {
      console.log(`Connected to peer: ${peerId}`);
      this.onPlayerJoin?.(peerId);
    });

    peer.on('data', (data) => {
      const message = JSON.parse(data.toString()) as MessageType;
      this.handleMessage(peerId, message);
    });

    peer.on('error', (err) => {
      console.error(`Peer ${peerId} error:`, err);
    });

    peer.on('close', () => {
      this.handlePlayerLeave(peerId);
    });
  }

  sendInput(throttle: number): void {
    this.localSequence++;
    const input = {
      throttle,
      sequence: this.localSequence,
      timestamp: performance.now(),
    };
    
    this.inputHistory.push(input);
    
    if (this.inputHistory.length > 60) {
      this.inputHistory.shift();
    }
    
    const message: MessageType = {
      type: 'input',
      playerId: this.localPlayerId,
      throttle: input.throttle,
      sequence: input.sequence,
      timestamp: input.timestamp,
    };
    
    this.broadcast(message);
  }

  processInputsAndBroadcastState(
    localPhysics: Map<string, any>,
    inputs: Map<string, { throttle: number; sequence: number }>
  ): void {
    if (!this.isHost) return;
    
    for (const [playerId, input] of inputs) {
      const physics = localPhysics.get(playerId);
      if (physics) {
        physics.update(1 / 60, input.throttle);
      }
    }
    
    const snapshot: GameStateSnapshot = {
      tick: ++this.lastServerTick,
      timestamp: performance.now(),
      players: new Map(),
    };
    
    for (const [playerId, physics] of localPhysics) {
      snapshot.players.set(playerId, {
        playerId,
        username: `Player ${playerId.slice(0, 4)}`,
        position: physics.getPosition(),
        velocity: physics.getVelocity(),
        throttle: inputs.get(playerId)?.throttle || 0,
        timestamp: snapshot.timestamp,
        inputSequence: inputs.get(playerId)?.sequence || 0,
        tractorConfig: {
          bodyId: 'body_rust_bucket',
          cabId: 'cab_classic',
          wheelsId: 'wheels_tractor_standard',
          paintColor: '#8B4513',
          paintMetalness: 0.3,
          paintRoughness: 0.7,
        },
        powerUps: [],
        finished: false,
      });
    }
    
    const message: MessageType = {
      type: 'state',
      data: snapshot,
    };
    
    this.broadcast(message);
  }

  reconcileState(serverSnapshot: GameStateSnapshot, localPhysics: any): void {
    const serverState = serverSnapshot.players.get(this.localPlayerId);
    if (!serverState) return;
    
    const firstUnacked = this.inputHistory.findIndex(
      input => input.sequence > serverState.inputSequence
    );
    
    if (firstUnacked === -1) {
      localPhysics.deserialize(JSON.stringify({
        position: serverState.position,
        velocity: serverState.velocity,
        throttle: serverState.throttle,
      }));
      return;
    }
    
    localPhysics.deserialize(JSON.stringify({
      position: serverState.position,
      velocity: serverState.velocity,
      throttle: serverState.throttle,
    }));
    
    const dt = 1 / 60;
    for (let i = firstUnacked; i < this.inputHistory.length; i++) {
      localPhysics.update(dt, this.inputHistory[i].throttle);
    }
    
    this.inputHistory = this.inputHistory.slice(firstUnacked);
  }

  private handleMessage(peerId: string, message: MessageType): void {
    switch (message.type) {
      case 'state':
        if (!this.isHost) {
          this.onStateUpdate?.(message.data);
        }
        break;
        
      case 'input':
        if (this.isHost) {
          // Process in main game loop
        }
        break;
        
      case 'join':
        this.onPlayerJoin?.(message.playerId);
        break;
        
      case 'chat':
        this.onChatMessage?.(message.playerId, message.message);
        break;
    }
  }

  private handlePlayerLeave(playerId: string): void {
    this.peers.delete(playerId);
    this.onPlayerLeave?.(playerId);
  }

  private broadcast(message: MessageType): void {
    const data = JSON.stringify(message);
    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(data);
      }
    }
  }

  private sendSignal(peerId: string, signal: any): void {
    // Send through WebSocket signaling server
  }

  setOnStateUpdate(callback: (snapshot: GameStateSnapshot) => void): void {
    this.onStateUpdate = callback;
  }

  setOnPlayerJoin(callback: (playerId: string) => void): void {
    this.onPlayerJoin = callback;
  }

  setOnPlayerLeave(callback: (playerId: string) => void): void {
    this.onPlayerLeave = callback;
  }

  setOnChatMessage(callback: (playerId: string, message: string) => void): void {
    this.onChatMessage = callback;
  }

  disconnect(): void {
    for (const peer of this.peers.values()) {
      peer.destroy();
    }
    this.peers.clear();
  }
}
