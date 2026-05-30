import React from "react";

export default function Layout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "#f5f7fa",
      }}
    >
      <header
        style={{
          background: "#1976d2",
          color: "#fff",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>BVM ERP</h2>
      </header>

      <main>{children}</main>
    </div>
  );
}
