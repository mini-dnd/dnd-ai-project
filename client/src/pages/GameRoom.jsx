import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import GameHeader from "../components/Game/GameHeader";
import ChatMessage from "../components/Chat/ChatMessage";
import ChatInput from "../components/Chat/ChatInput";
import "../styles/GameRoom.css";
import bgGameRoom from "../assets/bg-gameroom.png";
import witchIcon from "../assets/witch.png";
import playerIcon from "../assets/player.svg";
import itemIcon from "../assets/item.svg";
import fantasyIcon from "../assets/fantasy.svg";
import sciFiIcon from "../assets/sci-fi.svg";
import horrorIcon from "../assets/horror.svg";
import mysteryIcon from "../assets/mystery.svg";

const GameRoom = () => {
  const {
    gameStarted,
    playerName,
    messages,
    isLoading,
    currentRoom,
    players,
    isHost,
    error,
    clearError,
    startGame,
    leaveRoom,
  } = useGame();
  const [selectedSetting, setSelectedSetting] = useState("fantasy");
  const [isStartingGame, setIsStartingGame] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentRoom) {
      navigate("/lobby");
    }
  }, [currentRoom, navigate]);

  const handleStartGame = () => {
    clearError();
    setIsStartingGame(true);
    startGame(playerName, selectedSetting);
  };

  useEffect(() => {
    if (gameStarted && isStartingGame) {
      setIsStartingGame(false);
    }
  }, [gameStarted, isStartingGame]);

  useEffect(() => {
    if (error) {
      setIsStartingGame(false);
    }
  }, [error]);

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
    <div
      className="game-room-page"
      style={{
        backgroundImage: `url(${bgGameRoom})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="game-room-container">
        <GameHeader
          playerName={playerName}
          roomName={currentRoom.roomName}
          players={players}
          onLeaveRoom={handleLeaveRoom}
        />

        {!gameStarted && (
          <div className="waiting-room">
            <div className="waiting-card">
              <h3>
                <img
                  src={witchIcon}
                  alt="witch"
                  style={{
                    width: "100px",
                    height: "100px",
                    verticalAlign: "middle",
                    marginRight: "30px",
                  }}
                />
                Gathering Adventurers...
              </h3>
              <div className="players-list">
                {players.map((player) => (
                  <div key={player.id} className="player-item">
                    <span className="player-name">
                      <img
                        src={playerIcon}
                        alt="player"
                        style={{
                          width: "20px",
                          height: "20px",
                          verticalAlign: "middle",
                          marginRight: "6px",
                        }}
                      />
                      {player.name}
                    </span>
                    {player.isHost && (
                      <span className="host-badge">⭐ Host</span>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="error-alert">
                  <div className="error-content">
                    <span className="error-icon">⚠️</span>
                    <p className="error-message">{error}</p>
                    <button className="error-close" onClick={clearError}>
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {isHost && (
                <div className="host-controls">
                  <div className="setting-select">
                    <label>Choose Your Adventure Setting:</label>
                    <div className="setting-display">
                      {selectedSetting === "fantasy" && (
                        <img
                          src={fantasyIcon}
                          alt="fantasy"
                          className="setting-icon"
                        />
                      )}
                      {selectedSetting === "sci-fi" && (
                        <img
                          src={sciFiIcon}
                          alt="sci-fi"
                          className="setting-icon"
                        />
                      )}
                      {selectedSetting === "horror" && (
                        <img
                          src={horrorIcon}
                          alt="horror"
                          className="setting-icon"
                        />
                      )}
                      {selectedSetting === "mystery" && (
                        <img
                          src={mysteryIcon}
                          alt="mystery"
                          className="setting-icon"
                        />
                      )}
                      <select
                        value={selectedSetting}
                        onChange={(e) => setSelectedSetting(e.target.value)}
                        disabled={isStartingGame}
                      >
                        <option value="fantasy">
                          Fantasy - Medieval Realms
                        </option>
                        <option value="sci-fi">Sci-Fi - Space Odyssey</option>
                        <option value="horror">Horror - Dark Mysteries</option>
                        <option value="mystery">
                          Mystery - Detective Tales
                        </option>
                      </select>
                    </div>
                  </div>
                  <button
                    className="start-game-btn"
                    onClick={handleStartGame}
                    disabled={players.length < 1 || isStartingGame}
                  >
                    <img
                      src={itemIcon}
                      alt="dice"
                      style={{
                        width: "20px",
                        height: "20px",
                        verticalAlign: "middle",
                        marginRight: "6px",
                      }}
                    />
                    Begin Adventure
                  </button>

                  {isStartingGame && (
                    <div className="dungeon-loading">
                      <div className="dungeon-loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <span className="spinner-icon">🏰</span>
                      </div>
                      <p className="dungeon-loading-text">
                        The Dungeon is preparing for you...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isHost && (
                <p className="waiting-text">
                  ⏳ Waiting for the host to start the adventure...
                </p>
              )}
            </div>
          </div>
        )}

        {gameStarted && (
          <div className="game-content">
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
                  <p>🎭 The Dungeon Master is thinking...</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <ChatInput />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
