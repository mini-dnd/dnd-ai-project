/* eslint-disable react-refresh/only-export-components */
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
  const [playerStats, setPlayerStats] = useState([]);
  const [sharedState, setSharedState] = useState({
    location: "Unknown",
    partyInventory: [],
  });
  const [myPlayerStats, setMyPlayerStats] = useState({
    health: 100,
    isAlive: true,
    inventory: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [turnStatus, setTurnStatus] = useState({
    submitted: [],
    waiting: [],
    total: 0,
  });
  const [hasSubmittedThisTurn, setHasSubmittedThisTurn] = useState(false);

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
      setPlayerStats(data.playerStats || []);
      setSharedState(
        data.sharedState || { location: "Unknown", partyInventory: [] }
      );

      // Find my player stats
      const myStats = (data.playerStats || []).find(
        (p) => p.name === playerName
      );
      if (myStats) {
        setMyPlayerStats({
          health: myStats.health,
          isAlive: myStats.isAlive,
          inventory: myStats.inventory,
        });
      }

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

      // Update player stats
      const newPlayerStats = data.playerStats || [];
      setPlayerStats(newPlayerStats);
      setSharedState(data.sharedState || sharedState);

      // Find my player stats
      const myStats = newPlayerStats.find((p) => p.name === playerName);
      if (myStats) {
        setMyPlayerStats({
          health: myStats.health,
          isAlive: myStats.isAlive,
          inventory: myStats.inventory,
        });
      }

      // Add state change notifications if any
      if (data.stateChanges) {
        const notifications = [];

        // Check for player deaths or health changes
        if (
          data.stateChanges.playerChanges &&
          Array.isArray(data.stateChanges.playerChanges)
        ) {
          data.stateChanges.playerChanges.forEach((change) => {
            if (change.healthChange !== 0) {
              const sign = change.healthChange > 0 ? "+" : "";

              // Check if this player died
              const updatedPlayer = newPlayerStats.find(
                (p) => p.name === change.playerName
              );
              if (updatedPlayer && !updatedPlayer.isAlive) {
                notifications.push(`💀 ${change.playerName} telah mati!`);
              } else {
                notifications.push(
                  `${change.playerName}: Health ${sign}${change.healthChange}`
                );
              }
            }

            if (change.inventoryAdd && change.inventoryAdd.length > 0) {
              notifications.push(
                `${change.playerName} ➕: ${change.inventoryAdd.join(", ")}`
              );
            }

            if (change.inventoryRemove && change.inventoryRemove.length > 0) {
              notifications.push(
                `${change.playerName} ➖: ${change.inventoryRemove.join(", ")}`
              );
            }
          });
        }

        if (data.stateChanges.locationChange) {
          notifications.push(
            `📍 Moved to: ${data.stateChanges.locationChange}`
          );
        }

        if (
          data.stateChanges.partyInventoryAdd &&
          data.stateChanges.partyInventoryAdd.length > 0
        ) {
          notifications.push(
            `🎒 Party gained: ${data.stateChanges.partyInventoryAdd.join(", ")}`
          );
        }

        if (
          data.stateChanges.partyInventoryRemove &&
          data.stateChanges.partyInventoryRemove.length > 0
        ) {
          notifications.push(
            `🎒 Party used: ${data.stateChanges.partyInventoryRemove.join(
              ", "
            )}`
          );
        }

        // Add notification messages
        if (notifications.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              type: "system",
              content: notifications.join(" | "),
              timestamp: Date.now(),
            },
          ]);
        }
      }

      setIsLoading(false);
      setHasSubmittedThisTurn(false);
    });

    socketService.on("turn-status", (data) => {
      setTurnStatus(data);
    });

    socketService.on("new-turn", () => {
      setHasSubmittedThisTurn(false);
      setTurnStatus({
        submitted: [],
        waiting: [],
        total: 0,
      });
    });

    socketService.on("turn-reset", () => {
      setHasSubmittedThisTurn(false);
      setIsLoading(false);
      setTurnStatus({
        submitted: [],
        waiting: [],
        total: 0,
      });
    });

    socketService.on("error", (data) => {
      setError(data.message);
      setIsLoading(false);
    });

    socketService.on("ai-processing", (data) => {
      setIsLoading(true);
      setError(null);
      if (data.message) {
        // Optional: could show processing message
        console.log(data.message);
      }
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
    setPlayerStats([]);
    setSharedState({
      location: "Unknown",
      partyInventory: [],
    });
    setMyPlayerStats({
      health: 100,
      isAlive: true,
      inventory: [],
    });
  };

  const sendAction = (action) => {
    if (!action.trim() || isLoading || hasSubmittedThisTurn) return;

    // Check if player is alive
    if (!myPlayerStats.isAlive) {
      setError("Anda sudah mati dan tidak bisa melakukan aksi.");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        type: "player",
        content: action,
        timestamp: Date.now(),
        playerName: playerName,
      },
    ]);
    setHasSubmittedThisTurn(true);
    socketService.emit("player-action", { action });
  };

  const resetGame = () => {
    setGameStarted(false);
    setPlayerName("");
    setSetting("fantasy");
    setMessages([]);
    setPlayerStats([]);
    setSharedState({
      location: "Unknown",
      partyInventory: [],
    });
    setMyPlayerStats({
      health: 100,
      isAlive: true,
      inventory: [],
    });
    setIsLoading(false);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    gameStarted,
    playerName,
    setPlayerName,
    setting,
    messages,
    playerStats,
    sharedState,
    myPlayerStats,
    isLoading,
    isConnected,
    error,
    clearError,
    turnStatus,
    hasSubmittedThisTurn,
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
