// src/components/ui/InfoModal.jsx
import React from "react";
import "./modal.css"; // reuse the CSS you made earlier

export default function InfoModal({ open, onClose, title , children }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{title}</h2>
        <div style={{ marginTop: 12 }}>{children}</div>

        <button className="close-btn"
  onClick={() => {
    console.log("CLOSE CLICKED");
    onClose();
  }}
>
  Close
</button>

      </div>
    </div>
  );
}
