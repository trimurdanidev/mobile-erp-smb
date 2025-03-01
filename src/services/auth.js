import api from "./axiosInstance";
import { ref } from "vue";
const getUser = localStorage.getItem("master_user");
const userData = ref([]);

export function isAuthenticated() {
  const tokens = localStorage.getItem("access_tokens");

  return !!tokens;
}

export const logout = async () => {
  try {
    router.replace("/login");
    await showToast("Sesi Login Berakhir !", "danger");
  } catch (error) {
    console.error("Logout gagal:", error);
    await showToast("Logout Gagal", "danger");
  } finally {
    // Hapus data dari localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.clear();

    // Redirect ke halaman login
    router.replace("/login");
  }
};

// Fungsi untuk mengecek token valid atau tidak
export const checkToken = async () => {
  try {
    userData.value = JSON.parse(getUser);
    const response = await api.get("/showById/"+userData.value.id); // Contoh API untuk cek user
    return response.data;
  } catch (error) {
    console.error("Token tidak valid atau expired");
    await showToast("Sesi Login Berakhir !", "danger");
    logout(); // Jika token expired, logout otomatis
  }
};
