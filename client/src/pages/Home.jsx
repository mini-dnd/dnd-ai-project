import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-title">🎲 AI Dungeon Master</h1>
          <p className="home-subtitle">
            Embark on an AI-powered adventure with friends!
          </p>
        </div>

        <div className="mode-selection">
          <button
            className="mode-btn multiplayer"
            onClick={() => navigate("/lobby")}
          >
            <span className="mode-icon">👥</span>
            <h3>Multiplayer Mode</h3>
            <p>Play with friends in real-time</p>
          </button>
        </div>

        <div className="home-features">
          <div className="feature">
            <span>🤖</span>
            <p>AI-Powered Storytelling</p>
          </div>
          <div className="feature">
            <span>⚡</span>
            <p>Real-time Responses</p>
          </div>
          <div className="feature">
            <span>🎮</span>
            <p>Dynamic Gameplay</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
