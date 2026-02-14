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
  // if (isPlatform("android")) {
  const alert = await alertController.create({
    header: "Konfirmasi",
    message: "Apakah Anda yakin ingin keluar dari aplikasi?",
    buttons: [
      {
        text: "Batal",
        role: "cancel",
      },
      {
        text: "Ya, Keluar",
        handler: async () => {
          CapacitorApp.exitApp();
        },
      },
    ],
  });
  await alert.present();
  // }
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
