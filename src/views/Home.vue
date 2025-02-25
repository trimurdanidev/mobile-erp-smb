<template>
  <ion-page>
    <HomeHeader />
    <ion-content class="ion-padding" :fullscreen="true">
      <div class="menu-container">
        <ion-button
          expand="block"
          class="menu-button"
          @click="goTo('in')"
          :disabled="disableButtonMasuk"
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
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>
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
    IonRefresher,
    IonRefresherContent,
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

    Tanggal.value =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      today.getDate();

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
        const parsedAbsenMasuk = (await response).data;
        absenMasuk.value = JSON.stringify(parsedAbsenMasuk.data);
        ff.value = JSON.parse(absenMasuk.value);
        // showToast(ff.user,'success');
      } catch (error) {
        console.error("Gagal memuat data absensi:", error);
        // showToast(error.response.data.message, "danger");
        // disableButtonPulang.value = true;
      }
    };

    const handleRefresh = async (event) => {
      console.log("Memuat ulang data...");

      // Simulasi load data baru
      setTimeout(() => {
        loadAbsensi();
        console.log("Data diperbarui!");
        event.target.complete(); // Hentikan loading
      }, 2000);
    };

    onMounted(() => {
      //   getHariTanggal();
      loadAbsensi();
      checkToken();
      handleRefresh();

      if (!ff.value) {
        disableButtonPulang.value = false;
      } else {
        disableButtonMasuk.value = true;
      }
    });

    return {
      goTo,
      logInOutline,
      logOutOutline,
      documentTextOutline,
      userData,
      handleRefresh,
      TabsPage,
      Tanggal,
      disableButtonPulang,
      disableButtonMasuk,
      // IonRefresher
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
  