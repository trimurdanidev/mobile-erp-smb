<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/home">
          <ion-icon aria-hidden="true" :icon="homeSharp" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/profile">
          <ion-icon aria-hidden="true" :icon="personSharp" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="logout" @click="showLogoutConfirm">
          <ion-icon aria-hidden="true" :icon="logOutSharp" />
          <ion-label>Logout</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
    <!-- <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
      <ion-refresher-content
        pullingIcon="chevron-down-circle-outline"
        pullingText="Pull to refresh"
        refreshingSpinner="circles"
        refreshingText="Refreshing..."
      >
      </ion-refresher-content>
    </ion-refresher> -->
    <ion-alert
      :is-open="isAlertOpen"
      header="Konfirmasi Logout"
      message="Apakah Anda yakin ingin logout?"
      :buttons="alertButtons"
      @didDismiss="isAlertOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
// import logout from "../views/Home.vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  IonAlert
} from "@ionic/vue";
import {
  ellipse,
  square,
  triangle,
  homeSharp,
  personSharp,
  logOutSharp,
  logOut,
} from "ionicons/icons";
import router from "@/router";
import { ref, onMounted } from "vue";

const isAlertOpen = ref(false);
const getUser = localStorage.getItem("master_user");

const logout = async () => {
  try {
    
    // Redirect ke halaman login
    router.replace("/login");
    await showToast('Logout Berhasil. Sampai Bertemu Lagi!','primary');
    // Hapus token & data user dari localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("master_user");
    localStorage.clear();
  } catch (error) {
    console.error("Logout gagal:", error);
    await showToast("Terjadi Kesalahan Sistem", "danger");
  }
};

const showLogoutConfirm = () => {
  isAlertOpen.value = true;
};

// Tombol di dalam dialog
const alertButtons = ref([
  {
    text: "Batal",
    role: "cancel",
  },
  {
    text: "Logout",
    handler: async () => {
      logout(); // Panggil fungsi logout jika user menekan "Logout"
    },
  },
]);
// export default {
// components: {
//     logout,
//   },
// }
</script>
