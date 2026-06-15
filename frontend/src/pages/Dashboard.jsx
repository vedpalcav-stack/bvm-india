import React from "react";

function Dashboard() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <div style={cardStyle}>
          <h3>Total Customers</h3>
          <h2>120</h2>
        </div>

        <div style={cardStyle}>
          <h3>Total Products</h3>
          <h2>350</h2>
        </div>

        <div style={cardStyle}>
          <h3>Total Quotations</h3>
          <h2>45</h2>
        </div>

        <div style={cardStyle}>
          <h3>Total Orders</h3>
          <h2>28</h2>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "20px",
  width: "220px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

export default Dashboard;
