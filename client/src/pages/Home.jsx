import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import bgImage from "../assets/FcudMf.jpg";
import logo from "../assets/logo uhuy.jpg";
import multiplayerLogo from "../assets/multiplayer-logo.png";
import aiLogo from "../assets/ai logo.png";
import realtimeLogo from "../assets/realtime-logo.png";
import dynamicPlayLogo from "../assets/dynamic-play_logo.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div
      className="home-page"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="home-container">
        <div className="home-header">
          <img src={logo} alt="AI Dungeon Master" className="home-logo" />
          <p className="home-subtitle color-text-white">
            Embark on an AI-powered adventure with friends!
          </p>
        </div>

        <div className="mode-selection">
          <button
            className="mode-btn multiplayer"
            onClick={() => navigate("/lobby")}
          >
            <img src={multiplayerLogo} alt="Multiplayer" className="mode-icon-img" />
            <h3>Multiplayer Mode</h3>
            <p>Press to start the game</p>
          </button>
        </div>

        <div className="home-features">
          <div className="feature">
            <img src={aiLogo} alt="AI Powered" className="feature-icon-img" />
            <p>AI-Powered Storytelling</p>
          </div>
          <div className="feature">
            <img src={realtimeLogo} alt="Real-time" className="feature-icon-img" />
            <p>Real-time Responses</p>
          </div>
          <div className="feature">
            <img src={dynamicPlayLogo} alt="Dynamic Gameplay" className="feature-icon-img" />
            <p>Dynamic Gameplay</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
