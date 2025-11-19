import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import NotFound from './pages/NotFound';
import './App.css';
import ThemeProvider from './context/ThemeContext';

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <GameProvider>
                    <div className="app">
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/lobby" element={<Lobby />} />
                            <Route path="/game" element={<GameRoom />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </div>
                </GameProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
