import React from "react";

function Header() {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "20px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <h2 style={{ margin: 0 }}>
        BVM ERP System
      </h2>

      <div>
        Welcome, Admin
      </div>
    </div>
  );
}

export default Header;
