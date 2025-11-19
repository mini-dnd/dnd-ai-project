/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';

// Theme styles definition
const themes = {
    light: {
        navbar: {
            background: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.95))',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        },
        body: {
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e3f0ff 100%)',
            color: '#1f2933',
        },
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#0f172a',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.15)',
        },
        button: {
            background: 'linear-gradient(to bottom, #e0e7ff, #c7d2fe)',
            color: '#1e1b4b',
            border: '1px solid rgba(79, 70, 229, 0.2)',
        },
    },
    dark: {
        navbar: {
            background: 'linear-gradient(to bottom, rgba(15, 22, 33, 0.95), rgba(10, 15, 23, 0.95))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        },
        body: {
            background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
            color: '#c7d5e0',
        },
        container: {
            backgroundColor: '#171a21',
            color: '#c7d5e0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 18px 50px rgba(2, 6, 14, 0.7)',
        },
        button: {
            background: 'linear-gradient(to bottom, #454d58, #3a4149)',
            color: '#e6eef9',
            border: '1px solid rgba(255, 255, 255, 0.08)',
        },
    },
};

export const ThemeContext = createContext({
    currentTheme: 'light',
    setCurrentTheme: () => {},
    theme: themes.light,
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState('light');

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                setCurrentTheme,
                theme: themes[currentTheme],
            }}>
            {children}
        </ThemeContext.Provider>
    );
}
