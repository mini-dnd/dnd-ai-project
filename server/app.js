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
    origin: "*",
  }
});

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const retryWithBackoff = async (fn, maxRetries = 5, initialDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      const isRetryableError = error.status === 503 || error.status === 429;

      if (isLastAttempt || !isRetryableError) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms due to ${error.status} error`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

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
        playerStats: new Map([[socket.id, {
          name: playerName,
          health: 100,
          isAlive: true,
          inventory: []
        }]]),
        sharedState: {
          location: 'Starting Point',
          partyInventory: []
        },
        isStarted: false,
        currentTurn: {
          actions: new Map(),
          waitingFor: new Set()
        }
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

    if (!room.gameSession.isStarted) {
      room.gameSession.playerStats.set(socket.id, {
        name: playerName,
        health: 100,
        isAlive: true,
        inventory: []
      });
    }

    socket.join(roomId);
    socket.roomId = roomId;

    io.to(roomId).emit('player-joined', {
      players: Array.from(room.players.values()),
      newPlayer: playerName
    });

    socket.emit('room-joined', {
      roomId,
      roomName: room.roomName,
      players: Array.from(room.players.values())
    });

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

      if (room.players.size === 0) {
        gameRooms.delete(roomId);
      } else {
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

    const player = room.players.get(socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    room.gameSession.setting = setting || 'fantasy';
    room.gameSession.isStarted = true;

    room.gameSession.currentTurn = {
      actions: new Map(),
      waitingFor: new Set(room.players.keys())
    };

    const playerNames = Array.from(room.players.values()).map(p => p.name).join(', ');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Anda adalah Dungeon Master untuk game RPG berlatar ${setting}. 
    Para pemain adalah: ${playerNames}. 
    **Semua respons Anda harus dalam Bahasa Indonesia yang formal dan menarik.**
    Buat adegan pembuka petualangan yang menarik untuk grup ini. 
    Jaga agar tetap singkat (3-4 kalimat) dan akhiri dengan pertanyaan atau pilihan untuk para pemain.
    
    Sebutkan lokasi awal dengan jelas dalam narasi Anda.
    
    **IMPORTANT: Your response must be in this EXACT JSON format:**
    {
      "narrative": "Your opening story narrative here",
      "gameStateChanges": {
        "healthChange": 0,
        "locationChange": "Nama Lokasi Awal",
        "inventoryAdd": [],
        "inventoryRemove": []
      }
    }
    
    Set locationChange to the starting location name mentioned in your narrative.
    Only return the JSON, nothing else.`;

    try {
      io.to(roomId).emit('ai-processing', { message: 'Dungeon Master sedang mempersiapkan petualangan...' });

      const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt);
      });
      const responseText = result.response.text();

      let narrative = responseText;
      let gameStateChanges = null;

      try {
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }

        const parsed = JSON.parse(jsonText);
        narrative = parsed.narrative;
        gameStateChanges = parsed.gameStateChanges;

        if (gameStateChanges && gameStateChanges.locationChange) {
          room.gameSession.sharedState.location = gameStateChanges.locationChange;
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response for game start, using full text:', parseError.message);
      }

      room.gameSession.history.push({
        role: 'dm',
        content: narrative,
        timestamp: Date.now()
      });

      const playerStatsArray = Array.from(room.gameSession.playerStats.entries()).map(([id, stats]) => ({
        id,
        ...stats
      }));

      io.to(roomId).emit('game-started', {
        message: narrative,
        playerStats: playerStatsArray,
        sharedState: room.gameSession.sharedState
      });
    } catch (error) {
      console.error('Error starting game:', error);
      const errorMessage = error.status === 503
        ? 'Server AI sedang sibuk. Mohon coba lagi dalam beberapa saat.'
        : 'Gagal memulai game. Silakan coba lagi.';
      socket.emit('error', { message: errorMessage });
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

    const playerStats = room.gameSession.playerStats.get(socket.id);
    if (!playerStats || !playerStats.isAlive) {
      socket.emit('error', { message: 'Anda sudah mati dan tidak bisa melakukan aksi. Anda hanya bisa mengobservasi.' });
      return;
    }

    if (room.gameSession.currentTurn.actions.has(socket.id)) {
      socket.emit('error', { message: 'Anda sudah mengirim aksi untuk turn ini. Tunggu pemain lain.' });
      return;
    }

    room.gameSession.currentTurn.actions.set(socket.id, {
      action,
      playerName: player.name,
      timestamp: Date.now()
    });
    room.gameSession.currentTurn.waitingFor.delete(socket.id);

    const playersSubmitted = Array.from(room.gameSession.currentTurn.actions.keys())
      .map(id => room.players.get(id)?.name)
      .filter(Boolean);
    const playersWaiting = Array.from(room.gameSession.currentTurn.waitingFor)
      .map(id => {
        const playerStats = room.gameSession.playerStats.get(id);
        return playerStats?.isAlive ? room.players.get(id)?.name : null;
      })
      .filter(Boolean);

    const alivePlayers = Array.from(room.gameSession.playerStats.values()).filter(s => s.isAlive).length;

    io.to(roomId).emit('turn-status', {
      submitted: playersSubmitted,
      waiting: playersWaiting,
      total: alivePlayers
    });

    if (room.gameSession.currentTurn.waitingFor.size > 0) {
      return;
    }

    try {
      io.to(roomId).emit('ai-processing', { message: 'Dungeon Master sedang berpikir...' });

      const turnActions = Array.from(room.gameSession.currentTurn.actions.values())
        .map(a => `${a.playerName}: ${a.action}`)
        .join('\n');

      room.gameSession.currentTurn.actions.forEach((actionData) => {
        room.gameSession.history.push({
          role: 'player',
          content: actionData.action,
          playerName: actionData.playerName,
          timestamp: actionData.timestamp
        });
      });

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const conversationHistory = room.gameSession.history
        .map(h => {
          if (h.role === 'player') {
            return `${h.playerName}: ${h.content}`;
          }
          return `DM: ${h.content}`;
        })
        .join('\n');

      const playerStatusList = Array.from(room.gameSession.playerStats.values())
        .map(stats => {
          const status = stats.isAlive ? `Health: ${stats.health}` : 'DEAD';
          const inv = stats.inventory.length > 0 ? ` | Items: ${stats.inventory.join(', ')}` : '';
          return `  - ${stats.name}: ${status}${inv}`;
        })
        .join('\n');

      const prompt = `Anda adalah Dungeon Master untuk game RPG berlatar ${room.gameSession.setting}.
    
**TUGAS PENTING: Semua respons Anda, termasuk narasi dan pertanyaan, harus dalam Bahasa Indonesia yang kreatif dan mengalir.**
    
Current game state:
Players:
${playerStatusList}

Party Location: ${room.gameSession.sharedState.location}
Party Inventory: ${room.gameSession.sharedState.partyInventory.join(', ') || 'empty'}

Conversation history:
${conversationHistory}

All players' actions this turn:
${turnActions}

Respond as the Dungeon Master. Be creative, engaging, and continue the story. 
Keep responses brief (4-6 sentences). 
Consider ALL players' actions and respond to them collectively.
Address the entire party.
End with a question or present new choices.

**IMPORTANT: Your response must be in this EXACT JSON format:**
{
  "narrative": "Your story narrative here",
  "gameStateChanges": {
    "healthChange": 0,
    "locationChange": null,
    "inventoryAdd": [],
    "inventoryRemove": []
  }
}

Rules for gameStateChanges:
- healthChange: positive number for healing, negative for damage, 0 for no change
- locationChange: new location name if players moved, null if no change
- inventoryAdd: array of item names that players gained
- inventoryRemove: array of item names that players used/lost

Only return the JSON, nothing else.`;

      const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt);
      });
      const responseText = result.response.text();

      let narrative = responseText;
      let gameStateChanges = null;

      try {
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }

        const parsed = JSON.parse(jsonText);
        narrative = parsed.narrative;
        gameStateChanges = parsed.gameStateChanges;

        if (gameStateChanges) {
          if (gameStateChanges.playerChanges && Array.isArray(gameStateChanges.playerChanges)) {
            gameStateChanges.playerChanges.forEach(change => {
              const playerEntry = Array.from(room.gameSession.playerStats.entries())
                .find(([_, stats]) => stats.name === change.playerName);

              if (playerEntry) {
                const [playerId, playerStats] = playerEntry;

                if (change.healthChange) {
                  playerStats.health = Math.max(0, Math.min(100, playerStats.health + change.healthChange));

                  if (playerStats.health <= 0) {
                    playerStats.isAlive = false;
                    playerStats.health = 0;
                  }
                }

                if (change.inventoryAdd && change.inventoryAdd.length > 0) {
                  playerStats.inventory.push(...change.inventoryAdd);
                }

                if (change.inventoryRemove && change.inventoryRemove.length > 0) {
                  change.inventoryRemove.forEach(item => {
                    const index = playerStats.inventory.indexOf(item);
                    if (index > -1) {
                      playerStats.inventory.splice(index, 1);
                    }
                  });
                }
              }
            });
          }

          if (gameStateChanges.locationChange) {
            room.gameSession.sharedState.location = gameStateChanges.locationChange;
          }

          if (gameStateChanges.partyInventoryAdd && gameStateChanges.partyInventoryAdd.length > 0) {
            room.gameSession.sharedState.partyInventory.push(...gameStateChanges.partyInventoryAdd);
          }

          if (gameStateChanges.partyInventoryRemove && gameStateChanges.partyInventoryRemove.length > 0) {
            gameStateChanges.partyInventoryRemove.forEach(item => {
              const index = room.gameSession.sharedState.partyInventory.indexOf(item);
              if (index > -1) {
                room.gameSession.sharedState.partyInventory.splice(index, 1);
              }
            });
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using full text as narrative:', parseError.message);
        const lowerResponse = responseText.toLowerCase();
        if (lowerResponse.includes('damage') || lowerResponse.includes('hurt') || lowerResponse.includes('cedera') || lowerResponse.includes('luka') || lowerResponse.includes('mati')) {
          room.gameSession.playerStats.forEach((stats, playerId) => {
            if (stats.isAlive) {
              stats.health = Math.max(0, stats.health - 10);
              if (stats.health <= 0) {
                stats.isAlive = false;
              }
            }
          });
        }
        if (lowerResponse.includes('heal') || lowerResponse.includes('sembuh') || lowerResponse.includes('pulih')) {
          room.gameSession.playerStats.forEach((stats, playerId) => {
            if (stats.isAlive) {
              stats.health = Math.min(100, stats.health + 20);
            }
          });
        }
      }

      room.gameSession.history.push({
        role: 'dm',
        content: narrative,
        timestamp: Date.now()
      });

      const alivePlayers = Array.from(room.gameSession.playerStats.entries())
        .filter(([_, stats]) => stats.isAlive)
        .map(([id, _]) => id);

      room.gameSession.currentTurn = {
        actions: new Map(),
        waitingFor: new Set(alivePlayers)
      };

      const playerStatsArray = Array.from(room.gameSession.playerStats.entries()).map(([id, stats]) => ({
        id,
        ...stats
      }));

      io.to(roomId).emit('dm-response', {
        message: narrative,
        playerStats: playerStatsArray,
        sharedState: room.gameSession.sharedState,
        stateChanges: gameStateChanges
      });

      io.to(roomId).emit('new-turn');
    } catch (error) {
      console.error('Error processing action:', error);
      const errorMessage = error.status === 503
        ? 'Server AI sedang sibuk. Mohon coba lagi dalam beberapa saat.'
        : error.status === 429
          ? 'Terlalu banyak permintaan. Mohon tunggu sebentar.'
          : 'Gagal memproses aksi. Silakan coba lagi.';

      io.to(roomId).emit('error', { message: errorMessage });

      const alivePlayers = Array.from(room.gameSession.playerStats.entries())
        .filter(([_, stats]) => stats.isAlive)
        .map(([id, _]) => id);

      room.gameSession.currentTurn = {
        actions: new Map(),
        waitingFor: new Set(alivePlayers)
      }; io.to(roomId).emit('turn-reset');
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId) {
      const room = gameRooms.get(roomId);
      if (room) {
        const player = room.players.get(socket.id);
        room.players.delete(socket.id);

        if (room.players.size === 0) {
          gameRooms.delete(roomId);
        } else {
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