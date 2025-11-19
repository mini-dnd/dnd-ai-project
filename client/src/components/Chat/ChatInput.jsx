import { useState } from "react";
import { useGame } from "../../context/GameContext";
import "../../styles/components.css";

const ChatInput = () => {
  const [action, setAction] = useState("");
  const { sendAction, isLoading, hasSubmittedThisTurn, myPlayerStats } =
    useGame();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !action.trim() ||
      isLoading ||
      hasSubmittedThisTurn ||
      !myPlayerStats.isAlive
    )
      return;

    sendAction(action);
    setAction("");
  };

  const getPlaceholder = () => {
    if (!myPlayerStats.isAlive) {
      return "You are dead. You can only observe...";
    }
    if (hasSubmittedThisTurn) {
      return "Waiting for other players...";
    }
    return "What do you do? (e.g., 'I search the room', 'I attack the goblin')";
  };

  const isDisabled =
    isLoading || hasSubmittedThisTurn || !myPlayerStats.isAlive;

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input"
        placeholder={getPlaceholder()}
        value={action}
        onChange={(e) => setAction(e.target.value)}
        disabled={isDisabled}
      />
      <button
        type="submit"
        className="chat-submit-btn"
        disabled={isDisabled || !action.trim()}
        title={
          !myPlayerStats.isAlive
            ? "You are dead"
            : hasSubmittedThisTurn
            ? "Waiting for other players"
            : "Send action"
        }
      >
        {!myPlayerStats.isAlive
          ? "💀"
          : hasSubmittedThisTurn
          ? "✓"
          : isLoading
          ? "⏳"
          : "➤"}
      </button>
    </form>
  );
};

export default ChatInput;
