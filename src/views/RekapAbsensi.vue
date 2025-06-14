<template>
  <ion-page>
    <ion-content color="full">
      <div class="content-container">
        <ion-header>
          <ion-toolbar>
            <ion-title>Rekap Absensi</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-card-content>
          <!-- Input Tanggal -->
          <ion-item button @click="showPopover = true" style="color: black">
            <ion-label>Dari Tanggal</ion-label>
            <ion-text slot="end">
              {{
                selectedDate ? formatDate(selectedDate) : "Pilih Tanggal"
              }}</ion-text
            >
          </ion-item>

          <!-- Popover -->
          <ion-popover
            :is-open="showPopover"
            side="bottom"
            alignment="center"
            style="--width: 300px; --max-width: 90vw"
            @didDismiss="showPopover = false"
          >
            <ion-content class="ion-padding" style="width: 300px">
              <ion-datetime
                ref="datetimeRef"
                presentation="date"
                v-model="selectedDate"
              ></ion-datetime>
              <ion-button expand="block" size="small" @click="confirmDate"
                >OK</ion-button
              >
            </ion-content>
          </ion-popover>

          <ion-item button @click="showPopover2 = true" style="color: black">
            <ion-label>Sampai Tanggal</ion-label>
            <ion-text slot="end">
              {{
                selectedDateEnd ? formatDate(selectedDateEnd) : "Pilih Tanggal"
              }}</ion-text
            >
          </ion-item>

          <!-- Popover -->
          <ion-popover
            :is-open="showPopover2"
            side="bottom"
            alignment="center"
            style="--width: 300px; --max-width: 90vw"
          >
            <ion-content class="ion-padding" style="width: 300px">
              <ion-datetime
                ref="datetimeRef"
                presentation="date"
                v-model="selectedDateEnd"
                @ionChange="showPopover2 = false"
              ></ion-datetime>
              <ion-button expand="block" size="small" @click="confirmDate2"
            >OK</ion-button
            >
            </ion-content>
          </ion-popover>
          <br />
          <ion-button
            expand="block"
            @click="loadAbsensiRange"
            :disabled="loading"
          >
            <ion-spinner v-if="loading"></ion-spinner>
            <span v-else>Lihat</span></ion-button
          >
          <!-- <ion-button expand="full" @click="loadAbsensi">Refresh</ion-button> -->
        </ion-card-content>

        <ion-card-content>
          <ion-label
            style="color: black"
            text-align="center"
            v-if="absensi.data"
          >
            Rekap Data Absen <br />
            Tanggal :
            {{
              formatDate(selectedDate) + " s/d " + formatDate(selectedDateEnd)
            }}</ion-label
          >
        </ion-card-content>

        <ion-list>
          <ion-item v-for="(absen, index) in absensi.data" :key="index">
            <ion-label class="text-align-left">
              <h2 style="color: blue">
                {{ absen.username }} - {{ absen.department }}
              </h2>
              <p style="font-size: 12px">
                <strong>Tanggal :</strong> {{ absen.date }}
              </p>
              <p style="font-size: 12px">
                <strong>Jam Masuk :</strong> {{ absen.time_in }}
              </p>
              <p style="font-size: 12px">
                <strong>Keterangan :</strong> {{ absen.absensi_ref }}
              </p>
              <p style="font-size: 10px">
                <strong>Lokasi :</strong> {{ absen.address_in }}
              </p>

              <!-- <p style="font-size: 12px">
                <strong>Alamat Absen  :</strong>
                {{ absen.address_in }}
              </p> -->
            </ion-label>
            <br />
            <ion-img
              v-if="absen.images_in"
              :src="storageUrl + absen.images_in"
              alt="Foto Absensi"
            >
            </ion-img>
          </ion-item>
        </ion-list>
        <!-- </ion-card-content> -->
      </div>
      <!-- <ion-refresher slot="fixed" @ionRefresh="refreshData">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <ion-infinite-scroll @ionInfinite="loadMoreData">
        <ion-infinite-scroll-content
          loading-spinner="bubbles"
          loading-text="Memuat data..."
        >
        </ion-infinite-scroll-content>
      </ion-infinite-scroll> -->
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
  IonPopover,
  IonText,
} from "@ionic/vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import { inject } from "vue";
import { constructOutline } from "ionicons/icons";

const absensi = ref([]);
const rekap = ref(null);
const getUser = localStorage.getItem("master_user");
const userData = ref([]);
const page = ref(1);
const hasMoreData = ref(true);
const storageUrl = inject("storageUrl");
const showPopover = ref(false);
const showPopover2 = ref(false);
const selectedDate = ref(null);
const selectedDateEnd = ref(null);
const datetimeRef = ref("");

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const dateSetApi = (dateStr) => {
  const now = new Date(dateStr);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const confirmDate = () => {
  showPopover.value = false; 
};

const confirmDate2 = () => {
  showPopover2.value = false; 
};

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

const loadAbsensiRange = async () => {
  if (!selectedDate.value) {
    showToast("Dari Tanggal Belum Dipilih", "danger");
  } else if (!selectedDateEnd.value) {
    showToast("Sampai Tanggal Belum Dipilih", "danger");
  } else {
    try {
      userData.value = JSON.parse(getUser);
      const response = api.get(
        "/getAbsenRekap/" +
          userData.value.user +
          "/" +
          dateSetApi(selectedDate.value) +
          "/" +
          dateSetApi(selectedDateEnd.value)
      );
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
  }
};

onMounted(() => {
  // loadAbsensi();
  // loadAbsensiRange();
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
  margin-top: 0px;
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