import { useEffect, useState } from 'react';
import { GameEngine } from './core/Engine';
import { useGameStore } from './stores/gameStore';
import LobbyScreen from './ui/screens/LobbyScreen';
import GarageScreen from './ui/screens/GarageScreen';
import RaceScreen from './ui/screens/RaceScreen';
import ResultsScreen from './ui/screens/ResultsScreen';

type Screen = 'lobby' | 'garage' | 'race' | 'results';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
  const [engine, setEngine] = useState<GameEngine | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    document.body.appendChild(canvas);

    const gameEngine = new GameEngine(canvas);
    setEngine(gameEngine);

    return () => {
      gameEngine.destroy();
      canvas.remove();
    };
  }, []);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  return (
    <div className="relative w-full h-full">
      {currentScreen === 'lobby' && (
        <LobbyScreen 
          onStartGame={() => navigateTo('race')}
          onOpenGarage={() => navigateTo('garage')}
        />
      )}
      
      {currentScreen === 'garage' && (
        <GarageScreen 
          onBack={() => navigateTo('lobby')}
        />
      )}
      
      {currentScreen === 'race' && engine && (
        <RaceScreen 
          engine={engine}
          onFinish={() => navigateTo('results')}
        />
      )}
      
      {currentScreen === 'results' && (
        <ResultsScreen 
          onBackToLobby={() => navigateTo('lobby')}
          onRematch={() => navigateTo('race')}
        />
      )}
    </div>
  );
}

export default App;
