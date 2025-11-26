export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface TractorPhysicsState {
  position: number;
  velocity: number;
  rpm: number;
  throttle: number;
  wheelSlip: number;
  currentGear: number;
}

export interface PlayerState {
  playerId: string;
  username: string;
  position: number;
  velocity: number;
  throttle: number;
  timestamp: number;
  inputSequence: number;
  tractorConfig: TractorConfig;
  powerUps: PowerUp[];
  lapTime?: number;
  finished: boolean;
}

export interface TractorConfig {
  bodyId: string;
  cabId: string;
  wheelsId: string;
  exhaustId?: string;
  hatId?: string;
  cowCatcherId?: string;
  decalIds?: string[];
  paintColor: string;
  paintMetalness: number;
  paintRoughness: number;
}

export interface PowerUp {
  type: 'nitrous' | 'oil_slick' | 'speed_magnet' | 'chicken_stampede';
  duration: number;
  strength: number;
  position?: number;
}

export interface RaceConfig {
  trackLength: number;
  maxPlayers: number;
  weatherType: WeatherType;
  powerUpsEnabled: boolean;
  countdown: number;
}

export type WeatherType = 'clear' | 'rain' | 'mud' | 'storm';

export interface GameRoom {
  roomId: string;
  hostId: string;
  players: Map<string, PlayerState>;
  config: RaceConfig;
  state: RoomState;
  createdAt: number;
}

export type RoomState = 'lobby' | 'countdown' | 'racing' | 'finished';

export interface LeaderboardEntry {
  playerId: string;
  username: string;
  bestTime: number;
  wins: number;
  races: number;
  xp: number;
  level: number;
}

export interface PlayerProfile {
  playerId: string;
  username: string;
  xp: number;
  level: number;
  hayBux: number;
  ownedParts: string[];
  equippedTractor: TractorConfig;
  statistics: PlayerStatistics;
  createdAt: number;
  lastLoginAt: number;
}

export interface PlayerStatistics {
  totalRaces: number;
  wins: number;
  podiumFinishes: number;
  totalDistance: number;
  bestLapTime: number;
  powerUpsCollected: number;
  tractorsCustomized: number;
}

export interface DailyChallenge {
  id: string;
  description: string;
  target: number;
  progress: number;
  reward: {
    xp: number;
    hayBux: number;
  };
  expiresAt: number;
}

export interface Season {
  id: number;
  name: string;
  startDate: number;
  endDate: number;
  rewards: SeasonReward[];
  currentLevel: number;
}

export interface SeasonReward {
  level: number;
  type: 'part' | 'currency' | 'title';
  itemId: string;
  amount: number;
}
