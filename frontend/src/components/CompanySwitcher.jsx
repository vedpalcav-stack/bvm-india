```jsx
import React from "react";
import { useCompany } from "../hooks/useCompany";

function CompanySwitcher() {
  const { company, setCompany } = useCompany();

  const handleChange = (e) => {
    setCompany(Number(e.target.value));
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}
    >
      <label style={{ fontWeight: 600 }}>
        Company:
      </label>

      <select
        value={company}
        onChange={handleChange}
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          background: "#fff"
        }}
      >
        <option value={1}>
          BVM INDIA
        </option>

        <option value={2}>
          BVM WORLD PVT. LTD.
        </option>
      </select>
    </div>
  );
}

export default CompanySwitcher;
```

