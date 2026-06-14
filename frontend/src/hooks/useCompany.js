```jsx
import {
  useContext
} from "react";

import {
  CompanyContext
} from "../context/CompanyContext";

export function useCompany() {
  return useContext(
    CompanyContext
  );
}
```

