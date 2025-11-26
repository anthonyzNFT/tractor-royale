import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { nanoid } from 'nanoid';

interface LobbyScreenProps {
  onStartGame: () => void;
  onOpenGarage: () => void;
}

export default function LobbyScreen({ onStartGame, onOpenGarage }: LobbyScreenProps) {
  const profile = useGameStore((state) => state.profile);
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleCreateRoom = () => {
    const newRoomId = nanoid(8);
    setRoomId(newRoomId);
    setIsCreatingRoom(true);
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${newRoomId}`;
    navigator.clipboard.writeText(shareUrl);
    
    alert(`Room created! Link copied to clipboard:\n${shareUrl}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      onStartGame();
    }
  };

  const handleQuickPlay = () => {
    handleCreateRoom();
    setTimeout(() => {
      onStartGame();
    }, 500);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-sky-400 to-sky-600 z-10">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-green-800 to-transparent"></div>
      </div>

      <div className="relative max-w-4xl w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-8xl font-display text-white drop-shadow-2xl mb-4 tracking-wider">
            TRACTOR ROYALE
          </h1>
          <p className="text-2xl text-yellow-300 font-bold drop-shadow-lg">
            Rev, Race, Reign
          </p>
        </div>

        <div className="card max-w-2xl mx-auto backdrop-blur-sm bg-white/90">
          <div className="mb-6 pb-6 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{profile.username}</h3>
                <p className="text-gray-600">Level {profile.level} • {profile.xp} XP</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">🌾 {profile.hayBux}</p>
                <p className="text-sm text-gray-600">Hay Bux</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={handleQuickPlay}
              className="btn btn-primary w-full text-xl py-4"
            >
              🎮 QUICK PLAY
            </button>

            <div className="flex gap-4">
              <button
                onClick={handleCreateRoom}
                className="btn btn-secondary flex-1 text-lg"
              >
                ➕ Create Room
              </button>
              <button
                onClick={onOpenGarage}
                className="btn btn-success flex-1 text-lg"
              >
                🚜 Garage
              </button>
            </div>
          </div>

          {isCreatingRoom && (
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg mb-4">
              <p className="text-green-800 font-bold mb-2">✅ Room Created!</p>
              <p className="text-sm text-green-700">Room ID: {roomId}</p>
              <p className="text-xs text-green-600 mt-1">Share link copied to clipboard</p>
            </div>
          )}

          <div className="border-t-2 border-gray-200 pt-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Join Existing Room
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="input flex-1"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{profile.statistics.totalRaces}</p>
              <p className="text-xs text-gray-600">Races</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{profile.statistics.wins}</p>
              <p className="text-xs text-gray-600">Wins</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {profile.statistics.wins > 0 
                  ? Math.round((profile.statistics.wins / profile.statistics.totalRaces) * 100) 
                  : 0}%
              </p>
              <p className="text-xs text-gray-600">Win Rate</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-white drop-shadow-lg">
          <p className="text-sm opacity-80">
            Press SPACE, W, or CLICK to accelerate • 4-20 players • AI bot fill
          </p>
        </div>
      </div>
    </div>
  );
}
