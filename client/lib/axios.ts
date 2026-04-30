import axios from "axios";

// 🔧 Get correct base URL (local + production safe)
const getBaseURL = () => {
  const isLocal = window.location.hostname === "localhost";

  if (isLocal) {
    return "http://localhost:8000/api";
  }

  return "https://legaldocs-ai.onrender.com/api"; // 🔥 ADD /api HERE
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// 🔐 Attach token to every request
api.interceptors.request.use(
  (config) => {
    // 🔥 IMPORTANT: check BOTH storages
    const token =
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Handle global errors (especially auth)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("🔒 Unauthorized - clearing session");

      // 🔥 Clear ONLY auth-related keys (not full storage)
      localStorage.removeItem("token");
      localStorage.removeItem("user_data");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user_data");

      // Optional: redirect to login (uncomment if needed)
      // window.location.href = "/signin";
    }

    return Promise.reject(error);
  }
);

export default api;