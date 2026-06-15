import React, { useState } from "react";

function SalesOrder() {
  const [salesOrders] = useState([
    {
      id: 1,
      soNo: "SO-001",
      customer: "ABC Pvt Ltd",
      date: "15-06-2026",
      amount: 50000,
      status: "Pending",
    },
    {
      id: 2,
      soNo: "SO-002",
      customer: "XYZ Enterprises",
      date: "16-06-2026",
      amount: 25000,
      status: "Approved",
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sales Orders</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>SO No.</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {salesOrders.map((order) => (
            <tr key={order.id}>
              <td style={tdStyle}>{order.soNo}</td>
              <td style={tdStyle}>{order.customer}</td>
              <td style={tdStyle}>{order.date}</td>
              <td style={tdStyle}>₹{order.amount}</td>
              <td style={tdStyle}>{order.status}</td>
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

export default SalesOrder;
