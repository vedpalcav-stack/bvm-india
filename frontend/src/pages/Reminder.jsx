import React, { useState } from "react";

function Reminder() {
  const [reminders] = useState([
    {
      id: 1,
      title: "Follow up with ABC Pvt Ltd",
      date: "15-06-2026",
      status: "Pending",
    },
    {
      id: 2,
      title: "Send quotation to XYZ Enterprises",
      date: "16-06-2026",
      status: "Completed",
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reminders</h1>

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
            <th style={thStyle}>Reminder</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {reminders.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.id}</td>
              <td style={tdStyle}>{item.title}</td>
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

export default Reminder;
