import axios from "axios";
import router from "@/router"; // Import Vue Router

// Buat instance Axios dengan base URL dari environment
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tambahkan Interceptor untuk menangkap error response
api.interceptors.response.use(
  (response) => response, // Jika response sukses, langsung dikembalikan
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expired! Redirecting to login...");
      
      // Hapus token dari localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect ke halaman login
      router.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
