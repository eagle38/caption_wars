import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

export default function RankingsScreen() {
  const { state } = useGame();
  const [timeLeft, setTimeLeft] = useState(4);

  const players = Array.isArray(state.players)
    ? state.players
    : Object.values(state.players).sort((a, b) => b.score - a.score);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-10"
      style={{ background: 'var(--bg)' }}>

      <div className="mb-8 animate-slide-up">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--cream-muted)' }}>
          After photo {(state.currentImageIndex ?? state.imageIndex ?? 0) + 1}
        </p>
        <h2 className="font-display text-4xl font-800" style={{ color: 'var(--cream)' }}>
          {state.isLastImage ? '🎉 Game is literally over' : ' Rankings'}
        </h2>
      </div>

      <div className="space-y-3 flex-1 stagger">
        {players.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center gap-4 rounded-2xl px-4 py-4 animate-slide-up"
            style={{
              background: index === 0 ? 'var(--accent-soft)' : 'var(--bg-card)',
              border: index === 0 ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              transform: index === 0 ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <span className="text-xl w-7 text-center">
              {medals[index] || <span className="font-display font-700 text-sm" style={{ color: 'var(--cream-muted)' }}>{index + 1}</span>}
            </span>
            <span className="text-2xl">{player.avatar}</span>
            <p className="flex-1 font-display font-700" style={{ color: index === 0 ? 'var(--accent)' : 'var(--cream)' }}>
              {player.name}
            </p>
            <p className="font-display font-800 text-xl" style={{ color: index === 0 ? 'var(--accent)' : 'var(--cream)' }}>
              {player.score}
            </p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--cream-muted)' }}>
        {state.isLastImage ? `Final results in ${timeLeft}s...` : `Next photo in ${timeLeft}s...`}
      </p>

    </div>
  );
}