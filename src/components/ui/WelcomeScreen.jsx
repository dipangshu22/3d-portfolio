import { useState } from "react";
import "./welcome.css";

export default function WelcomeScreen({ onEnter }) {
  const [closing, setClosing] = useState(false);

 const handleClick = () => {
  setClosing(true);

  setTimeout(() => {
    onEnter(true);  // <-- VERY IMPORTANT
  }, 800);
};



  return (
    <div className={`welcome-screen ${closing ? "fade-out" : ""}`}>
      <div className="welcome-content">
        <h1 className="welcome-title">
          Welcome to My Portfolio
        </h1>

        <p className="welcome-sub">
          I am <span className="highlight">Dipangshu</span> — Web Developer
        </p>

        <button className="enter-btn" onClick={handleClick}>
          Enter Portfolio →
        </button>

        <div className="particle-layer"></div>
      </div>
    </div>
  );
}
