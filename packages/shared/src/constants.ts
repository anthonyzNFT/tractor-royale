export const GAME_CONFIG = {
  TICK_RATE: 60,
  NETWORK_SEND_RATE: 20,
  MAX_PLAYERS: 20,
  MIN_PLAYERS_FOR_RACE: 2,
  TRACK_LENGTH: 100,
  COUNTDOWN_DURATION: 3,
  AI_BOT_NAMES: [
    'Rusty Pete',
    'Farmer Joe',
    'Big Red',
    'Mudslinger',
    'Turbo Tom',
    'Daisy Duke',
    'Iron Horse',
    'Country Thunder',
  ],
} as const;

export const PHYSICS_CONFIG = {
  GRAVITY: 9.81,
  AIR_DENSITY: 1.225,
  DEFAULT_GEAR_RATIOS: [12.0, 8.0, 5.5, 3.5],
  DEFAULT_FINAL_DRIVE: 4.0,
  WHEEL_RADIUS: 0.85,
  UPSHIFT_RPM_PERCENT: 0.85,
  DOWNSHIFT_RPM_PERCENT: 0.4,
} as const;

export const WEATHER_EFFECTS = {
  clear: {
    gripModifier: 1.0,
    visibilityModifier: 1.0,
    label: 'Clear Skies',
  },
  rain: {
    gripModifier: 0.7,
    visibilityModifier: 0.8,
    label: 'Rainy',
  },
  mud: {
    gripModifier: 0.5,
    visibilityModifier: 0.9,
    label: 'Muddy Track',
  },
  storm: {
    gripModifier: 0.4,
    visibilityModifier: 0.6,
    label: 'Storm',
  },
} as const;

export const XP_CONFIG = {
  RACE_COMPLETE: 100,
  WIN_BONUS: 200,
  PODIUM_BONUS: 100,
  POWER_UP_COLLECT: 10,
  DISTANCE_XP_RATE: 1,
  LEVEL_UP_BASE: 1000,
  LEVEL_UP_MULTIPLIER: 1.5,
} as const;

export const CURRENCY_CONFIG = {
  STARTING_HAY_BUX: 1000,
  WIN_REWARD: 50,
  DAILY_LOGIN: 25,
  PART_COST_COMMON: 100,
  PART_COST_RARE: 500,
  PART_COST_EPIC: 2000,
  PART_COST_LEGENDARY: 10000,
} as const;

export const POWER_UP_CONFIG = {
  nitrous: {
    duration: 3000,
    speedBoost: 1.5,
    label: 'Nitrous Cow',
    icon: '🐮',
  },
  oil_slick: {
    duration: 2000,
    gripReduction: 0.3,
    label: 'Oil Slick',
    icon: '🛢️',
  },
  speed_magnet: {
    duration: 5000,
    pullForce: 50,
    label: 'Speed Magnet',
    icon: '🧲',
  },
  chicken_stampede: {
    duration: 4000,
    slowEffect: 0.5,
    label: 'Chicken Stampede',
    icon: '🐔',
  },
} as const;

export const ASSET_PATHS = {
  MODELS: '/assets/models',
  TEXTURES: '/assets/textures',
  AUDIO: '/assets/audio',
  SHADERS: '/assets/shaders',
} as const;

export const COLORS = {
  PRIMARY: '#FF6B35',
  SECONDARY: '#F7931E',
  SUCCESS: '#4CAF50',
  DANGER: '#F44336',
  WARNING: '#FFC107',
  INFO: '#2196F3',
  SKY: '#87CEEB',
  DIRT: '#8B4513',
  GRASS: '#228B22',
} as const;
