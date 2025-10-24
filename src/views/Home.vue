<template>
  <ion-page>
    <HomeHeader />
    <ion-content color="full">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div class="menu-container">
        <ion-card>
          <ion-card-content>
            <div class="menu-item">
              <ion-button
                expand="block"
                class="menu-button"
                color="primary"
                @click="goTo('in')"
                aria-label="Absen Masuk"
              >
                <span class="icon-wrapper">
                  <ion-icon :icon="logInOutline" slot="start"></ion-icon>
                </span>
              </ion-button>

              <!-- <ion-button
            expand="block"
            class="menu-button"
            color="danger"
            @click="goTo('out')"
            :disabled="disableButtonPulang"
            >
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            Absen Pulang
          </ion-button> -->
              <ion-button
                expand="block"
                class="menu-button"
                color="medium"
                @click="goTo('rekap')"
                aria-label="Rekap Absensi"
              >
                <span class="icon-wrapper">
                  <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
                </span>
              </ion-button>
            </div>
            <span class="menu-label">Absen Masuk</span>
            <span class="menu-label">Rekap Absensi</span>
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <div class="jumbotron">
                <ion-icon :icon="starOutline"></ion-icon> Rangking Absensi {{ tamBulan + " " + tahun }}
              </div>
            </ion-card-title>
            <ion-card-subtitle></ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <div class="scroll-container">
              <ion-item class="list-header">
                <ion-label>#</ion-label>
                <ion-label>Nama</ion-label>
                <ion-label>Avg Absen</ion-label>
                <ion-label>Bagian</ion-label>
              </ion-item>
              <ion-list>
                <ion-item v-for="(item, index) in dataArray" :key="index">
                  <ion-label>{{ index+1 }}</ion-label>
                  <ion-label>{{ item.namaKaryawan }} </ion-label>
                  <ion-label>{{ item.rataJamMasuk }}</ion-label>
                  <ion-label>{{ item.bagian }}</ion-label>
                </ion-item>
              </ion-list>
            </div>
          </ion-card-content>
        </ion-card>
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
  IonItem,
  IonList,
} from "@ionic/vue";
import {
  logInOutline,
  logOutOutline,
  documentTextOutline,
  starOutline,
} from "ionicons/icons";
import { onMounted, ref } from "vue";
import api from "@/services/api";
import HomeHeader from "../views/HomeHeader.vue";
import TabsPage from "../views/TabsPage.vue";
import { checkToken } from "@/services/auth";
import { showToast } from "@/services/toastHandlers";

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
    IonItem,
    IonList,
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
    const arrayRangking = ref([]);
    const dataArray = ref([]);
    const month = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const tamBulan = month[today.getMonth()];
    const tahun = today.getFullYear();

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

    const getRangking = async () => {
      try {
        const response = await api.get(
          "/showAbsTop/" + today.getFullYear() + "/" + (today.getMonth()+1)
        );

        arrayRangking.value = response.data.data;
        dataArray.value = arrayRangking.value.map((d) => ({
          no: d["No"],
          namaKaryawan: d["Nama Karyawan"],
          bagian: d["Bagian"],
          periode: d["Periode"],
          rataJamMasuk: d["Rata-Rata Jam Masuk"],
          jumlahHariMasuk: d["Jumlah Hari Masuk"],
        }));

      } catch (error) {
        console.error("Gagal Mengambil Data", error.message);
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
      getRangking();
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
      starOutline,
      userData,
      TabsPage,
      Tanggal,
      disableButtonPulang,
      disableButtonMasuk,
      RefreshData,
      IonRefresher,
      IonRefresherContent,
      handleRefresh,
      IonList,
      IonItem,
      arrayRangking,
      dataArray,
      tamBulan,
      tahun
    };
  },
};
</script>
  
  <style scoped>
.menu-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
  align-items: center;
  height: 120vh;
  background-color: darkgray;
}
.home-header {
  display: block;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
  height: 0vh;
  background-color: darkgray;
}

.menu-button {
  /* .btn-market { */
  --background: #ffffff; /* putih */
  --color: #333; /* teks gelap */
  --border-radius: 10px; /* agak kotak */
  --padding-start: 10px;
  --padding-end: 10px;
  height: 80px; /* kotak kecil */
  width: 80px;
  flex-direction: column; /* icon di atas, teks di bawah */
  justify-content: center;
  align-items: center;
  text-transform: none; /* jangan kapital semua */
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.icon-wrapper {
  display: flex-start;
  align-items: center;
  justify-content: space-between;
  color: #000000;
}

ion-card {
  display: flex-start;
  background-color: darkgray;
  margin: 0px;
  width: 100%;
  border-radius: 0;
}

.ion-card-content {
  background-color: darkgray; /* dark grey */
  background: darkgray;
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
}

.icon-wrapper ion-icon {
  font-size: 62px; /* atur ukuran icon */
}

.menu-label {
  font-size: 14px;
  font-weight: 500;
  justify-content: center;
  color: black;
  margin-left: 12px;
  margin-right: 8px;
}

.menu-item {
  margin-left: 12px;
  display: flex;
  flex-direction: row;
  padding: 0px;
  border-radius: 8px;
  gap: 25px;
}

.menu-container .jumbotron {
  font-size: 1em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 400px;
  color: #000000;
}

.scroll-container {
  max-height: 300px; /* tinggi card yang fixed */
  overflow-y: auto; /* aktifkan scroll hanya di dalam */
  padding-right: 8px; /* kasih space biar scroll bar tidak menimpa teks */
  background-color: darkgray;
}

.list-header {
  background: #333; /* warna header */
  color: #fff;
  font-weight: bold;
  border-radius: 8px 8px 0 0; /* rounded atas */
}

.list-row {
  background: #000; /* warna list item */
  color: #fff;
  margin-top: 4px;
  border-radius: 8px;
}
</style>
  