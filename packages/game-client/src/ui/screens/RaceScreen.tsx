import { useEffect, useState } from 'react';
import { GameEngine } from '../../core/Engine';
import { useGameStore } from '../../stores/gameStore';
import type { PlayerState } from '@tractor-royale/shared';
import { GAME_CONFIG } from '@tractor-royale/shared';

interface RaceScreenProps {
  engine: GameEngine;
  onFinish: () => void;
}

export default function RaceScreen({ engine, onFinish }: RaceScreenProps) {
  const profile = useGameStore((state) => state.profile);
  const [countdown, setCountdown] = useState(GAME_CONFIG.COUNTDOWN_DURATION);
  const [raceStarted, setRaceStarted] = useState(false);
  const [playerStates, setPlayerStates] = useState<Map<string, PlayerState>>(new Map());
  const [raceTime, setRaceTime] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const signalingServer = 'ws://localhost:3001';
    const roomId = new URLSearchParams(window.location.search).get('room') || 'default';
    const isHost = !new URLSearchParams(window.location.search).has('room');

    engine.initMultiplayer(profile.playerId, roomId, isHost, signalingServer).then(() => {
      engine.addPlayer(profile.playerId);
      
      for (let i = 0; i < 3; i++) {
        const botId = `bot_${i}`;
        engine.addPlayer(botId, true);
      }
    });

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setRaceStarted(true);
          engine.startRace();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [engine, profile.playerId]);

  useEffect(() => {
    if (!raceStarted) return;

    const interval = setInterval(() => {
      const states = engine.getPlayerStates();
      setPlayerStates(states);
      setRaceTime((prev) => prev + 0.1);

      let allFinished = true;
      for (const state of states.values()) {
        if (state.playerId === profile.playerId && state.finished && !finished) {
          setFinished(true);
          setTimeout(() => {
            onFinish();
          }, 3000);
        }
        if (!state.finished) {
          allFinished = false;
        }
      }

      if (allFinished && !finished) {
        setFinished(true);
        setTimeout(() => {
          onFinish();
        }, 3000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [raceStarted, engine, profile.playerId, finished, onFinish]);

  const sortedPlayers = Array.from(playerStates.values()).sort((a, b) => b.position - a.position);
  const localPlayer = playerStates.get(profile.playerId);
  const localPosition = sortedPlayers.findIndex(p => p.playerId === profile.playerId) + 1;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {!raceStarted && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="text-center">
            <div className="text-9xl font-display text-white drop-shadow-2xl animate-pulse">
              {countdown}
            </div>
            <p className="text-3xl text-yellow-300 font-bold mt-4">Get Ready!</p>
          </div>
        </div>
      )}

      {raceStarted && (
        <>
          <div className="absolute top-4 left-4 space-y-2">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">POSITION</span>
                <span className="text-3xl font-display text-yellow-400">
                  {localPosition}/{sortedPlayers.length}
                </span>
              </div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                  style={{ width: `${((localPlayer?.position || 0) / GAME_CONFIG.TRACK_LENGTH) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-300">
                {Math.round(localPlayer?.position || 0)}m / {GAME_CONFIG.TRACK_LENGTH}m
              </div>
            </div>

            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
              <div className="text-xs text-gray-400 mb-1">SPEED</div>
              <div className="text-2xl font-bold">
                {Math.round((localPlayer?.velocity || 0) * 3.6)} <span className="text-sm">km/h</span>
              </div>
            </div>

            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
              <div className="text-xs text-gray-400 mb-1">TIME</div>
              <div className="text-xl font-mono">{raceTime.toFixed(1)}s</div>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white min-w-[250px]">
            <div className="text-sm font-bold mb-3 text-yellow-400">LEADERBOARD</div>
            <div className="space-y-2">
              {sortedPlayers.slice(0, 5).map((player, index) => (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-2 rounded ${
                    player.playerId === profile.playerId
                      ? 'bg-primary/30 border border-primary'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-yellow-400">#{index + 1}</span>
                    <span className="text-sm truncate max-w-[120px]">
                      {player.playerId === profile.playerId ? 'YOU' : player.username}
                    </span>
                  </div>
                  <span className="text-xs text-gray-300">
                    {Math.round(player.position)}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3 text-white text-center">
              <p className="text-sm font-bold">HOLD TO ACCELERATE</p>
              <p className="text-xs text-gray-400 mt-1">SPACE • W • CLICK • TOUCH</p>
            </div>
          </div>

          {finished && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="text-center animate-bounce">
                <div className="text-8xl mb-4">🏁</div>
                <div className="text-6xl font-display text-white drop-shadow-2xl mb-2">
                  FINISHED!
                </div>
                <div className="text-3xl text-yellow-400 font-bold">
                  Position: #{localPosition}
                </div>
                <p className="text-white mt-4">Loading results...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
