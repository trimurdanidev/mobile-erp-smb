<template>
  <ion-page>
    <!-- Header -->

    <!-- Konten Profil -->
    <ion-content color="full">
      <div class="content-container">
        <ion-header>
          <ion-toolbar>
            <ion-title>Profil Pengguna</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-refresher slot="fixed" @ionRefresh="refreshData">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <ion-card v-if="user">
          <ion-card-header>
            <ion-card-title class="ion-text-center"
              >Halo, {{ geterUser.data.user }} 👋</ion-card-title
            >
          </ion-card-header>

          <ion-card-content class="ion-text-center">
            <ion-avatar>
              <img
                v-if="geterUser.data.profile_image"
                :src="geterUser.data.profile_image"
                alt="Foto Profil"
              />
              <img
                v-else
                src="https://via.placeholder.com/150"
                alt="Default Avatar"
              />
            </ion-avatar>

            <p><strong>Email:</strong> {{ geterUser.data.email }}</p>
            <p>
              <strong>Nomor HP:</strong> {{ geterUser.data.phone || "Belum tersedia" }}
            </p>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" color="danger" @click="logout">
          Logout
        </ion-button>
        <ion-alert
          :is-open="isAlertOpen"
          header="Konfirmasi Logout"
          message="Apakah Anda yakin ingin logout?"
          :buttons="alertButtons"
          @didDismiss="isAlertOpen = false"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAvatar,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/vue";

const user = ref(null);
const router = useRouter();
const userData = ref(null);
const getUser = localStorage.getItem("master_user");
const parsedUser = ref(null);
const geterUser = ref(null);

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("access_token"); // Ambil token dari localStorage
    if (!token) {
      console.warn("⚠️ Token tidak ditemukan! Mengarahkan ke login...");
      router.push("/login");
      return;
    }

    userData.value = JSON.parse(getUser);
    const response = api.get("showByUser/" + userData.value.user, {
      headers: { Authorization: `Bearer ${token}` },
    });

    user.value = (await response).data; // Pastikan struktur API benar
    parsedUser.value = JSON.stringify(user.value)
    geterUser.value = JSON.parse(parsedUser.value)
    showToast("✅ Data pengguna:" + geterUser.value.data.user, "success");
  } catch (error) {
    console.error(
      "❌ Gagal mengambil data pengguna:",
      error.response?.data || error
    );
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expired! Mengarahkan ke login...");
      logout();
    }
  }
};
const isAlertOpen = ref(false);

const logout = async () => {
  try {
    // Hapus token & data user dari localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("master_user");
    localStorage.clear();

    // Redirect ke halaman login
    await showToast("Logout Berhasil. Sampai Bertemu Lagi!", "primary");
    router.replace("/login");
  } catch (error) {
    console.error("Logout gagal:", error);
    await showToast("Terjadi Kesalahan Sistem", "danger");
  }
};

const showLogoutConfirm = () => {
  isAlertOpen.value = true;
};

// Tombol di dalam dialog
const alertButtons = [
  {
    text: "Batal",
    role: "cancel",
  },
  {
    text: "Logout",
    handler: async () => {
      await logout(); // Panggil fungsi logout jika user menekan "Logout"
    },
  },
];

// ** Refresh Data Saat Ditarik ke Bawah **
const refreshData = async (event) => {
  await fetchUserProfile();
  event.target.complete(); // Hentikan efek refresh
};

// Panggil fetchUserProfile saat halaman dimuat
onMounted(fetchUserProfile);
</script>

<style scoped>
.content-container {
  display: block;
  gap: 0px;
  justify-content: center;
  align-items: center;
  height: 90vh;
  background-color: darkgray;
}
</style>
