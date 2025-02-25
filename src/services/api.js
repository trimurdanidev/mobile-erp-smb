import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // Mengambil BASE_URL dari .env
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("❌ Token expired atau tidak valid!");

      // Hapus token dari localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("master_user");
      localStorage.clear();

      // Redirect ke halaman login
      router.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
