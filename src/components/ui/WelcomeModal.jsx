import "./welcomeModal.css";

export default function WelcomeModal({ onEnter }) {
  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal">
        <h2>Welcome to My Portfolio</h2>
        <p>I am <strong>Dipangshu</strong> — Web Developer</p>

        <button className="welcome-btn" onClick={onEnter}>
          Enter Portfolio →
        </button>
      </div>
    </div>
  );
}
