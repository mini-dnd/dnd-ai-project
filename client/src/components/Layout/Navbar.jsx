import { Link } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components.css';
import logo from '../../assets/logo uhuy.jpg';

const Navbar = () => {
    const { isConnected, gameStarted, resetGame } = useGame();
    const { currentTheme, setCurrentTheme } = useTheme();

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">
                    <img src={logo} alt="AI Dungeon Master" className="navbar-logo" />
                </Link>
            </div>
            <div className="navbar-menu">
                <div className="theme-toggle-group">
                    <button
                        type="button"
                        className={`theme-btn ${currentTheme === 'light' ? 'active' : ''}`}
                        onClick={() => setCurrentTheme('light')}>
                        Light
                    </button>
                    <button
                        type="button"
                        className={`theme-btn ${currentTheme === 'dark' ? 'active' : ''}`}
                        onClick={() => setCurrentTheme('dark')}>
                        Dark
                    </button>
                </div>
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
