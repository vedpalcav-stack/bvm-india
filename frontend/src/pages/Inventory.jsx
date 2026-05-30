import { useEffect, useState } from "react";

function Inventory() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // dummy data (replace with API later)
    setProducts([
      { name: "Laptop", stock: 10, price: 50000 },
      { name: "Mouse", stock: 50, price: 500 }
    ]);
  }, []);

  return (
    <div>
      <h1>Inventory</h1>

      <table border="1" cellPadding="10" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Stock</th>
            <th>Price</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p, i) => (
            <tr key={i}>
              <td>{p.name}</td>
              <td>{p.stock}</td>
              <td>₹{p.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Inventory;