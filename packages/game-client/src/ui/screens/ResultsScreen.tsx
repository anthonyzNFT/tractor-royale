import { useGameStore } from '../../stores/gameStore';
import { XP_CONFIG, CURRENCY_CONFIG } from '@tractor-royale/shared';

interface ResultsScreenProps {
  onBackToLobby: () => void;
  onRematch: () => void;
}

export default function ResultsScreen({ onBackToLobby, onRematch }: ResultsScreenProps) {
  const { profile, addXP, addHayBux, updateProfile } = useGameStore();

  const finalPosition = 1;
  const totalPlayers = 4;
  const raceTime = 45.2;
  const isWinner = finalPosition === 1;
  const isPodium = finalPosition <= 3;

  let xpEarned = XP_CONFIG.RACE_COMPLETE;
  let hayBuxEarned = 0;

  if (isWinner) {
    xpEarned += XP_CONFIG.WIN_BONUS;
    hayBuxEarned += CURRENCY_CONFIG.WIN_REWARD;
  } else if (isPodium) {
    xpEarned += XP_CONFIG.PODIUM_BONUS;
    hayBuxEarned += Math.floor(CURRENCY_CONFIG.WIN_REWARD / 2);
  }

  const handleContinue = () => {
    addXP(xpEarned);
    addHayBux(hayBuxEarned);
    updateProfile({
      statistics: {
        ...profile.statistics,
        totalRaces: profile.statistics.totalRaces + 1,
        wins: profile.statistics.wins + (isWinner ? 1 : 0),
        podiumFinishes: profile.statistics.podiumFinishes + (isPodium ? 1 : 0),
      },
    });
    onBackToLobby();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black z-10">
      <div className="max-w-4xl w-full mx-4">
        <div className="text-center mb-8">
          {isWinner && (
            <>
              <div className="text-9xl mb-4 animate-bounce">🏆</div>
              <h1 className="text-7xl font-display text-yellow-400 drop-shadow-2xl mb-2">
                VICTORY!
              </h1>
              <p className="text-3xl text-white">You dominated the track!</p>
            </>
          )}
          {!isWinner && isPodium && (
            <>
              <div className="text-9xl mb-4">🥈</div>
              <h1 className="text-6xl font-display text-gray-300 drop-shadow-2xl mb-2">
                PODIUM FINISH
              </h1>
              <p className="text-2xl text-white">Great race!</p>
            </>
          )}
          {!isPodium && (
            <>
              <div className="text-9xl mb-4">🏁</div>
              <h1 className="text-6xl font-display text-white drop-shadow-2xl mb-2">
                RACE COMPLETE
              </h1>
              <p className="text-2xl text-gray-400">Better luck next time!</p>
            </>
          )}
        </div>

        <div className="card backdrop-blur-sm bg-white/95">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-b from-yellow-100 to-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">FINAL POSITION</p>
              <p className="text-6xl font-display text-yellow-600">
                #{finalPosition}
              </p>
              <p className="text-sm text-gray-500 mt-2">out of {totalPlayers}</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">RACE TIME</p>
              <p className="text-5xl font-display text-blue-600">
                {raceTime.toFixed(1)}s
              </p>
              <p className="text-sm text-gray-500 mt-2">personal best</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-b from-green-100 to-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">TOP SPEED</p>
              <p className="text-5xl font-display text-green-600">
                78
              </p>
              <p className="text-sm text-gray-500 mt-2">km/h</p>
            </div>
          </div>

          <div className="border-t-2 border-gray-200 pt-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Rewards Earned</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <p className="font-bold text-gray-800">Experience Points</p>
                    <p className="text-sm text-gray-600">
                      {isWinner ? 'Winner Bonus!' : isPodium ? 'Podium Bonus!' : 'Race Completion'}
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600">+{xpEarned} XP</p>
              </div>

              {hayBuxEarned > 0 && (
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🌾</span>
                    <div>
                      <p className="font-bold text-gray-800">Hay Bux</p>
                      <p className="text-sm text-gray-600">
                        {isWinner ? 'Victory Reward!' : 'Podium Reward!'}
                      </p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">+{hayBuxEarned}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  <div>
                    <p className="font-bold text-gray-800">Stats Updated</p>
                    <p className="text-sm text-gray-600">
                      Total Races: {profile.statistics.totalRaces + 1} • 
                      Wins: {profile.statistics.wins + (isWinner ? 1 : 0)}
                    </p>
                  </div>
                </div>
                <p className="text-2xl">✅</p>
              </div>
            </div>
          </div>

          {profile.xp + xpEarned >= 1000 * Math.pow(1.5, profile.level - 1) && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-2xl font-bold text-white mb-1">LEVEL UP!</p>
              <p className="text-white">
                You've reached Level {profile.level + 1}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onRematch}
              className="btn btn-primary flex-1 text-xl py-4"
            >
              🔄 REMATCH
            </button>
            <button
              onClick={handleContinue}
              className="btn btn-success flex-1 text-xl py-4"
            >
              ➡️ CONTINUE
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleContinue}
            className="text-white hover:text-yellow-400 text-sm underline"
          >
            Skip to Lobby →
          </button>
        </div>
      </div>
    </div>
  );
}
