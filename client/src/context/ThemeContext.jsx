import { createContext, useState } from 'react';

const ThemeContext = createContext({
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

export default function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState("light")

    return (
        <ThemeContext.Provider value={{
            currentTheme,
            setCurrentTheme,
            theme: {
                light: {
                    homeContainer: "bg-white p-5"
                },
                dark: {
                    homeContainer: "bg-gray-700 p-5"
                }
            }
        }}>
            {children}
        </ThemeContext.Provider>
    )
}
