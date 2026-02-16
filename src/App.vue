<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp,
  IonRouterOutlet,
  alertController,
  isPlatform,
  useIonRouter,
} from "@ionic/vue";
import { provide, onMounted, ref } from "vue";
import { App as CapacitorApp } from "@capacitor/app";

const ionRouter = useIonRouter();
const isAlertOpen = ref(false);
const storageUrl = import.meta.env.VITE_STORAGE_URL;
const closeApp = async () => {
  const alert = await alertController.create({
    header: "Konfirmasi",
    message: "Apakah Anda yakin ingin keluar dari aplikasi?",
    cssClass: "custom-alert-exit", // Tambahkan ini
    buttons: [
      {
        text: "Batal",
        role: "cancel",
        cssClass: "alert-button-cancel", // Class khusus tombol batal
      },
      {
        text: "Ya, Keluar",
        cssClass: "alert-button-confirm", // Class khusus tombol keluar
        handler: async () => {
          CapacitorApp.exitApp();
        },
      },
    ],
  });
  await alert.present();
};

provide("storageUrl", storageUrl);

onMounted(() => {
  //before
  // CapacitorApp.addListener("backButton", ({ canGoBack }) => {
  //   if (!canGoBack) {
  //     closeApp();
  //   }
  // });

  //after
  CapacitorApp.addListener("backButton", () => {
    const currentPath = window.location.pathname;

    if (currentPath === "/login" || !ionRouter.canGoBack()) {
      closeApp();
    } else {
      ionRouter.back();
    }
  });
});
</script>

<style>
/* Warna Teks Pesan Alert */
.custom-alert-exit .alert-message {
  color: #1e293b !important; /* Biru gelap kehitaman */
  font-size: 15px;
}

/* Warna Header Alert */
.custom-alert-exit .alert-head h2 {
  color: #000000 !important; /* Hitam pekat */
  font-weight: 700;
}

/* Styling Tombol Batal (Abu-abu gelap tegas) */
.custom-alert-exit .alert-button-cancel {
  color: #64748b !important;
  font-weight: 600;
  text-transform: none;
}

/* Styling Tombol Keluar (Merah atau Hitam Tegas) */
.custom-alert-exit .alert-button-confirm {
  color: #e11d48 !important; /* Merah tegas agar user waspada */
  font-weight: 700;
  text-transform: none;
}

/* Opsional: Jika ingin tombol OK tetap hitam pekat */
/* .custom-alert-exit .alert-button-confirm {
  color: #000000 !important; 
  font-weight: 700;
}
*/

/* Menghilangkan background abu-abu saat tombol ditekan di Android */
.custom-alert-exit .button-native {
  --background-activated: rgba(0, 0, 0, 0.05);
}
</style>
