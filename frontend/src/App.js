import React, { useState } from "react"; 

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Quotation from "./pages/Quotation";
import PurchaseOrder from "./pages/PurchaseOrder";
import SalesOrder from "./pages/SalesOrder";
import Invoices from "./pages/Invoices";
import Dispatch from "./pages/Dispatch";
import Performa from "./pages/Performa";
import Reminder from "./pages/Reminder";

function App() {
  const [currentPage, setCurrentPage] =
    useState("Dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard />;

      case "Customers":
        return <Customers />;

      case "Products":
        return <Products />;

      case "Inventory":
        return <Inventory />;

      case "Quotation":
        return <Quotation />;

      case "PurchaseOrder":
        return <PurchaseOrder />;

      case "SalesOrder":
        return <SalesOrder />;

      case "Invoices":
        return <Invoices />;

      case "Dispatch":
        return <Dispatch />;

      case "Performa":
        return <Performa />;

      case "Reminder":
        return <Reminder />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div
        style={{
          flex: 1,
          backgroundColor: "#f5f5f5",
        }}
      >
        <Header />

        <div
          style={{
            padding: "30px",
          }}
        >
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
