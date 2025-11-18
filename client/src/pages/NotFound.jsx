import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "80vh",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "4rem" }}>404</h1>
      <p style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
        You've wandered into uncharted territory!
      </p>
      <Link
        to="/"
        style={{
          padding: "12px 24px",
          background: "#1e3a8a",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
        }}
      >
        Return to Safety
      </Link>
    </div>
  );
};

export default NotFound;
