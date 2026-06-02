import { useGame } from '../context/GameContext';
import { useWS } from '../context/WebSocketContext';
import { PrimaryButton } from '../components/ui/Button';

export default function ResultsScreen() {
  const { state, myPlayer } = useGame();
  const { send } = useWS();
  const isHost = myPlayer?.isHost;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      <div className="px-5 pt-10 pb-4">
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--cream-muted)' }}>
          Photo {state.imageIndex + 1} results
        </p>
        <h2 className="font-display text-3xl font-800 mt-1" style={{ color: 'var(--cream)' }}>
          Results 
        </h2>
      </div>

      {/* Photo thumbnail */}
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', maxHeight: '25vh' }}>
        <img src={state.imageData} alt="" className="w-full object-cover" style={{ maxHeight: '25vh' }} />
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3 stagger">
        {state.results.map((result, index) => (
          <div
            key={result.playerId}
            className="rounded-2xl p-4 flex items-center gap-3 animate-slide-up"
            style={{
              background: index === 0 && result.votes > 0 ? 'var(--accent-soft)' : 'var(--bg-card)',
              border: index === 0 && result.votes > 0 ? '1px solid var(--accent-border)' : '1px solid var(--border)',
            }}
          >
            <span className="text-xl w-7 text-center">
              {index === 0 && result.votes > 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
            </span>
            <span className="text-2xl">{result.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-700 text-sm" style={{ color: 'var(--cream)' }}>
                {result.name}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--cream-dim)' }}>
                "{result.caption}"
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display font-700" style={{ color: 'var(--cream)' }}>
                {result.votes}v
              </p>
              {result.pointsEarned > 0 && (
                <p className="text-xs" style={{ color: 'var(--accent)' }}>
                  +{result.pointsEarned}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-8 pt-3">
        {isHost ? (
          <PrimaryButton onClick={() => send('NEXT', {})}>
            Next →
          </PrimaryButton>
        ) : (
          <p className="text-center text-sm" style={{ color: 'var(--cream-muted)' }}>
            Waiting for host...
          </p>
        )}
      </div>

    </div>
  );
}