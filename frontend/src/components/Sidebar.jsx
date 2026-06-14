import React from "react";

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
  "Reminders"
];

function Sidebar({
  currentPage,
  setCurrentPage
}) {
  return (
    <div
      style={{
        width: "250px",
        minHeight: "100vh",
        background: "#1e293b",
        color: "#ffffff",
        padding: "20px"
      }}
    >
      <h2>BVM ERP</h2>

      {menus.map((menu) => (
        <div
          key={menu}
          onClick={() =>
            setCurrentPage(menu)
          }
          style={{
            padding: "12px",
            marginTop: "10px",
            cursor: "pointer",
            borderRadius: "8px",
            background:
              currentPage === menu
                ? "#2563eb"
                : "transparent"
          }}
        >
          {menu}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;
