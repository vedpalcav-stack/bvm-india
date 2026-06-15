import React, { useState } from "react";

function Products() {
  const [products] = useState([
    {
      id: 1,
      name: "Dell Laptop",
      make: "Dell",
      model: "Latitude 5440",
      price: 50000,
      stock: 10,
    },
    {
      id: 2,
      name: "HP Printer",
      make: "HP",
      model: "LaserJet Pro",
      price: 12000,
      stock: 5,
    },
  ]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Products</h1>

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
            <th style={thStyle}>Price</th>
            <th style={thStyle}>Stock</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td style={tdStyle}>{product.id}</td>
              <td style={tdStyle}>{product.name}</td>
              <td style={tdStyle}>{product.make}</td>
              <td style={tdStyle}>{product.model}</td>
              <td style={tdStyle}>₹{product.price}</td>
              <td style={tdStyle}>{product.stock}</td>
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

export default Products;
