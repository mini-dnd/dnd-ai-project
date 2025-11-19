import "../../styles/components.css";

const ChatMessage = ({ message, currentPlayerName }) => {
  const { type, content, playerName } = message;

  const getSenderName = () => {
    if (type === "dm") return "Dungeon Master";
    if (type === "system") return "System";
    if (playerName === currentPlayerName) return "You";
    return playerName || "Player";
  };

  const getAvatar = () => {
    if (type === "dm") return "🎭";
    if (type === "system") return "📢";
    return "⚔️";
  };

  return (
    <div className={`chat-message ${type}`}>
      <div className="message-header">
        <span className="message-avatar">{getAvatar()}</span>
        <span className="message-sender">{getSenderName()}</span>
      </div>
      <div className="message-content">{content}</div>
    </div>
  );
};

export default ChatMessage;
