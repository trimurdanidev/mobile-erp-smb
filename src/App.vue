<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { provide } from 'vue';

const storageUrl = import.meta.env.VITE_STORAGE_URL;

provide('storageUrl', storageUrl);
</script>
