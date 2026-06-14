import React, {
  useState
} from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

function App() {
  const [currentPage,
    setCurrentPage] =
    useState("Dashboard");

  return (
    <div
      style={{
        display: "flex"
      }}
    >
      <Sidebar
        currentPage={
          currentPage
        }
        setCurrentPage={
          setCurrentPage
        }
      />

      <div
        style={{
          flex: 1
        }}
      >
        <Header />

        <div
          style={{
            padding: "30px"
          }}
        >
          <h1>
            {currentPage}
          </h1>

          <p>
            Welcome to
            {" "}
            {currentPage}
            {" "}
            Module
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
