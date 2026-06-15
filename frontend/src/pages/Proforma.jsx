import React, { useState } from "react";

function Performa() {
  const [performas] = useState([
    {
      id: 1,
      piNo: "PI-001",
      customer: "ABC Pvt Ltd",
      date: "15-06-2026",
      amount: 50000,
      status: "Pending",
    },
    {
      id: 2,
      piNo: "PI-002",
      customer: "XYZ Enterprises",
      date: "16-06-2026",
      amount: 25000,
      status: "Approved",
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Proforma Invoices</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>PI No.</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {performas.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.piNo}</td>
              <td style={tdStyle}>{item.customer}</td>
              <td style={tdStyle}>{item.date}</td>
              <td style={tdStyle}>₹{item.amount}</td>
              <td style={tdStyle}>{item.status}</td>
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

export default Performa;
