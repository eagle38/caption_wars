import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useWS } from '../context/WebSocketContext';
import Timer from '../components/Timer';
import { PrimaryButton } from '../components/ui/Button';

export default function VotingScreen() {
  const { state, myPlayer } = useGame();
  const { send } = useWS();
  const [selectedId, setSelectedId] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const captions = Object.entries(state.captions);
  const votable = captions.filter(([id]) => id !== myPlayer?.playerId);

  function handleVote() {
    if (!selectedId || submitted) return;
    send('SUBMIT_VOTE', { votedFor: selectedId });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--bg)' }}>
        
        <p className="font-display text-2xl font-700 mb-2 animate-slide-up"
          style={{ color: 'var(--green)' }}>Vote in!</p>
        <p className="text-sm mb-8 animate-slide-up" style={{ color: 'var(--cream-dim)' }}>
          Waiting for everyone...
        </p>
        <div className="px-8 py-4 rounded-2xl animate-slide-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--cream-muted)' }}>Votes in</p>
          <p className="font-display text-3xl font-700" style={{ color: 'var(--cream)' }}>
            {state.submittedCount}
            <span className="text-lg font-400" style={{ color: 'var(--cream-muted)' }}>
              /{state.totalPlayers}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--cream-muted)' }}>
            Photo {state.imageIndex + 1} of {state.totalImages}
          </p>
          <p className="font-display text-lg font-700 mt-0.5" style={{ color: 'var(--cream)' }}>
            Pick the best!
          </p>
        </div>
        <Timer maxSeconds={state.config?.votingTimerSeconds || 30} />
      </div>

      {/* Photo */}
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden flex-shrink-0"
        style={{ border: '1px solid var(--border)' }}>
        <img
          src={state.imageData}
          alt="Caption this"
          className="w-full object-cover"
          style={{ maxHeight: '35vh' }}
        />
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
        {votable.map(([playerId, caption], index) => {
          const letter = String.fromCharCode(65 + captions.findIndex(([id]) => id === playerId));
          const isSelected = selectedId === playerId;
          return (
            <button
              key={playerId}
              onClick={() => setSelectedId(playerId)}
              className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all active:scale-98"
              style={{
                background: isSelected ? 'var(--accent-soft)' : 'var(--bg-card)',
                border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border)',
              }}
            >
              <span className="font-display font-800 text-xl min-w-[1.5rem]"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--cream-muted)' }}>
                {letter}
              </span>
              <p className="text-base leading-snug flex-1"
                style={{ color: isSelected ? 'var(--cream)' : 'var(--cream-dim)' }}>
                {caption}
              </p>
              {isSelected && (
                <span style={{ color: 'var(--accent)' }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <div className="px-5 pb-8 pt-3">
        <PrimaryButton onClick={handleVote} disabled={!selectedId}>
          Submit Vote 🗳️
        </PrimaryButton>
      </div>

    </div>
  );
}