/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
    currentTheme: '',
    setCurrentTheme: () => {},
    theme: {
        light: {
            homeContainer: '',
        },
        dark: {
            homeContainer: '',
        },
    },
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState('light');

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = currentTheme;
            document.body.dataset.theme = currentTheme;
        }
    }, [currentTheme]);

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                setCurrentTheme,
                theme: {
                    light: {
                        homeContainer: 'bg-white p-5',
                    },
                    dark: {
                        homeContainer: 'bg-gray-700 p-5',
                    },
                },
            }}>
            {children}
        </ThemeContext.Provider>
    );
}
