import React, { useState } from "react";

function Customers() {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "ABC Pvt Ltd",
      contact: "9876543210",
      email: "abc@example.com",
      city: "Delhi",
    },
    {
      id: 2,
      name: "XYZ Enterprises",
      contact: "9876501234",
      email: "xyz@example.com",
      city: "Mumbai",
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Customers</h2>

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
            <th style={thStyle}>Customer Name</th>
            <th style={thStyle}>Contact</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>City</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td style={tdStyle}>{customer.id}</td>
              <td style={tdStyle}>{customer.name}</td>
              <td style={tdStyle}>{customer.contact}</td>
              <td style={tdStyle}>{customer.email}</td>
              <td style={tdStyle}>{customer.city}</td>
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
  background: "#f4f4f4",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "10px",
};

export default Customers;
