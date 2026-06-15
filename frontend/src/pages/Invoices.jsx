import React, { useState } from "react";

function Invoices() {
  const [invoices] = useState([
    {
      id: 1,
      invoiceNo: "INV-001",
      customer: "ABC Pvt Ltd",
      date: "15-06-2026",
      amount: 50000,
      status: "Paid",
    },
    {
      id: 2,
      invoiceNo: "INV-002",
      customer: "XYZ Enterprises",
      date: "16-06-2026",
      amount: 25000,
      status: "Pending",
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Invoices</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Invoice No.</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td style={tdStyle}>{invoice.invoiceNo}</td>
              <td style={tdStyle}>{invoice.customer}</td>
              <td style={tdStyle}>{invoice.date}</td>
              <td style={tdStyle}>₹{invoice.amount}</td>
              <td style={tdStyle}>{invoice.status}</td>
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

export default Invoices;
