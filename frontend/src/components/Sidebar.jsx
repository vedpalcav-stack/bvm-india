import React from "react";

function Sidebar({
  currentPage,
  setCurrentPage
}) {
  const menus = [
    "Dashboard",
    "Customers",
    "Products",
    "Inventory",
    "Quotations",
    "Proforma",
    "Purchase Orders",
    "Sales Orders",
    "Invoices",
    "Dispatch",
    "Payments",
    "Reminders",
    "Reports",
    "Settings"
  ];

  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        background: "#1e293b",
        color: "#ffffff",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <h2
        style={{
          marginBottom: "30px",
          textAlign: "center"
        }}
      >
        BVM ERP
      </h2>

      {menus.map((menu) => (
        <button
          key={menu}
          onClick={() =>
            setCurrentPage(menu)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            textAlign: "left",
            background:
              currentPage === menu
                ? "#2563eb"
                : "#334155",
            color: "#fff",
            fontSize: "14px"
          }}
        >
          {menu}
        </button>
      ))}
    </div>
  );
}

export default Sidebar;
