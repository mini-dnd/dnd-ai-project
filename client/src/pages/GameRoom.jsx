import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import GameHeader from "../components/Game/GameHeader";
import ChatMessage from "../components/Chat/ChatMessage";
import ChatInput from "../components/Chat/ChatInput";
import "../styles/GameRoom.css";

const GameRoom = () => {
  const {
    gameStarted,
    playerName,
    messages,
    isLoading,
    currentRoom,
    players,
    isHost,
    startGame,
    leaveRoom,
  } = useGame();
  const [selectedSetting, setSelectedSetting] = useState("fantasy");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentRoom) {
      navigate("/lobby");
    }
  }, [currentRoom, navigate]);

  const handleStartGame = () => {
    startGame(playerName, selectedSetting);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentRoom) {
    return null;
  }

  return (
    <div className="game-room">
      <GameHeader
        playerName={playerName}
        roomName={currentRoom.roomName}
        players={players}
        onLeaveRoom={handleLeaveRoom}
      />

      {!gameStarted && (
        <div className="waiting-room">
          <div className="waiting-card">
            <h3>Waiting for players...</h3>
            <div className="players-list">
              {players.map((player) => (
                <div key={player.id} className="player-item">
                  <span>{player.name}</span>
                  {player.isHost && <span className="host-badge">Host</span>}
                </div>
              ))}
            </div>

            {isHost && (
              <div className="host-controls">
                <div className="setting-select">
                  <label>Choose Setting:</label>
                  <select
                    value={selectedSetting}
                    onChange={(e) => setSelectedSetting(e.target.value)}
                  >
                    <option value="fantasy">⚔️ Fantasy</option>
                    <option value="sci-fi">🚀 Sci-Fi</option>
                    <option value="horror">👻 Horror</option>
                    <option value="mystery">🔍 Mystery</option>
                  </select>
                </div>
                <button
                  className="start-game-btn"
                  onClick={handleStartGame}
                  disabled={players.length < 1}
                >
                  Start Adventure
                </button>
              </div>
            )}

            {!isHost && (
              <p className="waiting-text">
                Waiting for host to start the game...
              </p>
            )}
          </div>
        </div>
      )}

      <div className="messages-container">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}

        {isLoading && (
          <div className="loading-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>The Dungeon Master is thinking...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput />
    </div>
  );
};

export default GameRoom;
