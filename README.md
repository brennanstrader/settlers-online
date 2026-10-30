# Settlers Online
Online multiplayer 3-4 player settlement/trading board game (Node + Express + Socket.IO, vanilla JS/SVG client).

Start: `npm install && ./run.sh` (restart loop, logs/server.log) or `PORT=3457 node server.js`.
Env: PORT (3457), MIN_PLAYERS (2), DATA_FILE (data/rooms.json).
Tests: `npm test` (unit + socket sim), `node test/fuzz.js 100` (full-game fuzz).
Deploy: any Node host (Render/Fly/Railway) with `npm start`; needs WebSocket support.
