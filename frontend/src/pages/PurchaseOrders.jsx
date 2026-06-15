import React, { useState } from "react";

function PurchaseOrder() {
  const [purchaseOrders] = useState([
    {
      id: 1,
      poNo: "PO-001",
      supplier: "Dell India",
      date: "15-06-2026",
      amount: 150000,
      status: "Pending",
    },
    {
      id: 2,
      poNo: "PO-002",
      supplier: "HP India",
      date: "16-06-2026",
      amount: 85000,
      status: "Approved",
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Purchase Orders</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>PO No.</th>
            <th style={thStyle}>Supplier</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {purchaseOrders.map((po) => (
            <tr key={po.id}>
              <td style={tdStyle}>{po.poNo}</td>
              <td style={tdStyle}>{po.supplier}</td>
              <td style={tdStyle}>{po.date}</td>
              <td style={tdStyle}>₹{po.amount}</td>
              <td style={tdStyle}>{po.status}</td>
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

export default PurchaseOrder;
