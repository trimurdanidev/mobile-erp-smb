<template>
  <div class="home-header">
    <ion-card class="absen-card">
      <ion-card-header>
        
        <ion-card-title><h2>{{showuser}}</h2>Welcome To ERP SMB</ion-card-title>
        <ion-card-subtitle
          >{{ hariIni }}, {{ tanggalHariIni }}</ion-card-subtitle
        >
      </ion-card-header>
      <ion-card-content>
        <p v-if="seterAbsenmasuk">
          ✅ Anda telah absen masuk pukul {{ absenMasuk }}.
        </p>
        <p v-else>❌ Anda belum absen masuk.</p>
      </ion-card-content>
    </ion-card>
  </div>
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
  IonRefresherContent
} from "@ionic/vue";
import {
  logInOutline,
  logOutOutline,
  documentTextOutline,
} from "ionicons/icons";
import { onMounted, ref } from "vue";
import api from "@/services/api";
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
    IonRefresher,
    IonRefresherContent
  },
  setup() {
    const router = useRouter();

    const hariIni = ref(""); // Simpan nama hari
    const tanggalHariIni = ref(""); // Simpan tanggal
    const absenMasuk = ref(null); // Simpan jam absen masuk
    const Tanggal = ref("");
    const getUser = localStorage.getItem("master_user");
    const showuser = ref(null);
    const timeIn = ref(null);
    const timeOut = ref(null);
    const seterAbsenmasuk = ref(null);
    const dd = ref(null);

    // Fungsi untuk mendapatkan hari dan tanggal
    const getHariTanggal = () => {
      const hariList = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
      ];
      const today = new Date();
      Tanggal.value =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        today.getDate();
      hariIni.value = hariList[today.getDay()];
      tanggalHariIni.value = today.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };
    const userData = ref([]);

    const loadAbsensi = async () => {
      try {
        // if (getUser) {
        userData.value = JSON.parse(getUser); 
        const response = api.get(
          // "/getAbsenUser/" + userData.value.user + "/" + "2024-02-22"
          "/getAbsenUser/" + userData.value.user + "/" + Tanggal.value
        );
        const parsedAbsenMasuk = (await response).data;
        seterAbsenmasuk.value = JSON.stringify(parsedAbsenMasuk.data);
        dd.value  = JSON.parse(seterAbsenmasuk.value);
        absenMasuk.value  = dd.value.time_in;

        // await showToast(absenMasuk.value, "success");
      } catch (error) {
        console.error("Gagal memuat data absensi:", error);
      }
    };

    const handleRefresh = async (event) => {
      await loadAbsensi(); // Memuat data baru
      event.target.complete(); // Menghentikan refresher
    };

    onMounted(() => {
      getHariTanggal();
      loadAbsensi();
      const parseUser = JSON.parse(getUser);
      showuser.value = parseUser.description;
      // await showToast(parseUser.description,'success');
    });

    return {
      hariIni,
      tanggalHariIni,
      logInOutline,
      logOutOutline,
      documentTextOutline,
      handleRefresh,
      Tanggal,
      userData,
      getUser,
      showuser,
      timeIn,
      timeOut,
      seterAbsenmasuk,
      dd,
      absenMasuk,
    };


  },
};

</script>

<style scoped>
.home-header {
  position: fixed; /* Tetap di atas */
  top: 0;
  width: 100%;
  z-index: 1000; /* Agar di atas elemen lain */
}

.absen-card {
  margin: 0px 0px 50px 0px; /* Margin kanan dan kiri tidak terlalu kecil */
  padding: 20px;
  border-radius: 0px 0px 60px 60px; /* Membuat sudut card tidak terlalu lancip */
  box-shadow: 3px 4px 8px rgba(0, 0, 0, 0.1); /* Efek bayangan lembut */
  background-color: #2a3594; /* Warna latar belakang */
  text-align: left;
}
</style>