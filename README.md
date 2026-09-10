# Caption Wars 🎮

A real-time multiplayer party game where players caption photos, vote on the funniest answers, and compete for points. Play in the same room or remotely — no app download needed.

https://caption-wars.vercel.app/

---

## How It Works

1. Host creates a room and uploads up to 25 photos
2. Players join via a room code on their phone
3. Everyone captions each photo anonymously
4. The group votes for the funniest caption
5. Points and rankings after every photo — winner crowned at the end


## SCREENSHOTS
<img width="480" height="1038" alt="caption_wars_home" src="https://github.com/user-attachments/assets/eb404f8c-ee1a-43be-9a68-0852edbf552c" />
<img width="480" height="1039" alt="caption_wars" src="https://github.com/user-attachments/assets/790b31c6-e146-4584-a156-d1c9e4baa00a" />






## Privacy

Photos are never stored, logged, or saved to a database. They live in memory only for the duration of the game and disappear the moment the room closes.

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, WebSockets — deployed on Vercel
**Backend:** Node.js, Express, ws, Multer — deployed on Railway

---

## Running Locally

```bash
git clone https://github.com/eagle38/caption_wars.git
cd caption_wars

# Server
cd server
npm install
node index.js

# Client (new terminal)
cd client
npm install
npm run dev
```

Create `client/.env`:
VITE_WS_URL=ws://YOUR_LOCAL_IP:8080
VITE_API_URL=http://YOUR_LOCAL_IP:8080


Find your IP with `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows).

---

## Project Structure

caption_wars/
├── client/ # React frontend — screens, context, components
└── server/ # Node.js WebSocket server + game logic + image upload
