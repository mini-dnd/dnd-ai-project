import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components.css';
import logo from '../../assets/logo uhuy.jpg';

const Navbar = () => {
    const { isConnected, gameStarted, resetGame } = useGame();
    const { currentTheme, setCurrentTheme } = useTheme();

    useEffect(() => {
        document.documentElement.dataset.theme = currentTheme;
        document.body.dataset.theme = currentTheme;
    }, [currentTheme]);

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">
                    <img src={logo} alt="AI Dungeon Master" className="navbar-logo" />
                </Link>
            </div>
            <div className="navbar-menu">
                <button
                    type="button"
                    className="theme-toggle-btn"
                    onClick={() => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light')}>
                    {currentTheme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
                <div className="connection-status">
                    <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                    {isConnected ? 'Connected' : 'Disconnected'}
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
