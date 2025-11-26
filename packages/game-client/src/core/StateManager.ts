import type { PlayerState, GameRoom } from '@tractor-royale/shared';

export class StateManager {
  private currentRoom: GameRoom | null = null;
  private playerStates: Map<string, PlayerState> = new Map();
  private localPlayerId: string;

  constructor(localPlayerId: string) {
    this.localPlayerId = localPlayerId;
  }

  setRoom(room: GameRoom): void {
    this.currentRoom = room;
  }

  updatePlayerState(playerId: string, state: PlayerState): void {
    this.playerStates.set(playerId, state);
  }

  getPlayerState(playerId: string): PlayerState | undefined {
    return this.playerStates.get(playerId);
  }

  getAllPlayerStates(): PlayerState[] {
    return Array.from(this.playerStates.values());
  }

  getLeaderboard(): PlayerState[] {
    return this.getAllPlayerStates().sort((a, b) => b.position - a.position);
  }

  removePlayer(playerId: string): void {
    this.playerStates.delete(playerId);
  }

  clear(): void {
    this.playerStates.clear();
    this.currentRoom = null;
  }
}
