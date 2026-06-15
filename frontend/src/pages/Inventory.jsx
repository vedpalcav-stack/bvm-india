import React, { useState } from "react";

function Inventory() {
  const [inventory] = useState([
    {
      id: 1,
      product: "Dell Laptop",
      make: "Dell",
      model: "Latitude 5440",
      quantity: 10,
      unitRate: 50000,
    },
    {
      id: 2,
      product: "HP Printer",
      make: "HP",
      model: "LaserJet Pro",
      quantity: 5,
      unitRate: 12000,
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Inventory</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Make</th>
            <th style={thStyle}>Model</th>
            <th style={thStyle}>Quantity</th>
            <th style={thStyle}>Unit Rate</th>
            <th style={thStyle}>Total Amount</th>
          </tr>
        </thead>

        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.id}</td>
              <td style={tdStyle}>{item.product}</td>
              <td style={tdStyle}>{item.make}</td>
              <td style={tdStyle}>{item.model}</td>
              <td style={tdStyle}>{item.quantity}</td>
              <td style={tdStyle}>₹{item.unitRate}</td>
              <td style={tdStyle}>
                ₹{item.quantity * item.unitRate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  backgroundColor: "#f4f4f4",
  textAlign: "left",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "10px",
};

export default Inventory;
