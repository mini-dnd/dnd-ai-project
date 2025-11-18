import { createContext, useContext, useState, useEffect } from "react";
import socketService from "../services/socketService";

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [setting, setSetting] = useState("fantasy");
  const [messages, setMessages] = useState([]);
  const [gameState, setGameState] = useState({
    health: 100,
    inventory: [],
    location: "Unknown",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Multiplayer states
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();

    // Socket event listeners
    socketService.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    socketService.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    // Room management
    socketService.on("rooms-list", (roomsList) => {
      setRooms(roomsList);
    });

    socketService.on("rooms-list-updated", () => {
      socketService.emit("get-rooms");
    });

    socketService.on("room-created", (data) => {
      setCurrentRoom({ roomId: data.roomId, roomName: data.roomName });
      setPlayers(data.players);
      setIsHost(true);
      setIsLoading(false);
    });

    socketService.on("room-joined", (data) => {
      setCurrentRoom({ roomId: data.roomId, roomName: data.roomName });
      setPlayers(data.players);
      setIsHost(false);
      setIsLoading(false);
    });

    socketService.on("player-joined", (data) => {
      setPlayers(data.players);
      if (data.newPlayer) {
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            content: `${data.newPlayer} joined the room`,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    socketService.on("player-left", (data) => {
      setPlayers(data.players);
      if (data.leftPlayer) {
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            content: `${data.leftPlayer} left the room`,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    socketService.on("game-started", (data) => {
      setMessages([
        {
          type: "dm",
          content: data.message,
          timestamp: Date.now(),
        },
      ]);
      setGameState(data.gameState);
      setGameStarted(true);
      setIsLoading(false);
    });

    socketService.on("dm-response", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "dm",
          content: data.message,
          timestamp: Date.now(),
        },
      ]);
      setGameState(data.gameState);
      setIsLoading(false);
    });

    socketService.on("error", (data) => {
      alert(data.message);
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      socketService.disconnect();
    };
  }, []);

  const startGame = (name, gameSetting) => {
    setPlayerName(name);
    setSetting(gameSetting);
    setIsLoading(true);
    socketService.emit("start-game", {
      playerName: name,
      setting: gameSetting,
    });
  };

  const getRooms = () => {
    socketService.emit("get-rooms");
  };

  const createRoom = ({ roomName, playerName: name, maxPlayers }) => {
    setPlayerName(name);
    setIsLoading(true);
    socketService.emit("create-room", {
      roomName,
      playerName: name,
      maxPlayers,
    });
  };

  const joinRoom = ({ roomId, playerName: name }) => {
    setPlayerName(name);
    setIsLoading(true);
    socketService.emit("join-room", { roomId, playerName: name });
  };

  const leaveRoom = () => {
    socketService.emit("leave-room");
    // Clear states immediately after emitting
    setCurrentRoom(null);
    setPlayers([]);
    setIsHost(false);
    setGameStarted(false);
    setMessages([]);
    setGameState({
      health: 100,
      inventory: [],
      location: "Unknown",
    });
  };

  const sendAction = (action) => {
    if (!action.trim() || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        type: "player",
        content: action,
        timestamp: Date.now(),
      },
    ]);
    setIsLoading(true);
    socketService.emit("player-action", { action });
  };

  const resetGame = () => {
    setGameStarted(false);
    setPlayerName("");
    setSetting("fantasy");
    setMessages([]);
    setGameState({
      health: 100,
      inventory: [],
      location: "Unknown",
    });
    setIsLoading(false);
  };

  const value = {
    gameStarted,
    playerName,
    setting,
    messages,
    gameState,
    isLoading,
    isConnected,
    rooms,
    currentRoom,
    players,
    isHost,
    startGame,
    sendAction,
    resetGame,
    getRooms,
    createRoom,
    joinRoom,
    leaveRoom,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
