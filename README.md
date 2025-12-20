# Dungeon Master AI 🎲✨

An interactive Dungeon Master adventure application powered by Artificial Intelligence. This project enables users to engage in dynamic storytelling with an AI Game Master and supports real-time multiplayer interactions.

## 🚀 Key Features

* **AI Game Master**: Powered by Google Generative AI (Gemini) to provide immersive and adaptive storytelling.
* **Real-time Interaction**: Seamless communication between clients and server using Socket.io.
* **Modern Interface**: Built with React 19 and Vite for a fast and responsive user experience.
* **Dynamic Maps**: Integration with React Leaflet for visualizing game locations and movement.
* **Advanced State Management**: Efficient data handling across the application using Redux Toolkit.

## 🛠️ Tech Stack

### Frontend
* **Core**: React 19.2.0, Vite
* **Routing**: React Router DOM 7.9.6
* **Real-time**: Socket.io-client 4.8.1
* **Styling**: Tailwind CSS, Lucide React (Icons)
* **Utilities**: Axios, date-fns, React Hot Toast

### Backend
* **Runtime**: Node.js
* **Framework**: Express 5.1.0
* **AI Engine**: Google Generative AI (Gemini)
* **Real-time Server**: Socket.io 4.8.1
* **Security**: CORS

## 📂 Project Structure

```text
dnd-ai-project/
├── client/                # React Frontend (Vite)
│   ├── src/
│   │   ├── components/    # UI Components (Chat, Game, Layout)
│   │   ├── context/       # Game & Theme Context Providers
│   │   ├── pages/         # Application Views (Home, Lobby, GameRoom)
│   │   └── services/      # Socket.io & API logic
└── server/                # Express Backend
    ├── app.js             # Main server entry point
    └── .env               # Environment configurations (API Keys)
```

