// src/components/Badge.jsx
import React from "react";

function Badge({ text, color = "#2563eb" }) {
  return (
    <span
      style={{
        backgroundColor: color,
        color: "#fff",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        display: "inline-block",
      }}
    >
      {text}
    </span>
  );
}

export default Badge;
