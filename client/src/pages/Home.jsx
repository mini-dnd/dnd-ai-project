import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import '../styles/Home.css';
import bgImage from '../assets/FcudMf.jpg';
import logo from '../assets/logo uhuy.jpg';
import multiplayerLogo from '../assets/multiplayer-logo.png';
import aiLogo from '../assets/ai logo.png';
import realtimeLogo from '../assets/realtime-logo.png';
import dynamicPlayLogo from '../assets/dynamic-play_logo.png';

const Home = () => {
    const navigate = useNavigate();
    const { playerName, setPlayerName } = useGame();
    const [nameInput, setNameInput] = useState(playerName);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        setNameInput(playerName);
    }, [playerName]);

    const handleNavigateToLobby = () => {
        const trimmedName = nameInput.trim();
        if (!trimmedName) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
            return;
        }

        setPlayerName(trimmedName);
        navigate('/lobby');
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        handleNavigateToLobby();
    };

    const handleButtonClick = () => {
        if (!nameInput.trim()) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3500);
            return;
        }
        handleNavigateToLobby();
    };

    return (
        <div className="home-page" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {showNotification && (
                <div className="fantasy-notification">
                    <div className="notification-content">
                        <span className="notification-icon">⚔️</span>
                        <div className="notification-text">
                            <strong>Hark, Adventurer!</strong>
                            <p>Thou must reveal thy name before embarking on this quest!</p>
                        </div>
                    </div>
                </div>
            )}
            <div className="home-container">
                <div className="home-header">
                    <img src={logo} alt="AI Dungeon Master" className="home-logo" />
                    <p className="home-subtitle color-text-white">Embark on an AI-powered adventure with friends!</p>
                </div>

                <form className="player-name-card" onSubmit={handleSubmit}>
                    <label htmlFor="home-player-name">State Your Name Adventure !</label>
                    <div className="player-name-input-group">
                        <input
                            id="home-player-name"
                            type="text"
                            value={nameInput}
                            onChange={(event) => setNameInput(event.target.value)}
                            placeholder="Enter your name"
                            maxLength={20}
                            className="home-player-input"
                        />
                    </div>
                </form>

                <div className="mode-selection">
                    <button className="mode-btn multiplayer" type="button" onClick={handleButtonClick}>
                        <img src={multiplayerLogo} alt="Multiplayer" className="mode-icon-img" />
                        <h3>Multiplayer Mode</h3>
                        <p>{nameInput.trim() ? 'Press to start the game' : 'Enter your name first'}</p>
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
