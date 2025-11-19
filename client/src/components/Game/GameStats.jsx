import { useGame } from "../../context/GameContext";
import "../../styles/components.css";
import healthIcon from "../../assets/health.svg";
import locationIcon from "../../assets/location.svg";

const GameStats = () => {
  const { myPlayerStats, sharedState, playerStats } = useGame();

  const getHealthColor = (health) => {
    if (health > 70) return "#10b981";
    if (health > 30) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="game-stats">
      <div className="stat">
        <span className="stat-icon">
          <img
            src={healthIcon}
            alt="health"
            style={{ width: "24px", height: "24px" }}
          />
        </span>
        <div className="stat-info">
          <span className="stat-label">
            Your Health {!myPlayerStats.isAlive && "💀 DEAD"}
          </span>
          <div className="health-bar">
            <div
              className="health-fill"
              style={{
                width: `${myPlayerStats.health}%`,
                backgroundColor: myPlayerStats.isAlive
                  ? getHealthColor(myPlayerStats.health)
                  : "#6b7280",
              }}
            ></div>
          </div>
          <span className="stat-value">{myPlayerStats.health}/100</span>
        </div>
      </div>
      <div className="stat">
        <span className="stat-icon">
          <img
            src={locationIcon}
            alt="location"
            style={{ width: "24px", height: "24px" }}
          />
        </span>
        <div className="stat-info">
          <span className="stat-label">Location</span>
          <span className="stat-value">{sharedState.location}</span>
        </div>
      </div>
      <div className="stat">
        <span className="stat-icon">🎒</span>
        <div className="stat-info">
          <span className="stat-label">Your Items</span>
          <span className="stat-value">
            {myPlayerStats.inventory.length} items
          </span>
        </div>
      </div>

      {/* Show other players health */}
      {playerStats.length > 1 && (
        <div className="stat other-players">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-label">Party Status</span>
            <div className="party-health">
              {playerStats.map((player, idx) => (
                <div key={idx} className="party-member">
                  <span className="party-member-name">
                    {player.name} {!player.isAlive && "💀"}
                  </span>
                  <span className="party-member-health">
                    HP: {player.health}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStats;
