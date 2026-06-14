```jsx
import React, {
  createContext,
  useState
} from "react";

export const CompanyContext =
  createContext();

export function CompanyProvider({
  children
}) {
  const [company, setCompany] =
    useState(1);

  return (
    <CompanyContext.Provider
      value={{
        company,
        setCompany
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
```

