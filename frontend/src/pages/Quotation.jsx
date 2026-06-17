import React, { useState } from "react";

function Quotation() {
  const [quotations] = useState([
    {
      id: 1,
      quotationNo: "QT-001",
      customer: "ABC Pvt Ltd",
      date: "15-06-2026",
      amount: 50000,
      status: "Pending",
    },
    {
      id: 2,
      quotationNo: "QT-002",
      customer: "XYZ Enterprises",
      date: "16-06-2026",
      amount: 25000,
      status: "Approved",
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Quotations</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Quotation No.</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {quotations.map((quotation) => (
            <tr key={quotation.id}>
              <td style={tdStyle}>{quotation.quotationNo}</td>
              <td style={tdStyle}>{quotation.customer}</td>
              <td style={tdStyle}>{quotation.date}</td>
              <td style={tdStyle}>₹{quotation.amount}</td>
              <td style={tdStyle}>{quotation.status}</td>
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

export default Quotation;
