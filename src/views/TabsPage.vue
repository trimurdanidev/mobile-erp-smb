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

        <ion-tab-button tab="logout" @click="logout">
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
  </ion-page>
</template>

<script setup lang="ts">
import logout from '../views/Home.vue';
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
// export default {
// components: {
//     logout,
//   },
// }
</script>
