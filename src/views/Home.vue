<template>
  <ion-page>
    <HomeHeader />
    <ion-content class="ion-padding" :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="menu-container">
        <ion-button
          expand="block"
          class="menu-button"
          @click="goTo('in')"
        >
          <ion-icon :icon="logInOutline" slot="start"></ion-icon>
          Absen Masuk
        </ion-button>

        <ion-button
          expand="block"
          class="menu-button"
          color="danger"
          @click="goTo('out')"
        >
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Absen Pulang
        </ion-button>

        <ion-button
          expand="block"
          class="menu-button"
          color="medium"
          @click="goTo('rekap-absen')"
        >
          <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
          Rekap Absensi
        </ion-button>
      </div>
    </ion-content>
    <TabsPage />
  </ion-page>
</template>
  
  <script>
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
} from "@ionic/vue";
import {
  logInOutline,
  logOutOutline,
  documentTextOutline,
} from "ionicons/icons";
import { onMounted, ref } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import HomeHeader from "../views/HomeHeader.vue";
import TabsPage from "../views/TabsPage.vue";
import handleRefresh from "../views/HomeHeader.vue";
import { checkToken } from "@/services/auth";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    HomeHeader,
    TabsPage,
    handleRefresh,
  },
  setup() {
    const router = useRouter();
    const absenMasuk = ref(null);
    const userData = ref([]);

    const goTo = (menu) => {
      router.push(`/${menu}`);
    };

    const loadAbsensi = async () => {
      try {
        // if (getUser) {
        userData.value = JSON.parse(getUser); // Parsing JSON ke objek
        const response = api.get(
        //   "/getAbsenUser/" + userData.value.user + "/" + "2024-02-22"
          "/getAbsenUser/" + userData.value.user + "/" + Tanggal.value
        );
        absenMasuk.value = JSON.stringify(response.data);
        // }
      } catch (error) {
        console.error("Gagal memuat data absensi:", error);
        showToast(error.message ,'danger');
      }
    };

 

    const handleRefresh = async (event) => {
      await loadAbsensi(); // Memuat data baru
      event.target.complete(); // Menghentikan refresher
    };

    onMounted(() => {
    //   getHariTanggal();
    //   loadAbsensi();
    checkToken();
    });

    return {
      goTo,
      logInOutline,
      logOutOutline,
      documentTextOutline,
      userData,
      handleRefresh,
      TabsPage,
    };
  }
};
</script>
  
  <style scoped>
.menu-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: darkgray;
}
.home-header {
  display: blofck;
  flex-direction: column;
  gap: 0px;
  justify-content: center;
  align-items: center;
  height: 0vh;
  background-color: darkgray;
}

.menu-button {
  width: 90%;
  height: 55px;
  font-size: 18px;
  border-radius: 0px; /* Membuat ujung tombol tidak terlalu lancip */
  /* --box-shadow: 0px 4px 6px rgba(148, 148, 148, 0.1); */
}
</style>
  