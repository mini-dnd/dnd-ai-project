if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config()
}
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  }
});

app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store game rooms: roomId -> { roomName, players: Map, gameSession, maxPlayers }
const gameRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Get list of available rooms
  socket.on('get-rooms', () => {
    const roomsList = Array.from(gameRooms.entries()).map(([roomId, room]) => ({
      roomId,
      roomName: room.roomName,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      isStarted: room.gameSession.isStarted || false
    }));
    socket.emit('rooms-list', roomsList);
  });

  // Create new room
  socket.on('create-room', (data) => {
    const { roomName, playerName, maxPlayers = 4 } = data;
    const roomId = `room-${Date.now()}`;

    const room = {
      roomName,
      maxPlayers,
      players: new Map([[socket.id, { id: socket.id, name: playerName, isHost: true }]]),
      gameSession: {
        setting: 'fantasy',
        history: [],
        gameState: {
          health: 100,
          inventory: [],
          location: 'Starting Point'
        },
        isStarted: false
      }
    };

    gameRooms.set(roomId, room);
    socket.join(roomId);
    socket.roomId = roomId;

    socket.emit('room-created', {
      roomId,
      roomName,
      players: Array.from(room.players.values())
    });

    // Broadcast updated rooms list
    io.emit('rooms-list-updated');
  });

  // Join existing room
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    const room = gameRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.players.size >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    if (room.gameSession.isStarted) {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    room.players.set(socket.id, { id: socket.id, name: playerName, isHost: false });
    socket.join(roomId);
    socket.roomId = roomId;

    // Notify all players in room
    io.to(roomId).emit('player-joined', {
      players: Array.from(room.players.values()),
      newPlayer: playerName
    });

    socket.emit('room-joined', {
      roomId,
      roomName: room.roomName,
      players: Array.from(room.players.values())
    });

    // Broadcast updated rooms list
    io.emit('rooms-list-updated');
  });

  // Leave room
  socket.on('leave-room', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (room) {
      const player = room.players.get(socket.id);
      room.players.delete(socket.id);
      socket.leave(roomId);

      // If no players left, delete room
      if (room.players.size === 0) {
        gameRooms.delete(roomId);
      } else {
        // Notify remaining players
        io.to(roomId).emit('player-left', {
          players: Array.from(room.players.values()),
          leftPlayer: player?.name
        });
      }

      socket.roomId = null;
      io.emit('rooms-list-updated');
    }
  });

  // Create new game session
  socket.on('start-game', async (data) => {
    const { setting } = data;
    const roomId = socket.roomId;
    const room = gameRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'No room found' });
      return;
    }

    // Check if user is host
    const player = room.players.get(socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    room.gameSession.setting = setting || 'fantasy';
    room.gameSession.isStarted = true;

    const playerNames = Array.from(room.players.values()).map(p => p.name).join(', ');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const prompt = `Anda adalah Dungeon Master untuk game RPG berlatar ${setting}. 
    Para pemain adalah: ${playerNames}. 
    **Semua respons Anda harus dalam Bahasa Indonesia yang formal dan menarik.**
    Buat adegan pembuka petualangan yang menarik untuk grup ini. 
    Jaga agar tetap singkat (3-4 kalimat) dan akhiri dengan pertanyaan atau pilihan untuk para pemain.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      room.gameSession.history.push({
        role: 'dm',
        content: response,
        timestamp: Date.now()
      });

      // Broadcast to all players in room
      io.to(roomId).emit('game-started', {
        message: response,
        gameState: room.gameSession.gameState
      });
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Handle player actions
  socket.on('player-action', async (data) => {
    const { action } = data;
    const roomId = socket.roomId;
    const room = gameRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'No active room' });
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    room.gameSession.history.push({
      role: 'player',
      content: action,
      playerName: player.name,
      timestamp: Date.now()
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const playerNames = Array.from(room.players.values()).map(p => p.name).join(', ');
    const conversationHistory = room.gameSession.history
      .map(h => {
        if (h.role === 'player') {
          return `${h.playerName}: ${h.content}`;
        }
        return `DM: ${h.content}`;
      })
      .join('\n');

    const prompt = `Anda adalah Dungeon Master untuk game RPG berlatar ${room.gameSession.setting}.
    
    **TUGAS PENTING: Semua respons Anda, termasuk narasi dan pertanyaan, harus dalam Bahasa Indonesia yang kreatif dan mengalir.**
    
Current game state:
- Players: ${playerNames}
- Health: ${room.gameSession.gameState.health}
- Location: ${room.gameSession.gameState.location}
- Inventory: ${room.gameSession.gameState.inventory.join(', ') || 'empty'}

Conversation history:
${conversationHistory}

Player ${player.name} action: ${action}

Respond as the Dungeon Master. Be creative, engaging, and continue the story. 
Keep responses brief (3-5 sentences). 
If the action affects health, inventory, or location, mention it clearly in Indonesian.
Address the entire party, not just one player.
End with a question or present new choices.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Simple game state updates
      if (response.toLowerCase().includes('damage') || response.toLowerCase().includes('hurt')) {
        room.gameSession.gameState.health = Math.max(0, room.gameSession.gameState.health - 10);
      }
      if (response.toLowerCase().includes('heal')) {
        room.gameSession.gameState.health = Math.min(100, room.gameSession.gameState.health + 20);
      }

      room.gameSession.history.push({
        role: 'dm',
        content: response,
        timestamp: Date.now()
      });

      // Broadcast to all players in room
      io.to(roomId).emit('dm-response', {
        message: response,
        gameState: room.gameSession.gameState,
        playerName: player.name
      });
    } catch (error) {
      console.error('Error processing action:', error);
      socket.emit('error', { message: 'Failed to process action' });
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId) {
      const room = gameRooms.get(roomId);
      if (room) {
        const player = room.players.get(socket.id);
        room.players.delete(socket.id);

        // If no players left, delete room
        if (room.players.size === 0) {
          gameRooms.delete(roomId);
        } else {
          // Notify remaining players
          io.to(roomId).emit('player-left', {
            players: Array.from(room.players.values()),
            leftPlayer: player?.name
          });
        }

        io.emit('rooms-list-updated');
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});