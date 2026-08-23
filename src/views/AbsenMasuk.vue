<template>
  <ion-page>
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
      <div class="absen-wrapper">
        <!-- ─── Camera Card ─── -->
        <div class="camera-card">
          <div class="camera-label">
            <ion-icon :icon="videocamOutline" class="cam-icon"></ion-icon>
            <span>Kamera Selfie</span>
          </div>

          <div class="video-wrap">
            <!-- Preview setelah foto diambil -->
            <img
              v-if="selfieTaken"
              :src="selfieImage"
              class="video-feed"
              alt="Preview Selfie"
            />

            <!-- Live video stream (PWA mode) -->
            <video
              v-if="!selfieTaken && isPwaMode && isCameraOpen"
              ref="videoRef"
              class="video-feed"
              autoplay
              playsinline
              muted
            ></video>

            <!-- Canvas tersembunyi untuk capture di PWA mode -->
            <canvas ref="canvasRef" class="canvas-hidden"></canvas>

            <!-- Placeholder awal -->
            <div
              v-if="!selfieTaken && !isCameraOpen"
              class="camera-placeholder"
            >
              <div class="cam-pulse-ring"></div>
              <div class="cam-circle">
                <ion-icon
                  :icon="cameraOutline"
                  class="placeholder-icon"
                ></ion-icon>
              </div>
              <p class="cam-placeholder-text">Belum ada foto yang diambil</p>
              <span class="cam-hint-badge">Tap "Buka Kamera" untuk mulai</span>
            </div>

            <!-- Badge sukses -->
            <div v-if="selfieTaken" class="selfie-taken-badge">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              Selfie diambil
            </div>
          </div>

          <!-- Tombol kamera — berubah konteks sesuai state -->
          <button
            class="selfie-btn"
            :class="{ 'selfie-btn-locked': isAbsenLocked }"
            @click="handleCameraBtn"
            :disabled="cameraLoading"
          >
            <ion-spinner
              v-if="cameraLoading"
              name="crescent"
              class="selfie-spinner"
            ></ion-spinner>
            <template v-else>
              <ion-icon
                :icon="isAbsenLocked ? lockClosedOutline : cameraOutline"
                class="selfie-btn-icon"
              ></ion-icon>
              {{ isAbsenLocked ? "Absen Terkunci" : cameraBtnLabel }}
            </template>
          </button>
        </div>

        <!-- ─── Lokasi ─── -->
        <div class="info-card">
          <div class="info-card-header">
            <ion-icon
              :icon="locationOutline"
              class="info-card-icon loc-color"
            ></ion-icon>
            <span class="info-card-title">Lokasi Saat Ini</span>
            <div v-if="loadingLoc" class="loading-dot-wrap">
              <ion-spinner name="dots" class="loc-spinner"></ion-spinner>
            </div>
            <!-- Tombol retry lokasi -->
            <button
              v-if="!loadingLoc && !dataPosition"
              class="retry-loc-btn"
              @click="fetchData"
            >
              <ion-icon :icon="refreshOutline"></ion-icon>
              Coba Lagi
            </button>
          </div>
          <p class="loc-text" v-if="!loadingLoc && dataPosition">
            {{ dataPosition }}
          </p>
          <p
            class="loc-text loc-placeholder"
            v-else-if="!loadingLoc && !dataPosition"
          >
            Belum bisa mengambil lokasi. Pastikan GPS aktif.
          </p>
        </div>

        <!-- ─── Keterangan ─── -->
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

        <!-- ─── Submit ─── -->
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
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
  refreshOutline,
  lockClosedOutline,
} from "ionicons/icons";
import router from "@/router";
import { Capacitor } from "@capacitor/core";
import { Html5Qrcode } from "html5-qrcode";

// ── Deteksi environment ────────────────────────────
// isPwaMode = true  → jalan di browser (iPhone Safari PWA / desktop)
// isPwaMode = false → jalan di native Capacitor (iOS/Android app)
const isPwaMode = !Capacitor.isNativePlatform();

// ── State ──────────────────────────────────────────
const hariIni = ref("");
const tanggalHariIni = ref("");
const latitude = ref(null);
const longitude = ref(null);
const selfieTaken = ref(false);
const selfieImage = ref(null);
const rawBase64 = ref(null);
const loading = ref(false);
const loadingLoc = ref(false);
const cameraLoading = ref(false);
const isCameraOpen = ref(false);
const dataPosition = ref(null);
const fileName = ref(null);
const keterangan = ref(null);
const videoRef = ref(null);
const canvasRef = ref(null);

const getUser = localStorage.getItem("master_user");
const userData = ref([]);
const baseLocation_lat = ref("");
const baseLocation_long = ref("");
const statusUser_base = ref("");
const user = ref(null);
const phone = ref(null);
const nik = ref(null);
const description = ref(null);
const department_name = ref(null);
const start_time = ref(null);

// Stream kamera (PWA mode)
let cameraStream = null;

const hariList = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// ── Label tombol kamera (computed) ────────────────
const cameraBtnLabel = computed(() => {
  if (selfieTaken.value) return "Ambil Ulang Selfie";
  if (isCameraOpen.value) return "Ambil Foto";
  return "Buka Kamera";
});

// ── Helpers tanggal & waktu ────────────────────────
const getCurrentDateTime = () => {
  const now = new Date();
  tanggalHariIni.value = `${String(now.getDate()).padStart(2, "0")}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${now.getFullYear()}`;
  hariIni.value = hariList[now.getDay()];
};

const dateNow = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

const time = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

const getLocation = async () => {
  try {
    // 💡 DETEKSI PLATFORM: Jika dijalankan di Browser Web / PWA (Bukan Native App Android)

    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
      console.log("Menggunakan HTML5 Browser Geolocation untuk Web...");

      if (!navigator.geolocation) {
        throw new Error("Browser Anda tidak mendukung fitur Geolocation.");
      }

      // ── PERBAIKAN DI SINI: Sintaks Promise dibuat super clean & standard ──

      const position = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,

          timeout: 15000,

          maximumAge: 0,
        });
      });

      latitude.value = position.coords.latitude;

      longitude.value = position.coords.longitude;

      return; // Selesai, bypass alur native di bawah
    }

    // ── JALUR NATIVE ANDROID APP (Kode Asli Kamu Tetap Dipertahankan) ──

    console.log("Menggunakan Capacitor Geolocation untuk Native App...");

    const permission = await Geolocation.requestPermissions();

    if (
      permission.location !== "granted" &&
      permission.coarseLocation !== "granted"
    ) {
      throw new Error("Izin lokasi ditolak oleh sistem perangkat.");
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,

      timeout: 15000,
    });

    latitude.value = position.coords.latitude;

    longitude.value = position.coords.longitude;
  } catch (error) {
    throw error; // ← Tetap dilempar ke fetchData bawaanmu
  }
};

// ── Reverse geocoding — hybrid (Capacitor Http / fetch fallback) ─
const reverseGeocode = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const headers = { "User-Agent": "erpsmb/2.3 (trimurdani78.tm@gmail.com)" };

  if (!isPwaMode) {
    const { Http } = await import("@capacitor-community/http");
    const response = await Http.get({ url, headers });
    return response.data.display_name;
  } else {
    const response = await fetch(url, { headers });
    const data = await response.json();
    return data.display_name;
  }
};

const fetchData = async () => {
  loadingLoc.value = true;
  dataPosition.value = null;
  try {
    await getLocation();
    dataPosition.value = await reverseGeocode(latitude.value, longitude.value);
    await showToast("Lokasi berhasil didapatkan", "success");
  } catch (error) {
    console.error("Error lokasi:", error);
    dataPosition.value = null;
    await showToast("Gagal mendapatkan lokasi. Pastikan GPS aktif.", "danger");
  } finally {
    loadingLoc.value = false;
  }
};

// ── Kamera — hybrid ────────────────────────────────
// Native: pakai Capacitor Camera
// PWA   : buka stream getUserMedia → ambil foto via canvas

const openPwaCamera = async () => {
  cameraLoading.value = true;
  try {
    // Coba kamera depan (selfie), fallback ke kamera manapun
    const constraints = [
      {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      { video: { facingMode: "user" } },
      { video: true },
    ];

    for (const c of constraints) {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch (_) {}
    }

    if (!cameraStream) {
      await showToast(
        "Gagal membuka kamera. Berikan izin kamera di browser.",
        "danger"
      );
      return;
    }

    isCameraOpen.value = true;

    // Tunggu DOM update agar videoRef tersedia
    await new Promise((r) => setTimeout(r, 100));

    if (videoRef.value) {
      videoRef.value.srcObject = cameraStream;
      try {
        await videoRef.value.play();
      } catch (_) {}
    }
  } finally {
    cameraLoading.value = false;
  }
};

const capturePwaPhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;

  const video = videoRef.value;
  const canvas = canvasRef.value;
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext("2d");

  // Mirror horizontal (selfie lazimnya di-mirror)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Ambil hasil sebagai base64
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  rawBase64.value = dataUrl.split(",")[1];
  selfieImage.value = dataUrl;
  selfieTaken.value = true;

  // Matikan stream setelah foto diambil
  stopPwaCamera();
  isCameraOpen.value = false;
};

const stopPwaCamera = () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (videoRef.value) videoRef.value.srcObject = null;
};

const takeSelfieNative = async () => {
  const { Camera, CameraResultType, CameraSource } = await import(
    "@capacitor/camera"
  );
  const status = await Camera.checkPermissions();
  if (status.camera !== "granted") {
    const req = await Camera.requestPermissions({ permissions: ["camera"] });
    if (req.camera !== "granted") {
      await showToast("Akses kamera ditolak oleh pengguna.", "danger");
      return;
    }
  }
  const image = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    direction: "front",
  });
  rawBase64.value = image.base64String;
  selfieImage.value = `data:image/jpeg;base64,${image.base64String}`;
  selfieTaken.value = true;
};

// ── Handler tombol kamera (satu tombol, tiga state) ─
const handleCameraBtn = async () => {
  // Cek lock dulu sebelum buka kamera
  if (isAbsenLocked.value) {
    await showLockedAlert();
    return;
  }

  if (isPwaMode) {
    if (selfieTaken.value || !isCameraOpen.value) {
      selfieTaken.value = false;
      selfieImage.value = null;
      rawBase64.value = null;
      await openPwaCamera();
    } else if (isCameraOpen.value) {
      capturePwaPhoto();
    }
  } else {
    await takeSelfieNative();
  }
};

// ── Helper ────────────────────────────────────────
const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeType });
};

const compressBase64 = (
  base64Str,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.7
) => {
  return new Promise((resolve, reject) => {
    if (!base64Str) return reject(new Error("Base64 kosong"));
    const cleaned = base64Str.trim().replace(/[\r\n]/g, "");
    const img = new Image();
    img.src = cleaned.startsWith("data:image")
      ? cleaned
      : `data:image/jpeg;base64,${cleaned}`;
    img.onload = () => {
      let w = img.width,
        h = img.height;
      if (w > h) {
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
      } else {
        if (h > maxHeight) {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
  });
};

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3,
    toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

// ── Submit absen ───────────────────────────────────
const submitAbsen = async () => {
  loading.value = true;
  try {
    userData.value = JSON.parse(getUser);
    const token = localStorage.getItem("access_token");

    // Cek radius (hanya jika statusUser_base === 0 = wajib di kantor)
    if (statusUser_base.value == 0) {
      const distance = getDistanceFromLatLonInMeters(
        parseFloat(latitude.value),
        parseFloat(longitude.value),
        parseFloat(baseLocation_lat.value),
        parseFloat(baseLocation_long.value)
      );
      if (distance > 50) {
        await showToast(
          `Lokasi Terlalu Jauh! Jarak anda ${Math.round(
            distance
          )}M dari tempat kerja.`,
          "danger"
        );
        return;
      }
    }

    // Kompresi gambar
    let finalBase64 = rawBase64.value;
    try {
      const cleaned = rawBase64.value.trim().replace(/[\r\n]/g, "");
      const compressed = await compressBase64(cleaned, 1024, 1024, 0.7);
      finalBase64 = compressed.includes(",")
        ? compressed.split(",")[1]
        : compressed;
    } catch (compressErr) {
      console.warn("Kompresi gagal, pakai gambar asli:", compressErr);
    }

    const blob = base64ToBlob(finalBase64, "image/jpeg");
    if (!blob || blob.size === 0) {
      await showToast("File gambar tidak valid!", "danger");
      return;
    }

    const timestamp = new Date().getTime();
    fileName.value = `IN_${userData.value.user}_${timestamp}.jpeg`;

    const absenData = new FormData();
    absenData.append("user_id", userData.value.user);
    absenData.append("date", dateNow());
    absenData.append("time_in", time());
    absenData.append("latitude_in", latitude.value);
    absenData.append("longitude_in", longitude.value);
    absenData.append("absensi_ref", keterangan.value?.value ?? "");
    absenData.append("address_in", dataPosition.value);
    absenData.append("images_in", blob, fileName.value);

    const apiBase = import.meta.env.VITE_BASE_URL;
    const res = await fetch(`${apiBase}/addAbsen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: absenData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.errors
        ? Object.entries(errData.errors)
            .map(([f, m]) => `${f}: ${m}`)
            .join("\n")
        : errData?.message ?? "Terjadi kesalahan server";
      await showToast(errMsg, "danger");
      return;
    }

    await showSuccessAlert();
    router.replace("/");
  } catch (error) {
    console.error("Gagal absen:", error);
    await showToast(error?.message || "Terjadi kesalahan server", "danger");
  } finally {
    loading.value = false;
  }
};

// ── User data prep ─────────────────────────────────
const fetchUserPrepAbsen = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    userData.value = JSON.parse(getUser);
    const response = await api.get("showByUser/" + userData.value.user, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = response.data.data;
    phone.value = d.phone;
    nik.value = d.nik;
    description.value = d.description;
    department_name.value = d.department_name;
    user.value = d.user;
    baseLocation_lat.value = d.base_location_lat;
    baseLocation_long.value = d.base_location_long;
    statusUser_base.value = d.is_mobile;
    start_time.value = d.start_time;
  } catch (error) {
    console.error("Gagal ambil data user:", error);
    if (error.response?.status === 401) router.replace("/login");
  }
};

// ── Lock absen jika terlambat > 1 jam dari start_time (is_mobile == 0) ──
const isAbsenLocked = computed(() => {
  if (statusUser_base.value != 0) return false; // is_mobile == 1 → bypass, tidak dikunci

  if (!start_time.value) return false;

  const now = new Date();

  // Parse start_time dari string "HH:mm:ss"
  const [sh, sm, ss] = start_time.value.split(":").map(Number);

  // Batas toleransi = start_time + 1 jam, di hari ini
  const batas = new Date();
  batas.setHours(sh, sm + 60, ss ?? 0, 0);

  // Lock hanya jika jam sekarang sudah lewat batas
  // (otomatis reset besok karena pakai new Date() yang selalu hari ini)
  return now > batas;
});

const showLockedAlert = async () => {
  const alert = await alertController.create({
    header: "⛔ Absen Terkunci",
    message: "Anda Terlambat. Besok perbaiki lagi Kehadiran anda",
    buttons: ["OK"],
    cssClass: "locked-alert",
  });
  await alert.present();
};

onMounted(() => {
  getCurrentDateTime();
  fetchData();
  fetchUserPrepAbsen();
});

// Pastikan stream kamera dimatikan saat komponen di-unmount
onUnmounted(() => stopPwaCamera());
</script>

<style scoped>
/* ─── Header ─── */
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
  color: #fff;
  line-height: 1.2;
}
.toolbar-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

/* ─── Content ─── */
ion-content {
  --background: #f0f4f8;
}
.absen-wrapper {
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Camera Card ─── */
.camera-card {
  background: #fff;
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
  min-height: 220px;
}
.video-feed {
  width: 100%;
  display: block;
  max-height: 280px;
  object-fit: cover;
}
.canvas-hidden {
  display: none !important;
}

/* Mirror video preview (selfie lazimnya mirror) */
video.video-feed {
  transform: scaleX(-1);
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
  white-space: nowrap;
}

.selfie-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 14px 16px;
  padding: 14px;
  background: linear-gradient(135deg, #4a90e2, #2563eb);
  color: #fff;
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
.selfie-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}
.selfie-btn-icon {
  font-size: 20px;
}
.selfie-spinner {
  --color: #fff;
  width: 18px;
  height: 18px;
}

/* ─── Info Cards ─── */
.info-card {
  background: #fff;
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

.retry-loc-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 20px;
  cursor: pointer;
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

/* ─── Input ─── */
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

/* ─── Hadir Button ─── */
.hadir-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #fff;
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
  --color: #fff;
  width: 22px;
  height: 22px;
}
.selfie-btn-locked {
  background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35) !important;
}
</style>

<!-- Style global untuk alertController -->
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
  color: #fff !important;
  font-size: 17px !important;
  font-weight: 800 !important;
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
  color: #fff !important;
  border-radius: 12px !important;
}
.custom-alert .alert-button:last-child .alert-button-inner {
  color: #fff !important;
  justify-content: center;
}

/* ─── Camera Placeholder ─── */
.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #1e3a8a22 100%);
  min-height: 220px;
  position: relative;
  overflow: hidden;
}
.camera-placeholder::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.06) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
  pointer-events: none;
}
.cam-pulse-ring {
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 2px solid rgba(37, 99, 235, 0.35);
  animation: camPulse 2.4s ease-out infinite;
}
@keyframes camPulse {
  0% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(0.85);
    opacity: 0;
  }
}
.cam-circle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.15),
    0 8px 24px rgba(37, 99, 235, 0.4);
  z-index: 1;
  margin-bottom: 16px;
}
.placeholder-icon {
  font-size: 34px;
  color: #fff;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}
.cam-placeholder-text {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 10px;
  z-index: 1;
}
.cam-hint-badge {
  font-size: 11px;
  font-weight: 500;
  color: rgba(37, 99, 235, 0.9);
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(37, 99, 235, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  z-index: 1;
}
.locked-alert .alert-wrapper {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;
}
.locked-alert .alert-head {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  padding: 18px 20px 14px !important;
}
.locked-alert .alert-title {
  color: #fff !important;
  font-size: 17px !important;
  font-weight: 800 !important;
}
.locked-alert .alert-message {
  color: #334155 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 1.6 !important;
  padding: 16px 20px !important;
}
.locked-alert .alert-button {
  font-weight: 700 !important;
  color: #dc2626 !important;
}
</style>