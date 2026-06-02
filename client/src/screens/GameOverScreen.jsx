import { useGame } from '../context/GameContext';

export default function GameOverScreen() {
  const { state, dispatch } = useGame();

  const players = Array.isArray(state.players)
    ? state.players
    : Object.values(state.players).sort((a, b) => b.score - a.score);

  const winner = players[0];
  const medals = ['🥇', '🥈', '🥉'];

  function handlePlayAgain() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10 items-center"
      style={{ background: 'var(--bg)' }}>

      <div className="text-7xl mb-4 animate-slide-up">🏆</div>
      <h1 className="font-display text-5xl font-800 mb-1 animate-slide-up"
        style={{ color: 'var(--cream)' }}>
        I think the game is over now
      </h1>
      <p className="text-sm mb-10 animate-slide-up" style={{ color: 'var(--cream-dim)' }}>
        You werent lame at all, until next time.
      </p>

      {winner && (
        <div className="w-full max-w-sm rounded-3xl p-6 text-center mb-8 animate-slide-up animate-pulse-ring"
          style={{
            background: 'var(--accent-soft)',
            border: '2px solid var(--accent-border)',
          }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            Winner
          </p>
          <span className="text-5xl">{winner.avatar}</span>
          <h2 className="font-display text-3xl font-800 mt-3 mb-1" style={{ color: 'var(--cream)' }}>
            {winner.name}
          </h2>
          <p className="font-display text-2xl font-700" style={{ color: 'var(--accent)' }}>
            {winner.score} pts
          </p>
        </div>
      )}

      <div className="w-full max-w-sm space-y-3 stagger mb-10">
        {players.slice(1).map((player, index) => (
          <div
            key={player.id}
            className="flex items-center gap-4 rounded-2xl px-4 py-3 animate-slide-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <span className="text-lg">{medals[index + 1] || `${index + 2}.`}</span>
            <span className="text-2xl">{player.avatar}</span>
            <p className="flex-1 font-display font-600" style={{ color: 'var(--cream)' }}>
              {player.name}
            </p>
            <p className="font-display font-700" style={{ color: 'var(--cream-dim)' }}>
              {player.score}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={handlePlayAgain}
        className="w-full max-w-sm py-4 rounded-2xl font-display font-700 text-lg tracking-wide transition-all active:scale-95"
        style={{
          background: 'var(--accent)',
          color: 'var(--cream)',
          boxShadow: '0 4px 24px rgba(255,77,28,0.35)',
        }}
      >
        I want to play again 🎮
      </button>

    </div>
  );
}