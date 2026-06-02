import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { useWS } from './WebSocketContext';

const GameContext = createContext(null);

const initialState = {
  phase: 'home',
  roomCode: null,
  players: {},
  imageData: null,
  imageIndex: 0,
  totalImages: 0,
  captions: {},
  results: [],
  votesMap: {},
  timerValue: 0,
  submittedCount: 0,
  totalPlayers: 0,
  isLastImage: false,
  imageCount: 0,
  config: null,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'ROOM_JOINED':
    case 'ROOM_CREATED':
      return {
        ...state,
        phase: 'lobby',
        roomCode: action.payload.roomCode,
        players: action.payload.players || {},
        config: action.payload.config,
        error: null,
      };
    case 'PLAYERS_UPDATED':
      return { ...state, players: action.payload.players };
    case 'IMAGES_UPDATED':
      return { ...state, imageCount: action.payload.imageCount };
    case 'PHASE_CHANGE': {
      const p = action.payload;
      return {
        ...state,
        phase: p.phase,
        imageData: p.imageData ?? state.imageData,
        imageIndex: p.imageIndex ?? state.imageIndex,
        totalImages: p.totalImages ?? state.totalImages,
        captions: p.captions ?? {},
        results: p.results ?? [],
        votesMap: p.votesMap ?? state.votesMap,
        players: Array.isArray(p.players)
          ? Object.fromEntries(p.players.map(pl => [pl.id, pl]))
          : (p.players ?? state.players),
        submittedCount: p.submittedCount ?? 0,
        totalPlayers: p.totalPlayers ?? state.totalPlayers,
        timerValue: p.timerSeconds ?? state.timerValue,
        isLastImage: p.isLastImage ?? state.isLastImage,
        currentImageIndex: p.currentImageIndex ?? state.imageIndex,
        error: null,
      };
    }
    case 'TIMER_TICK':
      return { ...state, timerValue: action.payload.value };
    case 'SUBMISSION_COUNT':
      return {
        ...state,
        submittedCount: action.payload.submittedCount,
        totalPlayers: action.payload.totalPlayers,
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const { subscribe } = useWS();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [myPlayer, setMyPlayer] = useState(null);

  useEffect(() => {
    const unsubs = [
      subscribe('ROOM_CREATED', (p) => {
        setMyPlayer({ playerId: p.playerId, isHost: true });
        dispatch({ type: 'ROOM_CREATED', payload: p });
      }),
      subscribe('ROOM_JOINED', (p) => {
        setMyPlayer({ playerId: p.playerId, isHost: false });
        dispatch({ type: 'ROOM_JOINED', payload: p });
      }),
      subscribe('PLAYERS_UPDATED', (p) => dispatch({ type: 'PLAYERS_UPDATED', payload: p })),
      subscribe('IMAGES_UPDATED', (p) => dispatch({ type: 'IMAGES_UPDATED', payload: p })),
      subscribe('PHASE_CHANGE', (p) => dispatch({ type: 'PHASE_CHANGE', payload: p })),
      subscribe('TIMER_TICK', (p) => dispatch({ type: 'TIMER_TICK', payload: p })),
      subscribe('SUBMISSION_COUNT', (p) => dispatch({ type: 'SUBMISSION_COUNT', payload: p })),
      subscribe('ERROR', (p) => dispatch({ type: 'SET_ERROR', payload: p.message })),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [subscribe]);

  return (
    <GameContext.Provider value={{ state, myPlayer, setMyPlayer, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() { return useContext(GameContext); }