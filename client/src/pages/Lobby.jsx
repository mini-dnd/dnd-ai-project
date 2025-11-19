import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import "../styles/Lobby.css";

const Lobby = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { rooms, currentRoom, createRoom, joinRoom, getRooms, isLoading } =
    useGame();
  const navigate = useNavigate();

  useEffect(() => {
    getRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate to game room when currentRoom is set
  useEffect(() => {
    if (currentRoom) {
      navigate("/game");
    }
  }, [currentRoom, navigate]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim() || isLoading) return;

    createRoom({ roomName, playerName, maxPlayers });
  };

  const handleJoinRoom = (roomId) => {
    if (!playerName.trim() || isLoading) return;

    joinRoom({ roomId, playerName });
  };

  return (
    <div className="lobby-page">
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>🎲 Multiplayer Lobby</h1>
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>

        {!showCreateForm ? (
          <>
            <div className="player-name-section">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="player-name-input"
              />
            </div>

            <div className="lobby-actions">
              <button
                className="create-room-btn"
                onClick={() => setShowCreateForm(true)}
                disabled={!playerName.trim()}
              >
                + Create New Room
              </button>
              <button className="refresh-btn" onClick={getRooms}>
                🔄 Refresh
              </button>
            </div>

            <div className="rooms-section">
              <h2>Available Rooms</h2>
              {rooms.length === 0 ? (
                <div className="no-rooms">
                  <p>No rooms available. Create one to start!</p>
                </div>
              ) : (
                <div className="rooms-grid">
                  {rooms.map((room) => (
                    <div
                      key={room.roomId}
                      className={`room-card ${
                        room.isStarted || room.playerCount >= room.maxPlayers
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <div className="room-header">
                        <h3>{room.roomName}</h3>
                        {room.isStarted && (
                          <span className="status-badge in-progress">
                            In Progress
                          </span>
                        )}
                      </div>
                      <div className="room-info">
                        <span>
                          👥 {room.playerCount}/{room.maxPlayers} players
                        </span>
                      </div>
                      <button
                        className="join-btn"
                        onClick={() => handleJoinRoom(room.roomId)}
                        disabled={
                          !playerName.trim() ||
                          room.isStarted ||
                          room.playerCount >= room.maxPlayers ||
                          isLoading
                        }
                      >
                        {room.isStarted
                          ? "Game Started"
                          : room.playerCount >= room.maxPlayers
                          ? "Room Full"
                          : "Join Room"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="create-room-form">
            <h2>Create New Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  required
                />
              </div>

              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  placeholder="Enter room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Players</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                  <option value={6}>6 Players</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!playerName.trim() || !roomName.trim() || isLoading}
                >
                  {isLoading ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
