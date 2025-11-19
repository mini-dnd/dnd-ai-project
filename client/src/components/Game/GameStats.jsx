import { useGame } from "../../context/GameContext";
import "../../styles/components.css";
import healthIcon from "../../assets/health.svg";
import locationIcon from "../../assets/location.svg";

const GameStats = () => {
  const { gameState } = useGame();

  const getHealthColor = (health) => {
    if (health > 70) return "#10b981";
    if (health > 30) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="game-stats">
      <div className="stat">
        <span className="stat-icon">
          <img src={healthIcon} alt="health" style={{ width: '24px', height: '24px' }} />
        </span>
        <div className="stat-info">
          <span className="stat-label">Health</span>
          <div className="health-bar">
            <div
              className="health-fill"
              style={{
                width: `${gameState.health}%`,
                backgroundColor: getHealthColor(gameState.health),
              }}
            ></div>
          </div>
          <span className="stat-value">{gameState.health}/100</span>
        </div>
      </div>
      <div className="stat">
        <span className="stat-icon">
          <img src={locationIcon} alt="location" style={{ width: '24px', height: '24px' }} />
        </span>
        <div className="stat-info">
          <span className="stat-label">Location</span>
          <span className="stat-value">{gameState.location}</span>
        </div>
      </div>
      <div className="stat">
        <span className="stat-icon">🎒</span>
        <div className="stat-info">
          <span className="stat-label">Inventory</span>
          <span className="stat-value">{gameState.inventory.length} items</span>
        </div>
      </div>
    </div>
  );
};

export default GameStats;
