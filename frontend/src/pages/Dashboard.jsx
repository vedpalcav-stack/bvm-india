function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <Card title="Total Products" value="120" />
        <Card title="Sales Today" value="₹25,000" />
        <Card title="Stock Low" value="8 Items" />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{
      padding: "20px",
      background: "white",
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      width: "200px"
    }}>
      <h4>{title}</h4>
      <p style={{ fontSize: "20px", fontWeight: "bold" }}>{value}</p>
    </div>
  );
}

export default Dashboard;