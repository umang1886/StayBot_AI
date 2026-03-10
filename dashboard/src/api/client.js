import axios from "axios";

/**
 * Axios client with base URL from env.
 * JWT headers are set by AuthContext on login.
 * 401 responses are handled globally to avoid stale auth.
 */
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Response interceptor – surface structured API errors consistently
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred.";
    return Promise.reject(new Error(message));
  }
);
