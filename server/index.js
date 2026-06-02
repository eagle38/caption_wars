const express = require('express');
const { createServer } = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const multer = require('multer');

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const CONFIG = {
  maxImages: 25,
  captionTimerSeconds: 40,
  votingTimerSeconds: 30,
  rankingsDisplaySeconds: 4,
  pointsPerVote: 100,
  roomCodeLength: 6,
};

// ─────────────────────────────────────────
// EXPRESS + HTTP SERVER
// We use Express for image uploads (POST /upload)
// and attach the WebSocket server to the same HTTP server
// so we only need one port on Railway
// ─────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// ─────────────────────────────────────────
// ROOMS
// Each room is a completely independent game
// { [roomCode]: { ...roomState } }
// ─────────────────────────────────────────
const rooms = {};

// Clients map: { [playerId]: WebSocket }
// Stored globally since one WS connection = one player
const clients = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < CONFIG.roomCodeLength; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(hostId) {
  let code;
  // Make sure code is unique
  do { code = generateRoomCode(); } while (rooms[code]);

  rooms[code] = {
    code,
    hostId,
    phase: 'lobby',      // lobby | upload | playing | captioning | voting | results | rankings | gameover
    players: {},         // { [playerId]: { id, name, avatar, score, isHost } }
    images: [],          // [{ id, dataUrl }] — uploaded by host
    currentImageIndex: 0,
    captions: {},        // { [playerId]: captionText }
    votes: {},           // { [voterId]: votedForPlayerId }
    results: [],
    votesMap: {},
    timer: null,
    timerValue: 0,
  };

  return rooms[code];
}

function getPlayerRoom(playerId) {
  return Object.values(rooms).find(
    (room) => room.players[playerId]
  );
}

function broadcastToRoom(roomCode, msg) {
  const room = rooms[roomCode];
  if (!room) return;
  const data = JSON.stringify(msg);
  Object.keys(room.players).forEach((playerId) => {
    const ws = clients[playerId];
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function sendTo(playerId, msg) {
  const ws = clients[playerId];
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastRoomState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  broadcastToRoom(roomCode, {
    type: 'ROOM_STATE',
    payload: {
      phase: room.phase,
      players: room.players,
      imageCount: room.images.length,
      currentImageIndex: room.currentImageIndex,
      totalImages: room.images.length,
    }
  });
}

// ─────────────────────────────────────────
// IMAGE UPLOAD ENDPOINT
// Host uploads images via POST /upload/:roomCode
// Images are stored as base64 in memory
// ─────────────────────────────────────────
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
  storage: multer.memoryStorage(), // keep in memory, not disk
});

app.post('/upload/:roomCode', upload.array('images', CONFIG.maxImages), (req, res) => {
  const { roomCode } = req.params;
  const room = rooms[roomCode.toUpperCase()];

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.phase !== 'lobby') {
    return res.status(400).json({ error: 'Game already started' });
  }

  const newImages = req.files.map((file) => ({
    id: uuidv4(),
    dataUrl: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
  }));

  // Add to existing images, cap at maxImages
  room.images = [...room.images, ...newImages].slice(0, CONFIG.maxImages);

  // Tell everyone in the room the image count updated
  broadcastToRoom(roomCode.toUpperCase(), {
    type: 'IMAGES_UPDATED',
    payload: { imageCount: room.images.length }
  });

  res.json({ 
    success: true, 
    imageCount: room.images.length,
    images: room.images.map((img, index) => ({ id: img.id, index }))
  });
});

// Remove a single image (host can delete before starting)
app.delete('/upload/:roomCode/:imageId', (req, res) => {
  const { roomCode, imageId } = req.params;
  const room = rooms[roomCode.toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  room.images = room.images.filter((img) => img.id !== imageId);

  broadcastToRoom(roomCode.toUpperCase(), {
    type: 'IMAGES_UPDATED',
    payload: { imageCount: room.images.length }
  });

  res.json({ success: true, imageCount: room.images.length });
});

// Health check — Railway uses this
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────
// WEBSOCKET
// ─────────────────────────────────────────
wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  ws.connectionId = connectionId;
  clients[connectionId] = ws;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return; }
    handleMessage(ws, msg);
  });

  ws.on('close', () => handleDisconnect(ws));
});

// ─────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────
function handleMessage(ws, msg) {
  const { type, payload } = msg;

  switch (type) {

    case 'CREATE_ROOM': {
      const playerId = payload.playerId || uuidv4();
      ws.playerId = playerId;
      clients[playerId] = ws;
      delete clients[ws.connectionId];

      const room = createRoom(playerId);

      room.players[playerId] = {
        id: playerId,
        name: payload.name,
        avatar: payload.avatar,
        score: 0,
        isHost: true,
      };

      sendTo(playerId, {
        type: 'ROOM_CREATED',
        payload: {
          roomCode: room.code,
          playerId,
          isHost: true,
          config: CONFIG,
        }
      });

      broadcastRoomState(room.code);
      console.log(`Room ${room.code} created by ${payload.name}`);
      break;
    }

    case 'JOIN_ROOM': {
      const { roomCode, name, avatar } = payload;
      const code = roomCode.toUpperCase().trim();
      const room = rooms[code];

      if (!room) {
        sendTo(ws.connectionId, {
          type: 'ERROR',
          payload: { message: 'Room not found. Check the code and try again.' }
        });
        return;
      }

      if (room.phase !== 'lobby') {
        sendTo(ws.connectionId, {
          type: 'ERROR',
          payload: { message: 'Game already in progress.' }
        });
        return;
      }

      const playerId = payload.playerId || uuidv4();
      ws.playerId = playerId;
      ws.roomCode = code;
      clients[playerId] = ws;
      delete clients[ws.connectionId];

      room.players[playerId] = {
        id: playerId,
        name,
        avatar,
        score: 0,
        isHost: false,
      };

      sendTo(playerId, {
        type: 'ROOM_JOINED',
        payload: {
          roomCode: code,
          playerId,
          isHost: false,
          config: CONFIG,
          phase: room.phase,
          players: room.players,
        }
      });

      broadcastToRoom(code, {
        type: 'PLAYERS_UPDATED',
        payload: { players: room.players }
      });

      console.log(`${name} joined room ${code}`);
      break;
    }

    case 'START_GAME': {
      const room = getPlayerRoom(ws.playerId);
      if (!room) return;
      if (room.players[ws.playerId]?.isHost !== true) return;
      if (room.images.length === 0) {
        sendTo(ws.playerId, {
          type: 'ERROR',
          payload: { message: 'Upload at least 1 picture before starting.' }
        });
        return;
      }
      if (Object.keys(room.players).length < 2) {
        sendTo(ws.playerId, {
          type: 'ERROR',
          payload: { message: 'Need at least 2 players to start.' }
        });
        return;
      }
      startPicture(room.code, 0);
      break;
    }

    case 'SUBMIT_CAPTION': {
      const room = getPlayerRoom(ws.playerId);
      if (!room || room.phase !== 'captioning') return;
      const { caption } = payload;
      if (!caption?.trim()) return;

      room.captions[ws.playerId] = caption.trim();
      broadcastSubmissionCount(room.code);

      const totalPlayers = Object.keys(room.players).length;
      if (Object.keys(room.captions).length >= totalPlayers) {
        clearRoomTimer(room);
        startVoting(room.code);
      }
      break;
    }

    case 'SUBMIT_VOTE': {
      const room = getPlayerRoom(ws.playerId);
      if (!room || room.phase !== 'voting') return;
      const { votedFor } = payload;
      if (votedFor === ws.playerId) return;
      if (room.votes[ws.playerId]) return;

      room.votes[ws.playerId] = votedFor;
      broadcastSubmissionCount(room.code);

      const totalPlayers = Object.keys(room.players).length;
      if (Object.keys(room.votes).length >= totalPlayers) {
        clearRoomTimer(room);
        showResults(room.code);
      }
      break;
    }

    case 'NEXT': {
      const room = getPlayerRoom(ws.playerId);
      if (!room) return;
      if (!room.players[ws.playerId]?.isHost) return;
      handleNext(room.code);
      break;
    }
  }
}

// ─────────────────────────────────────────
// GAME FLOW
// ─────────────────────────────────────────
function startPicture(roomCode, imageIndex) {
  const room = rooms[roomCode];
  if (!room) return;

  room.phase = 'captioning';
  room.currentImageIndex = imageIndex;
  room.captions = {};
  room.votes = {};
  room.results = [];
  room.votesMap = {};

  const currentImage = room.images[imageIndex];

  broadcastToRoom(roomCode, {
    type: 'PHASE_CHANGE',
    payload: {
      phase: 'captioning',
      imageIndex,
      totalImages: room.images.length,
      imageData: currentImage.dataUrl,
      timerSeconds: CONFIG.captionTimerSeconds,
      submittedCount: 0,
      totalPlayers: Object.keys(room.players).length,
    }
  });

  startRoomTimer(room, CONFIG.captionTimerSeconds, () => startVoting(roomCode));
}

function startVoting(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.phase = 'voting';
  const shuffledCaptions = shuffleObject(room.captions);

  broadcastToRoom(roomCode, {
    type: 'PHASE_CHANGE',
    payload: {
      phase: 'voting',
      captions: shuffledCaptions,
      imageData: room.images[room.currentImageIndex].dataUrl,
      timerSeconds: CONFIG.votingTimerSeconds,
      submittedCount: 0,
      totalPlayers: Object.keys(room.players).length,
    }
  });

  startRoomTimer(room, CONFIG.votingTimerSeconds, () => showResults(roomCode));
}

function showResults(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.phase = 'results';
  clearRoomTimer(room);

  const voteCounts = {};
  Object.values(room.votes).forEach((votedFor) => {
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  });

  Object.entries(voteCounts).forEach(([playerId, votes]) => {
    if (room.players[playerId]) {
      room.players[playerId].score += votes * CONFIG.pointsPerVote;
    }
  });

  const results = Object.entries(room.captions).map(([playerId, caption]) => ({
    playerId,
    name: room.players[playerId]?.name || 'No idea who',
    avatar: room.players[playerId]?.avatar || '🙂',
    caption,
    votes: voteCounts[playerId] || 0,
    pointsEarned: (voteCounts[playerId] || 0) * CONFIG.pointsPerVote,
  })).sort((a, b) => b.votes - a.votes);

  const votesMap = {};
  Object.entries(room.votes).forEach(([voterId, votedFor]) => {
    if (!votesMap[votedFor]) votesMap[votedFor] = [];
    const voterName = room.players[voterId]?.name || 'who is this person??';
    votesMap[votedFor].push(voterName);
  });

  room.results = results;
  room.votesMap = votesMap;

  broadcastToRoom(roomCode, {
    type: 'PHASE_CHANGE',
    payload: {
      phase: 'results',
      results,
      votesMap,
      imageData: room.images[room.currentImageIndex].dataUrl,
      players: room.players,
    }
  });
}

function showRankings(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.phase = 'rankings';
  const isLastImage = room.currentImageIndex >= room.images.length - 1;

  const sorted = Object.values(room.players)
    .sort((a, b) => b.score - a.score);

  broadcastToRoom(roomCode, {
    type: 'PHASE_CHANGE',
    payload: {
      phase: 'rankings',
      players: sorted,
      isLastImage,
      currentImageIndex: room.currentImageIndex,
      totalImages: room.images.length,
    }
  });

  setTimeout(() => {
    if (isLastImage) {
      showGameOver(roomCode);
    } else {
      startPicture(roomCode, room.currentImageIndex + 1);
    }
  }, CONFIG.rankingsDisplaySeconds * 1000);
}

function showGameOver(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.phase = 'gameover';
  const sorted = Object.values(room.players)
    .sort((a, b) => b.score - a.score);

  broadcastToRoom(roomCode, {
    type: 'PHASE_CHANGE',
    payload: {
      phase: 'gameover',
      players: sorted,
    }
  });

  // Clean up room after 1 hour
  setTimeout(() => {
    delete rooms[roomCode];
    console.log(`Room ${roomCode} cleaned up`);
  }, 60 * 60 * 1000);
}

function handleNext(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.phase === 'results') {
    showRankings(roomCode);
  }
}

// ─────────────────────────────────────────
// TIMER HELPERS
// ─────────────────────────────────────────
function startRoomTimer(room, seconds, onComplete) {
  clearRoomTimer(room);
  room.timerValue = seconds;

  room.timer = setInterval(() => {
    room.timerValue -= 1;
    broadcastToRoom(room.code, {
      type: 'TIMER_TICK',
      payload: { value: room.timerValue }
    });

    if (room.timerValue <= 0) {
      clearRoomTimer(room);
      onComplete();
    }
  }, 1000);
}

function clearRoomTimer(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

// ─────────────────────────────────────────
// DISCONNECT
// ─────────────────────────────────────────
function handleDisconnect(ws) {
  const playerId = ws.playerId;
  if (!playerId) return;

  const room = getPlayerRoom(playerId);
  if (room) {
    console.log(`${room.players[playerId]?.name} disconnected from ${room.code}`);
    delete room.players[playerId];
    broadcastToRoom(room.code, {
      type: 'PLAYERS_UPDATED',
      payload: { players: room.players }
    });

    // If room is empty, clean it up
    if (Object.keys(room.players).length === 0) {
      clearRoomTimer(room);
      delete rooms[room.code];
      console.log(`Room ${room.code} deleted — empty`);
    }
  }

  delete clients[playerId];
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function broadcastSubmissionCount(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const isVoting = room.phase === 'voting';
  broadcastToRoom(roomCode, {
    type: 'SUBMISSION_COUNT',
    payload: {
      submittedCount: isVoting
        ? Object.keys(room.votes).length
        : Object.keys(room.captions).length,
      totalPlayers: Object.keys(room.players).length,
    }
  });
}

function shuffleObject(obj) {
  const entries = Object.entries(obj);
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return Object.fromEntries(entries);
}

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`🎮 Caption Game server running on port ${PORT}`);
});