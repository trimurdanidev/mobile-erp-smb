<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="content-container">
        <ion-header>
          <ion-toolbar>
            <ion-title>Rekap Absensi</ion-title>
          </ion-toolbar>
        </ion-header>
        <!-- Input Tanggal -->
        <!-- <ion-item>
          <ion-label position="stacked"
            ><span style="color: black">Dari Tanggal</span></ion-label
          >
          <ion-input
            type="date"
            v-model="startDate"
            style="color: black"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked"
            ><span style="color: black">Sampai Tanggal</span></ion-label
          >
          <ion-input
            type="date"
            v-model="endDate"
            style="color: black"
          ></ion-input>
        </ion-item> -->
        <br />
        <ion-button expand="full" @click="loadAbsensi">Refresh</ion-button>
        <ion-list>
          <ion-item v-for="(absen, index) in absensi.data" :key="index">
            <ion-label>
              <h2 style="color: blue">
                {{ absen.username }} - {{ absen.department }}
              </h2>
              <p><strong>Tanggal:</strong> {{ absen.date }}</p>
              <p><strong>Jam Masuk:</strong> {{ absen.time_in }}</p>
              <!-- <p v-if="absen.time_out">
                <strong>Jam Keluar:</strong> {{ absen.time_out }}
              </p>
              <p v-else style="color: red">
                <strong>Belum absen keluar</strong>
              </p> -->
            </ion-label>
            <ion-img
              v-if="absen.images_in"
              :src="storageUrl + absen.images_in"
              alt="Foto Absensi"
            >
            </ion-img>
          </ion-item>
        </ion-list>
      </div>
      <ion-refresher slot="fixed" @ionRefresh="refreshData">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <ion-infinite-scroll @ionInfinite="loadMoreData">
        <ion-infinite-scroll-content
          loading-spinner="bubbles"
          loading-text="Memuat data..."
        >
        </ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>
  
  <script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonImg,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonDatetime,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import { inject } from "vue";

const absensi = ref([]);
const rekap = ref(null);
const getUser = localStorage.getItem("master_user");
const userData = ref([]);
const page = ref(1);
const hasMoreData = ref(true);
const storageUrl = inject('storageUrl');

const loadAbsensi = async () => {
  //   if (!startDate.value || !endDate.value) {
  //     showToast(startDate.value, "secondary");
  //     return;
  //   }

  try {
    userData.value = JSON.parse(getUser);
    const response = api.get("/RekapAllAbs/" + userData.value.user);
    absensi.value = (await response).data;

    if (absensi.length > 0) {
      absensi.value.push(...absensi); // Tambahkan data baru ke array
      page.value++; // Naikkan halaman
    } else {
      hasMoreData.value = false; // Tidak ada data lagi
    }

    showToast(absensi.value.message, "success");
  } catch (error) {
    console.error("Gagal mengambil data absensi:", error);
  }
};

const refreshData = async (event) => {
  absensi.value = [];
  page.value = 1;
  hasMoreData.value = true;
  await loadAbsensi();
  event.target.complete(); // Hentikan efek refresh
};

const loadMoreData = async (event) => {
  if (!hasMoreData.value) {
    event.target.complete();
    return;
  }
  
  await loadAbsensi();
  event.target.complete();
};


onMounted(() => {
  loadAbsensi();
  //   simpanTanggal();
});
</script>
  
  <style scoped>
ion-item {
  --background: #f9f9f9;
  /* margin: 5px; */
  border-radius: 8px;
  margin: 2%;
}

ion-list {
  background-color: darkgray;
}

ion-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  margin-top: 5px;
}
.content-container {
  display: block;
  gap: 0px;
  justify-content: center;
  align-items: center;
  height: 90vh;
  background-color: darkgray;
}
.ion-image {
  margin-block: auto;
  padding: 1px;
  border-radius: 0px 0px 60px 60px;
}
</style>