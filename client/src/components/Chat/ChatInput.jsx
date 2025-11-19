import { useState } from "react";
import { useGame } from "../../context/GameContext";
import "../../styles/components.css";

const ChatInput = () => {
  const [action, setAction] = useState("");
  const { sendAction, isLoading } = useGame();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!action.trim() || isLoading) return;

    sendAction(action);
    setAction("");
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input"
        placeholder="What do you do? (e.g., 'I search the room', 'I attack the goblin')"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        disabled={isLoading}
      />
      <button
        type="submit"
        className="chat-submit-btn"
        disabled={isLoading || !action.trim()}
      >
        {isLoading ? "⏳" : "➤"}
      </button>
    </form>
  );
};

export default ChatInput;
