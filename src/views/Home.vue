<template>
  <ion-page>
    <HomeHeader />
    <ion-content color="full">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div class="menu-container">
        <ion-button
          expand="block"
          class="menu-button"
          color="primary"
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
          :disabled="disableButtonPulang"
        >
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Absen Pulang
        </ion-button>

        <ion-button
          expand="block"
          class="menu-button"
          color="medium"
          @click="goTo('rekap')"
        >
          <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
          Rekap Absensi
        </ion-button>
      </div>
    </ion-content>
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
  IonRefresher,
  IonRefresherContent,
} from "@ionic/vue";
import {
  logInOutline,
  logOutOutline,
  documentTextOutline,
} from "ionicons/icons";
import { onMounted, ref } from "vue";
import api from "@/services/api";
import HomeHeader from "../views/HomeHeader.vue";
import TabsPage from "../views/TabsPage.vue";
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
  },
  setup() {
    const router = useRouter();
    const absenMasuk = ref(null);
    const userData = ref([]);
    const getUser = localStorage.getItem("master_user");
    const Tanggal = ref("");
    const today = new Date();
    const ff = ref(null);
    const disableButtonPulang = ref(true);
    const disableButtonMasuk = ref(false);
    const menu = ref(null);

    const handleRefresh = (event) => {
      setTimeout(() => {
        window.location.reload();
        event.target.complete();
      }, 1000);
    };

    Tanggal.value =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      today.getDate();

    const loadAbsensi = async () => {
      try {
        // if (getUser) {
        userData.value = JSON.parse(getUser); // Parsing JSON ke objek
        const response = api.get(
          //   "/getAbsenUser/" + userData.value.user + "/" + "2024-02-22"
          "/getAbsenUser/" + userData.value.user + "/" + Tanggal.value
        );
        const parsedAbsenMasuk = (await response).data;
        absenMasuk.value = JSON.stringify(parsedAbsenMasuk.data);
        ff.value = JSON.parse(absenMasuk.value);
      } catch (error) {
        console.error("Gagal memuat data absensi:", error);
      }
    };

    const RefreshData = async (event) => {
      console.log("Memuat ulang data...");

      // Simulasi load data baru
      setTimeout(() => {
        window.location.reload();
        console.log("Data diperbarui!");
        event.target.complete(); // Hentikan loading
      }, 2000);
    };

    const goTo = (menu) => {
      if (loadAbsensi) {
        RefreshData();
        router.replace(`/${menu}`);
      } else {
        router.replace(`/${menu}`);
      }
    };

    const refreshPage = () => {
      router.go(0); // Efek sama dengan reload, tapi hanya refresh route
    };

    onMounted(() => {
      //   getHariTanggal();
      loadAbsensi();
      checkToken();
      // refreshPage();

      if (ff.value) {
        disableButtonMasuk.value = true;

        // disableButtonPulang.value = false;
        // } else {
      }
    });

    return {
      goTo,
      logInOutline,
      logOutOutline,
      documentTextOutline,
      userData,
      TabsPage,
      Tanggal,
      disableButtonPulang,
      disableButtonMasuk,
      RefreshData,
      IonRefresher,
      IonRefresherContent,
      handleRefresh,
    };
  },
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
  display: block;
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
  