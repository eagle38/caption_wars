import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWS } from '../context/WebSocketContext';
import { useGame } from '../context/GameContext';
import { AVATARS } from '../data/avatars';
import { PrimaryButton, GhostButton } from '../components/ui/Button';

export default function HomeScreen() {
  const { send, isConnected } = useWS();
  const { state, dispatch } = useGame();

  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [nameError, setNameError] = useState('');

  function handleCreate() {
    if (!name.trim()) { setNameError('Enter your name first'); return; }
    const playerId = uuidv4();
    const av = AVATARS.find(a => a.id === avatar);
    send('CREATE_ROOM', { playerId, name: name.trim(), avatar: av.emoji });
  }

  function handleJoin() {
    if (!name.trim()) { setNameError('Enter your name first'); return; }
    if (!roomCode.trim()) return;
    const playerId = uuidv4();
    const av = AVATARS.find(a => a.id === avatar);
    send('JOIN_ROOM', {
      playerId,
      name: name.trim(),
      avatar: av.emoji,
      roomCode: roomCode.trim().toUpperCase(),
    });
  }

  const selectedAvatar = AVATARS.find(a => a.id === avatar);

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10"
      style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="animate-slide-up mb-12">
        
        <h1 className="font-display text-4xl font-800 leading-none mb-2"
          style={{ color: 'var(--cream)' }}>
          Caption<br />
          <span style={{ color: 'var(--accent)' }}>Wars</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--cream-dim)' }}>
          The party photo caption game , you may need friends to play this.
        </p>
      </div>

      {!isConnected && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm text-center animate-fade-in"
          style={{ background: 'var(--bg-elevated)', color: 'var(--cream-dim)', border: '1px solid var(--border)' }}>
          Connecting...
        </div>
      )}

      {state.error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-center animate-fade-in"
          style={{ background: 'rgba(255,77,28,0.1)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
          {state.error}
        </div>
      )}

      {!mode ? (
        /* Mode selection */
        <div className="space-y-4 animate-slide-up stagger">
          <PrimaryButton onClick={() => setMode('create')}>
            Create a Room
          </PrimaryButton>
          <GhostButton onClick={() => setMode('join')}>
            Join a Room
          </GhostButton>
        </div>
      ) : (
        <div className="flex flex-col gap-5 animate-slide-up">

          {/* Name input */}
          <div>
            <label className="text-xs uppercase tracking-widest mb-2 block"
              style={{ color: 'var(--cream-muted)' }}>
              Your Name
            </label>
            <input
              type="text"
              maxLength={16}
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--cream)',
                border: nameError ? '1px solid var(--accent)' : '1px solid var(--border)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
            {nameError && (
              <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>{nameError}</p>
            )}
          </div>

          {/* Room code input for join */}
          {mode === 'join' && (
            <div>
              <label className="text-xs uppercase tracking-widest mb-2 block"
                style={{ color: 'var(--cream-muted)' }}>
                Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="w-full px-4 py-3 rounded-xl text-2xl font-display tracking-widest outline-none uppercase text-center transition-all"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--cream)',
                  border: '1px solid var(--border)',
                  letterSpacing: '0.3em',
                }}
              />
            </div>
          )}

          {/* Avatar picker */}
          <div>
            <label className="text-xs uppercase tracking-widest mb-3 block"
              style={{ color: 'var(--cream-muted)' }}>
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setAvatar(av.id)}
                  className="aspect-square rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: avatar === av.id ? 'var(--accent-soft)' : 'var(--bg-card)',
                    border: avatar === av.id ? '2px solid var(--accent)' : '2px solid transparent',
                    transform: avatar === av.id ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <PrimaryButton
            onClick={mode === 'create' ? handleCreate : handleJoin}
            disabled={!isConnected || !name.trim() || (mode === 'join' && roomCode.length < 4)}
          >
            {mode === 'create' ? `Create Room  ${selectedAvatar?.emoji}` : `Join Room  ${selectedAvatar?.emoji}`}
          </PrimaryButton>

          <GhostButton onClick={() => { setMode(null); dispatch({ type: 'CLEAR_ERROR' }); }}>
            ← Back
          </GhostButton>

        </div>
      )}
    </div>
  );
}