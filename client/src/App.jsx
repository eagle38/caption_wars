import { useState, useEffect } from 'react';
import { WebSocketProvider } from './context/WebSocketContext';
import { GameProvider, useGame } from './context/GameContext';

import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import CaptioningScreen from './screens/CaptioningScreen';
import VotingScreen from './screens/VotingScreen';
import ResultsScreen from './screens/ResultsScreen';
import CaptionRevealScreen from './screens/CaptionRevealScreen';
import RankingsScreen from './screens/RankingsScreen';
import GameOverScreen from './screens/GameOverScreen';

function Game() {
  const { state } = useGame();
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (state.phase === 'results') setRevealing(true);
    else setRevealing(false);
  }, [state.phase, state.imageIndex]);

  if (state.phase === 'results' && revealing) {
    return (
      <CaptionRevealScreen
        key={`reveal-${state.imageIndex}`}
        onComplete={() => setRevealing(false)}
      />
    );
  }

  switch (state.phase) {
    case 'home':        return <HomeScreen />;
    case 'lobby':       return <LobbyScreen />;
    case 'captioning':
      return <CaptioningScreen key={`caption-${state.imageIndex}`} />;
    case 'voting':
      return <VotingScreen key={`vote-${state.imageIndex}`} />;
    case 'results':     return <ResultsScreen />;
    case 'rankings':
      return <RankingsScreen key={`rank-${state.imageIndex}`} />;
    case 'gameover':    return <GameOverScreen />;
    default:            return <HomeScreen />;
  }
}

export default function App() {
  return (
    <WebSocketProvider>
      <GameProvider>
        <div className="max-w-md mx-auto min-h-screen">
          <Game />
        </div>
      </GameProvider>
    </WebSocketProvider>
  );
}