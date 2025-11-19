import "../../styles/components.css";

const ChatMessage = ({ message }) => {
  const { type, content } = message;

  return (
    <div className={`chat-message ${type}`}>
      <div className="message-header">
        <span className="message-avatar">{type === "dm" ? "🎭" : "⚔️"}</span>
        <span className="message-sender">
          {type === "dm" ? "Dungeon Master" : "You"}
        </span>
      </div>
      <div className="message-content">{content}</div>
    </div>
  );
};

export default ChatMessage;
