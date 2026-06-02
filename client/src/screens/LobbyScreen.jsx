import { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useWS } from '../context/WebSocketContext';
import { PrimaryButton } from '../components/ui/Button';
import Card from '../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`;

export default function LobbyScreen() {
  const { state, myPlayer } = useGame();
  const { send } = useWS();
  const isHost = myPlayer?.isHost;
  const players = Object.values(state.players);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [gameError, setGameError] = useState('');

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = 25 - state.imageCount;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    toUpload.forEach(file => formData.append('images', file));

    try {
      const res = await fetch(`${API_URL}/upload/${state.roomCode}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) setUploadError(data.error || 'Upload failed');
    } catch {
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleStart() {
    if (state.imageCount === 0) { setGameError('Upload at least 1 photo first'); return; }
    if (players.length < 2) { setGameError('Need at least 2 players'); return; }
    send('START_GAME', {});
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-10"
      style={{ background: 'var(--bg)' }}>

      {/* Room code display */}
      <div className="animate-slide-up mb-8">
        <p className="text-xs uppercase tracking-widest mb-2"
          style={{ color: 'var(--cream-muted)' }}>
          Room Code
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-5xl font-800 tracking-widest"
            style={{ color: 'var(--accent)' }}>
            {state.roomCode}
          </h1>
          {isHost && (
            <span className="text-xs px-2 py-1 rounded-md font-display"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
              HOST
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--cream-dim)' }}>
          Share this code with your friends
        </p>
      </div>

      {/* Players */}
      <div className="mb-6 animate-slide-up">
        <p className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--cream-muted)' }}>
          Players ({players.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl animate-fade-in"
              style={{
                background: 'var(--bg-card)',
                border: p.isHost ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              }}
            >
              <span className="text-xl">{p.avatar}</span>
              <span className="text-sm font-500" style={{ color: 'var(--cream)' }}>
                {p.name}
              </span>
              {p.isHost && (
                <span className="text-xs" style={{ color: 'var(--accent)' }}>👑</span>
              )}
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--cream-muted)' }}>
              Waiting for players...
            </p>
          )}
        </div>
      </div>

      {/* Upload section — host only */}
      {isHost && (
        <div className="mb-6 animate-slide-up">
          <p className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--cream-muted)' }}>
            Photos ({state.imageCount}/25)
          </p>

          {/* Upload progress bar */}
          <div className="h-1.5 rounded-full mb-4 overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(state.imageCount / 25) * 100}%`,
                background: 'var(--accent)',
              }}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || state.imageCount >= 25}
            className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-500 transition-all active:scale-95 flex flex-col items-center gap-2"
            style={{
              borderColor: uploading ? 'var(--accent)' : 'var(--border-hover)',
              color: 'var(--cream-dim)',
              background: uploading ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            <span className="text-2xl">{uploading ? '⏳' : '📷'}</span>
            <span>{uploading ? 'Uploading...' : state.imageCount >= 25 ? 'Max photos reached' : 'Tap to upload photos'}</span>
            {state.imageCount > 0 && !uploading && (
              <span style={{ color: 'var(--green)' }}>
                ✓ {state.imageCount} photo{state.imageCount !== 1 ? 's' : ''} ready
              </span>
            )}
          </button>

          {uploadError && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--accent)' }}>
              {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Non-host waiting message */}
      {!isHost && (
        <Card className="mb-6 text-center animate-slide-up">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-sm" style={{ color: 'var(--cream-dim)' }}>
            Waiting for host to upload photos and start the game...
          </p>
          {state.imageCount > 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--green)' }}>
              {state.imageCount} photo{state.imageCount !== 1 ? 's' : ''} uploaded
            </p>
          )}
        </Card>
      )}

      {/* Error */}
      {gameError && (
        <p className="text-sm text-center mb-4 animate-fade-in" style={{ color: 'var(--accent)' }}>
          {gameError}
        </p>
      )}

      {/* Start button — host only */}
      {isHost && (
        <PrimaryButton
          onClick={handleStart}
          disabled={state.imageCount === 0 || players.length < 2}
        >
          Start Game →
        </PrimaryButton>
      )}

    </div>
  );
}