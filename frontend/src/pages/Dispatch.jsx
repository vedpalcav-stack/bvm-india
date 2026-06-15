import React from "react";

function Dispatch() {
  const dispatches = [
    {
      id: 1,
      orderNo: "ORD-001",
      customer: "ABC Pvt Ltd",
      date: "15-06-2026",
      status: "Dispatched",
    },
    {
      id: 2,
      orderNo: "ORD-002",
      customer: "XYZ Enterprises",
      date: "16-06-2026",
      status: "Pending",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dispatch</h1>

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
            <th style={thStyle}>Order No.</th>
            <th style={thStyle}>Customer</th>
            <th style={thStyle}>Dispatch Date</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {dispatches.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.id}</td>
              <td style={tdStyle}>{item.orderNo}</td>
              <td style={tdStyle}>{item.customer}</td>
              <td style={tdStyle}>{item.date}</td>
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

export default Dispatch;
