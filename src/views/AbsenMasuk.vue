<template>
  <ion-page>
    <!-- Header -->
    <ion-header class="absen-app-header" :translucent="false">
      <ion-toolbar class="absen-toolbar">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">Absen Masuk</span>
          <span class="toolbar-subtitle"
            >{{ hariIni }}, {{ tanggalHariIni }}</span
          >
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="false">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content
          pulling-icon="chevron-down-circle-outline"
          refreshing-spinner="crescent"
        ></ion-refresher-content>
      </ion-refresher>

      <div class="absen-wrapper">
        <!-- ── Camera Section ─────────────────────── -->
        <div class="camera-card">
          <div class="camera-label">
            <ion-icon :icon="videocamOutline" class="cam-icon"></ion-icon>
            <span>Kamera Selfie</span>
          </div>
          <div class="video-wrap">
            <video ref="videoElement" autoplay class="video-feed"></video>
            <canvas ref="canvasElement" style="display: none"></canvas>
            <div v-if="selfieTaken" class="selfie-taken-badge">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              Selfie diambil
            </div>
          </div>
          <button class="selfie-btn" @click="takeSelfie">
            <ion-icon :icon="cameraOutline" class="selfie-btn-icon"></ion-icon>
            Ambil Selfie
          </button>
        </div>

        <!-- ── Location Card ──────────────────────── -->
        <div class="info-card">
          <div class="info-card-header">
            <ion-icon
              :icon="locationOutline"
              class="info-card-icon loc-color"
            ></ion-icon>
            <span class="info-card-title">Lokasi Saat Ini</span>
            <div v-if="loading" class="loading-dot-wrap">
              <ion-spinner name="dots" class="loc-spinner"></ion-spinner>
            </div>
          </div>
          <p class="loc-text" v-if="!loading && dataPosition">
            {{ dataPosition }}
          </p>
          <p class="loc-text loc-placeholder" v-else-if="!loading">
            Mengambil lokasi…
          </p>
        </div>

        <!-- ── Keterangan Input ────────────────────── -->
        <div class="info-card">
          <div class="info-card-header">
            <ion-icon
              :icon="createOutline"
              class="info-card-icon note-color"
            ></ion-icon>
            <span class="info-card-title">Keterangan</span>
          </div>
          <div class="custom-input-wrap">
            <input
              ref="keterangan"
              type="text"
              class="custom-input"
              placeholder="Masukkan keterangan absen…"
            />
          </div>
        </div>

        <!-- ── Submit Button ──────────────────────── -->
        <button
          class="hadir-btn"
          :class="{ 'hadir-btn-disabled': !selfieTaken || loading }"
          :disabled="!selfieTaken || loading"
          @click="submitAbsen"
        >
          <ion-spinner
            v-if="loading"
            name="crescent"
            class="hadir-spinner"
          ></ion-spinner>
          <template v-else>
            <ion-icon
              :icon="checkmarkDoneOutline"
              class="hadir-icon"
            ></ion-icon>
            Hadir
          </template>
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonItem,
  IonInput,
  IonLabel,
  alertController,
} from "@ionic/vue";
import {
  arrowBackOutline,
  videocamOutline,
  cameraOutline,
  locationOutline,
  createOutline,
  checkmarkDoneOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import router from "@/router";
import { Http } from "@capacitor-community/http";

// ── State ─────────────────────────────────────────
const hariIni = ref("");
const tanggalHariIni = ref("");
const dateAbsen = ref("");
const absenTime = ref(null);
const latitude = ref(null);
const longitude = ref(null);
const selfieTaken = ref(null);
const videoElement = ref(null);
const canvasElement = ref(null);
const selfieImage = ref(null);
const loading = ref(false);
const getUser = localStorage.getItem("master_user");
const userData = ref([]);
const imageLocation = ref(null);
const printRes = ref(null);
const printRes2 = ref(null);
const dataPosition = ref(null);
const prinLok = ref(null);
const fileName = ref(null);
const imageBase64 = ref(null);
const keterangan = ref(null);
const showModal = ref(false);
const isRefreshing = ref(false);
const hariList = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const user = ref(null);
const baseLocation_lat = ref("");
const baseLocation_long = ref("");
const statusUser_base = ref("");
const parsedUser = ref(null);
const geterUser = ref(null);
const nik = ref(null);
const description = ref(null);
const phone = ref(null);
const department_name = ref(null);

// ── Functions ─────────────────────────────────────
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  tanggalHariIni.value = `${day}-${month}-${year}`;
  hariIni.value = hariList[now.getDay()];
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const dateNow = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const time = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const getLocation = () => {
  if ("geolocation" in navigator) {
    loading.value = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude.value = position.coords.latitude;
        longitude.value = position.coords.longitude;
        loading.value = false;
      },
      (error) => {
        console.error("Gagal mengambil lokasi:", error.message);
      }
    );
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          latitude.value = position.coords.latitude;
          longitude.value = position.coords.longitude;
          const response = await Http.get({
            url: "https://nominatim.openstreetmap.org/reverse",
            params: {
              format: "jsonv2",
              lat: latitude.value,
              lon: longitude.value,
            },
            headers: { "User-Agent": "erpsmb/2.3 (trimurdani78.tm@gmail.com)" },
          });
          dataPosition.value = (await response).data.display_name;
          await showToast(dataPosition.value, "success");
          loading.value = false;
        },
        (error) => {
          console.error("Gagal mengambil lokasi:", error.message);
        }
      );
    }
  } catch (error) {
    console.error("Error Menampilkan Lokasi:", error);
  } finally {
    loading.value = false;
  }
};

const takeSelfie = () => {
  const video = videoElement.value;
  const canvas = canvasElement.value;
  const context = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  selfieImage.value = canvas.toDataURL("image/jpg");
  selfieTaken.value = "data:image/jpeg;base64," + selfieImage.value;
};

const dataURItoBlob = (dataURI) => {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return new Blob([uint8Array], { type: mimeString });
};

const showSuccessAlert = async () => {
  const alert = await alertController.create({
    header: "Absensi Berhasil!",
    message:
      "Terima kasih tetap semangat dan tingkatkan kinerja pekerjaanmu Ya Okeh!",
    buttons: ["OK"],
    cssClass: "custom-alert",
  });
  await alert.present();
};

const fetchUserPrepAbsen = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    userData.value = JSON.parse(getUser);
    const response = api.get("showByUser/" + userData.value.user, {
      headers: { Authorization: `Bearer ${token}` },
    });
    user.value = (await response).data;
    parsedUser.value = JSON.stringify(user.value);
    geterUser.value = JSON.parse(parsedUser.value);
    phone.value = geterUser.value.data.phone;
    nik.value = geterUser.value.data.nik;
    description.value = geterUser.value.data.description;
    department_name.value = geterUser.value.data.department_name;
    user.value = geterUser.value.data.user;
    baseLocation_lat.value = geterUser.value.data.base_location_lat;
    baseLocation_long.value = geterUser.value.data.base_location_long;
    statusUser_base.value = geterUser.value.data.is_mobile;
  } catch (error) {
    console.error(
      "❌ Gagal mengambil data pengguna:",
      error.response?.data || error
    );
    if (error.response?.status === 401) logout();
  }
};

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const submitAbsen = async () => {
  loading.value = true;
  try {
    userData.value = JSON.parse(getUser);
    const token = localStorage.getItem("access_token");
    const baseLat = parseFloat(baseLocation_lat.value);
    const baseLong = parseFloat(baseLocation_long.value);
    const userLat = parseFloat(latitude.value);
    const userLong = parseFloat(longitude.value);
    const distance = getDistanceFromLatLonInMeters(
      userLat,
      userLong,
      baseLat,
      baseLong
    );
    const maxRadius = 50;

    if (distance > maxRadius && statusUser_base.value == 0) {
      await showToast(
        `Lokasi Terlalu Jauh!\n Jarak anda ${Math.round(
          distance
        )}M Dari Tempat Kerja.`,
        "danger"
      );
      loading.value = false;
      return;
    }

    const absenData = new FormData();
    const timestamp = new Date().getTime();
    fileName.value = `IN_${userData.value.user}_${timestamp}.png`;

    absenData.append("user_id", userData.value.user);
    absenData.append("date", dateNow());
    absenData.append("time_in", time());
    absenData.append("latitude_in", latitude.value);
    absenData.append("longitude_in", longitude.value);
    absenData.append("absensi_ref", keterangan.value.value);
    absenData.append("address_in", dataPosition.value);

    const blob = dataURItoBlob(selfieImage.value);
    if (blob.size === 0) {
      await showToast("File gambar tidak valid!", "danger");
      return;
    }
    absenData.append("images_in", blob, fileName.value);

    const response = api.post("/addAbsen", absenData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    const resultAbsen = (await response).data;
    printRes.value = JSON.stringify(resultAbsen);
    printRes2.value = JSON.parse(printRes.value);
    showSuccessAlert();
    router.replace("/");
  } catch (error) {
    console.error("Gagal absen:", error.response?.data || error.message);
    router.replace("/");
    await showToast(error.response.data.message, "danger");
  } finally {
    loading.value = false;
    router.replace("/");
  }
};

const handleRefresh = (event) => {
  setTimeout(() => {
    window.location.reload();
    event.target.complete();
  }, 1000);
};

onMounted(() => {
  getCurrentDateTime();
  getLocation();
  fetchData();
  fetchUserPrepAbsen();
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "user" } })
    .then((stream) => {
      videoElement.value.srcObject = stream;
    })
    .catch((error) => {
      console.error("Gagal mengakses kamera:", error.message);
    });
});
</script>

<style scoped>
/* ─── Header ────────────────────────────────────── */
.absen-app-header {
  --background: #1e3a8a;
  background: #1e3a8a;
  box-shadow: none !important;
  border: none !important;
}
.absen-app-header::after {
  display: none !important;
}

.absen-toolbar {
  --background: transparent;
  --border-color: transparent;
  --padding-top: 4px;
  --padding-bottom: 4px;
  padding-top: 5%;
}

.back-btn {
  --color: rgba(255, 255, 255, 0.85);
  --background: rgba(255, 255, 255, 0.12);
  --border-radius: 10px;
  --padding-start: 8px;
  --padding-end: 8px;
  margin-left: 4px;
}

.toolbar-title-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: 8px;
}

.toolbar-title {
  font-size: 17px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.toolbar-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

/* ─── Content ───────────────────────────────────── */
ion-content {
  --background: #f0f4f8;
}

.absen-wrapper {
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Camera Card ───────────────────────────────── */
.camera-card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
}

.camera-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.cam-icon {
  font-size: 18px;
  color: #2563eb;
  background: #eff6ff;
  padding: 6px;
  border-radius: 8px;
}

.video-wrap {
  position: relative;
  width: 100%;
  background: #0f172a;
}

.video-feed {
  width: 100%;
  display: block;
  max-height: 280px;
  object-fit: cover;
}

.selfie-taken-badge {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(34, 197, 94, 0.9);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(4px);
}

.selfie-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 14px 16px;
  padding: 14px;
  background: linear-gradient(135deg, #4a90e2, #2563eb);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.selfie-btn:active {
  transform: scale(0.97);
}

.selfie-btn-icon {
  font-size: 20px;
}

/* ─── Info Cards ────────────────────────────────── */
.info-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 14px 16px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-card-icon {
  font-size: 18px;
  padding: 6px;
  border-radius: 8px;
}

.loc-color {
  color: #16a34a;
  background: #f0fdf4;
}

.note-color {
  color: #7c3aed;
  background: #f5f3ff;
}

.info-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  flex: 1;
}

.loading-dot-wrap {
  margin-left: auto;
}

.loc-spinner {
  --color: #2563eb;
  width: 18px;
  height: 18px;
}

.loc-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.loc-placeholder {
  color: #94a3b8;
  font-style: italic;
}

/* ─── Custom Input ──────────────────────────────── */
.custom-input-wrap {
  background: #f8fafc;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.custom-input-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.custom-input {
  width: 100%;
  padding: 13px 14px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  background: transparent;
  border: none;
  outline: none;
  box-sizing: border-box;
}

.custom-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

/* ─── Hadir Button ──────────────────────────────── */
.hadir-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  letter-spacing: 0.3px;
  -webkit-tap-highlight-color: transparent;
}

.hadir-btn:active:not(.hadir-btn-disabled) {
  transform: scale(0.97);
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.25);
}

.hadir-btn-disabled {
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

.hadir-icon {
  font-size: 22px;
}

.hadir-spinner {
  --color: #ffffff;
  width: 22px;
  height: 22px;
}
</style>

<!-- Style global untuk alertController — tidak bisa scoped -->
<style>
.custom-alert .alert-wrapper {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;
}

.custom-alert .alert-head {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%) !important;
  padding: 18px 20px 14px !important;
}

.custom-alert .alert-title {
  color: #ffffff !important;
  font-size: 17px !important;
  font-weight: 800 !important;
  letter-spacing: -0.2px;
}

.custom-alert .alert-message {
  color: #334155 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 1.6 !important;
  padding: 16px 20px !important;
}

.custom-alert .alert-button-group {
  padding: 4px 12px 12px !important;
}

.custom-alert .alert-button {
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  color: #2563eb !important;
}

.custom-alert .alert-button:last-child {
  background: linear-gradient(135deg, #1e3a8a, #2563eb) !important;
  color: #ffffff !important;
  border-radius: 12px !important;
}

.custom-alert .alert-button:last-child .alert-button-inner {
  color: #ffffff !important;
  justify-content: center;
}
</style>