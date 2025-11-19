import { Link } from "react-router-dom";
import { useGame } from "../../context/GameContext";
import "../../styles/components.css";

const Navbar = () => {
  const { isConnected, gameStarted, resetGame } = useGame();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🎲 AI Dungeon Master</Link>
      </div>
      <div className="navbar-menu">
        <div className="connection-status">
          <span
            className={`status-dot ${
              isConnected ? "connected" : "disconnected"
            }`}
          ></span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
        {gameStarted && (
          <Link to="/" onClick={resetGame} className="nav-button">
            New Game
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
