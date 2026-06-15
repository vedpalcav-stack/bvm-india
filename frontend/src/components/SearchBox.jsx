import React from "react";

function SearchBox({ value, onChange, placeholder = "Search..." }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "300px",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        marginBottom: "20px",
      }}
    />
  );
}

export default SearchBox;

