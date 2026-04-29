import axios from "axios";

// 🔧 Get correct base URL (local + production safe)
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (!envUrl) {
    // fallback for local dev proxy (vite)
    return "/api";
  }

  // ensure no double slashes and always ends with /api
  const cleanUrl = envUrl.replace(/\/+$/, "");
  return `${cleanUrl}/api`;
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