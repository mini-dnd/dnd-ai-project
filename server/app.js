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

// Store game sessions
const gameSessions = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create new game session
  socket.on('start-game', async (data) => {
    const { playerName, setting } = data;

    const sessionId = socket.id;
    const gameSession = {
      playerName,
      setting: setting || 'fantasy',
      history: [],
      gameState: {
        health: 100,
        inventory: [],
        location: 'Starting Point'
      }
    };

    gameSessions.set(sessionId, gameSession);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You are a Dungeon Master for a ${setting} RPG game. 
    The player's name is ${playerName}. 
    Create an engaging opening scene for the adventure. 
    Keep it brief (3-4 sentences) and end with a question or choice for the player.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      gameSession.history.push({
        role: 'dm',
        content: response,
        timestamp: Date.now()
      });

      socket.emit('game-started', {
        message: response,
        gameState: gameSession.gameState
      });
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Handle player actions
  socket.on('player-action', async (data) => {
    const { action } = data;
    const sessionId = socket.id;
    const gameSession = gameSessions.get(sessionId);

    if (!gameSession) {
      socket.emit('error', { message: 'No active game session' });
      return;
    }

    gameSession.history.push({
      role: 'player',
      content: action,
      timestamp: Date.now()
    });

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const conversationHistory = gameSession.history
      .map(h => `${h.role === 'player' ? 'Player' : 'DM'}: ${h.content}`)
      .join('\n');

    const prompt = `You are a Dungeon Master for a ${gameSession.setting} RPG game.
    
Current game state:
- Player: ${gameSession.playerName}
- Health: ${gameSession.gameState.health}
- Location: ${gameSession.gameState.location}
- Inventory: ${gameSession.gameState.inventory.join(', ') || 'empty'}

Conversation history:
${conversationHistory}

Player action: ${action}

Respond as the Dungeon Master. Be creative, engaging, and continue the story. 
Keep responses brief (3-5 sentences). 
If the action affects health, inventory, or location, mention it clearly.
End with a question or present new choices.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Simple game state updates
      if (response.toLowerCase().includes('damage') || response.toLowerCase().includes('hurt')) {
        gameSession.gameState.health = Math.max(0, gameSession.gameState.health - 10);
      }
      if (response.toLowerCase().includes('heal')) {
        gameSession.gameState.health = Math.min(100, gameSession.gameState.health + 20);
      }

      gameSession.history.push({
        role: 'dm',
        content: response,
        timestamp: Date.now()
      });

      socket.emit('dm-response', {
        message: response,
        gameState: gameSession.gameState
      });
    } catch (error) {
      console.error('Error processing action:', error);
      socket.emit('error', { message: 'Failed to process action' });
    }
  });

  socket.on('disconnect', () => {
    gameSessions.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});