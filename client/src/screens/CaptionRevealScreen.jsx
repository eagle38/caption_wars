import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

export default function CaptionRevealScreen({ onComplete }) {
  const { state } = useGame();

  const revealOrder = [...state.results]
    .filter(r => r.votes > 0)
    .sort((a, b) => a.votes - b.votes);

  const [index, setIndex] = useState(0);
  const [showVoters, setShowVoters] = useState(false);

  useEffect(() => {
    if (revealOrder.length === 0) { onComplete(); return; }
    setShowVoters(false);
    const t1 = setTimeout(() => setShowVoters(true), 1500);
    const t2 = setTimeout(() => {
      if (index < revealOrder.length - 1) setIndex(i => i + 1);
      else onComplete();
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [index, revealOrder.length]);

  if (revealOrder.length === 0) return null;

  const current = revealOrder[index];
  const voters = (state.votesMap || {})[current.playerId] || [];
  const isWinner = index === revealOrder.length - 1;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-10"
      style={{ background: 'var(--bg)' }}>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8 animate-fade-in">
        {revealOrder.map((_, i) => (
          <div key={i} className="h-1 rounded-full transition-all duration-500 flex-1"
            style={{ background: i <= index ? 'var(--accent)' : 'var(--border)' }} />
        ))}
      </div>

      {/* Photo thumbnail */}
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ border: '1px solid var(--border)', maxHeight: '28vh' }}>
        <img src={state.imageData} alt="" className="w-full object-cover" style={{ maxHeight: '28vh' }} />
      </div>

      {/* Caption card */}
      <div className="rounded-2xl p-5 mb-5 animate-slide-up"
        style={{
          background: isWinner && showVoters ? 'var(--accent-soft)' : 'var(--bg-card)',
          border: isWinner && showVoters ? '2px solid var(--accent-border)' : '1px solid var(--border)',
        }}>

        {isWinner && (
          <div className="text-2xl mb-3">{showVoters ? '👑' : '❓'}</div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{current.avatar}</span>
          <span className="font-display font-700"
            style={{ color: isWinner && showVoters ? 'var(--accent)' : 'var(--cream-dim)' }}>
            {current.name}
          </span>
        </div>

        <p className="text-xl font-display font-700 leading-snug mb-3"
          style={{ color: 'var(--cream)' }}>
          "{current.caption}"
        </p>

        {showVoters && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-700 font-display"
            style={{
              background: isWinner ? 'var(--accent)' : 'var(--bg-elevated)',
              color: isWinner ? 'var(--cream)' : 'var(--cream-dim)',
            }}>
            {current.votes} {current.votes === 1 ? 'vote' : 'votes'}
            {isWinner && ' 🏆'}
          </span>
        )}
      </div>

      {/* Voters */}
      {showVoters && voters.length > 0 && (
        <div className="animate-fade-in">
          <p className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--cream-muted)' }}>Voted by</p>
          <div className="flex flex-wrap gap-2">
            {voters.map((name, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-sm font-500"
                style={{ background: 'var(--bg-card)', color: 'var(--cream)', border: '1px solid var(--border)' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 flex items-center gap-2"
        style={{ color: 'var(--cream-muted)' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
        <p className="text-xs">
          {index < revealOrder.length - 1 ? 'Next caption...' : 'Results coming...'}
        </p>
      </div>

    </div>
  );
}