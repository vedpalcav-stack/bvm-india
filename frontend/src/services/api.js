const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export async function apiRequest(
  endpoint,
  method = "GET",
  data = null
) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    options
  );

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}

export const api = {
  get: (endpoint) =>
    apiRequest(endpoint),

  post: (endpoint, data) =>
    apiRequest(endpoint, "POST", data),

  put: (endpoint, data) =>
    apiRequest(endpoint, "PUT", data),

  delete: (endpoint) =>
    apiRequest(endpoint, "DELETE"),
};
