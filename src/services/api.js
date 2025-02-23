import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // Mengambil BASE_URL dari .env
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
