import type { PlayerState, GameRoom, TractorConfig, PowerUp } from './types';

export enum MessageType {
  // Connection
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  
  // Game State
  GAME_STATE = 'game_state',
  INPUT = 'input',
  PLAYER_UPDATE = 'player_update',
  
  // Race Control
  START_COUNTDOWN = 'start_countdown',
  START_RACE = 'start_race',
  FINISH_RACE = 'finish_race',
  RACE_RESULTS = 'race_results',
  
  // Power-ups
  POWER_UP_SPAWN = 'power_up_spawn',
  POWER_UP_COLLECT = 'power_up_collect',
  POWER_UP_USE = 'power_up_use',
  
  // Chat
  CHAT_MESSAGE = 'chat_message',
  EMOJI_REACTION = 'emoji_reaction',
  
  // Signaling
  SIGNAL = 'signal',
  PEER_LIST = 'peer_list',
}

export interface BaseMessage {
  type: MessageType;
  timestamp: number;
}

export interface JoinRoomMessage extends BaseMessage {
  type: MessageType.JOIN_ROOM;
  roomId: string;
  playerId: string;
  username: string;
  tractorConfig: TractorConfig;
}

export interface LeaveRoomMessage extends BaseMessage {
  type: MessageType.LEAVE_ROOM;
  playerId: string;
}

export interface GameStateMessage extends BaseMessage {
  type: MessageType.GAME_STATE;
  tick: number;
  players: PlayerState[];
  powerUps: Array<{ id: string; type: PowerUp['type']; position: number }>;
}

export interface InputMessage extends BaseMessage {
  type: MessageType.INPUT;
  playerId: string;
  throttle: number;
  sequence: number;
}

export interface ChatMessage extends BaseMessage {
  type: MessageType.CHAT_MESSAGE;
  playerId: string;
  username: string;
  message: string;
}

export interface SignalMessage extends BaseMessage {
  type: MessageType.SIGNAL;
  from: string;
  to: string;
  signal: any;
}

export type GameMessage =
  | JoinRoomMessage
  | LeaveRoomMessage
  | GameStateMessage
  | InputMessage
  | ChatMessage
  | SignalMessage;

export function encodeMessage(message: GameMessage): string {
  return JSON.stringify(message);
}

export function decodeMessage(data: string): GameMessage {
  return JSON.parse(data);
}
