import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useWS } from '../context/WebSocketContext';
import Timer from '../components/Timer';
import { PrimaryButton } from '../components/ui/Button';

export default function CaptioningScreen() {
  const { state, myPlayer } = useGame();
  const { send } = useWS();
  const [caption, setCaption] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!caption.trim() || submitted) return;
    send('SUBMIT_CAPTION', { caption: caption.trim() });
    setSubmitted(true);
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
            Write a caption!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-right" style={{ color: 'var(--cream-muted)' }}>
            <span style={{ color: state.submittedCount === state.totalPlayers ? 'var(--green)' : 'var(--cream)' }}
              className="font-display font-700 text-base">
              {state.submittedCount}
            </span>/{state.totalPlayers}
          </div>
          <Timer maxSeconds={state.config?.captionTimerSeconds || 60} />
        </div>
      </div>

      {/* Photo */}
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden flex-shrink-0"
        style={{ border: '1px solid var(--border)' }}>
        <img
          src={state.imageData}
          alt="Caption this"
          className="w-full object-cover"
          style={{ maxHeight: '42vh' }}
        />
      </div>

      {/* Caption input or submitted state */}
      <div className="flex-1 flex flex-col px-5 pb-8">
        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up">
            <div className="text-4xl mb-4">✍️</div>
            <p className="font-display text-xl font-700 mb-2" style={{ color: 'var(--green)' }}>
              Caption submitted!
            </p>
            <p className="text-sm px-6 mb-6" style={{ color: 'var(--cream-dim)' }}>
              "{caption}"
            </p>
            <div className="px-6 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--cream-muted)' }}>Waiting for others</p>
              <p className="font-display text-2xl font-700 mt-1" style={{ color: 'var(--cream)' }}>
                {state.submittedCount}
                <span className="text-base font-400" style={{ color: 'var(--cream-muted)' }}>
                  /{state.totalPlayers}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Something funny..."
              maxLength={120}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none mb-2 flex-shrink-0"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--cream)',
                border: '1px solid var(--border)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
            <p className="text-xs text-right mb-4" style={{ color: 'var(--cream-muted)' }}>
              {caption.length}/120
            </p>
            <PrimaryButton onClick={handleSubmit} disabled={!caption.trim()}>
              Submit Caption 🚀
            </PrimaryButton>
          </>
        )}
      </div>

    </div>
  );
}