import GameStats from "./GameStats";
import "../../styles/components.css";
import mainLogo from "../../assets/main-logo.png";

const GameHeader = ({ playerName, roomName, players = [], onLeaveRoom }) => {
  return (
    <div className="game-header">
      <div className="game-title">
        <div>
          <h2>
            <img src={mainLogo} alt="logo" style={{ width: '32px', height: '32px', verticalAlign: 'middle', marginRight: '8px' }} />
            {roomName || `${playerName}'s Adventure`}
          </h2>
          {players.length > 0 && (
            <div className="players-info">
              {players.map((player, idx) => (
                <span key={player.id} className="player-badge">
                  {player.name}
                  {idx < players.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>
        {onLeaveRoom && (
          <button className="leave-room-btn" onClick={onLeaveRoom}>
            Leave Room
          </button>
        )}
      </div>
      <GameStats />
    </div>
  );
};

export default GameHeader;
