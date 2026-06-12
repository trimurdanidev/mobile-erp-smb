<template>
  <ion-page>
    <!-- Header -->
    <ion-header class="scan-app-header" :translucent="false">
      <ion-toolbar class="scan-toolbar">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">Scan Resi</span>
          <span class="toolbar-subtitle">Scan barcode resi pickup</span>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="false">
      <div class="scan-wrapper">
        <!-- Kamera / Scanner -->
        <div class="scan-card">
          <div class="scan-card-header">
            <ion-icon
              :icon="barcodeOutline"
              class="scan-section-icon"
            ></ion-icon>
            <span class="scan-section-title">Barcode Resi</span>
            <!-- Badge info engine yang aktif -->
            <span class="engine-badge" v-if="isScanning">
              {{ scanEngine }}
            </span>
          </div>

          <div class="camera-box" :class="{ 'camera-active': isScanning }">
            <!-- Video element — dipakai oleh kedua engine -->
            <video
              ref="videoRef"
              class="camera-video"
              :class="{ 'video-hidden': !isScanning }"
              autoplay
              playsinline
              muted
            ></video>

            <!-- Canvas tersembunyi — dipakai ZXing untuk capture frame -->
            <canvas ref="canvasRef" class="canvas-hidden"></canvas>

            <!-- Scan overlay -->
            <div class="scan-overlay" v-if="isScanning">
              <div class="scan-line"></div>
              <div class="scan-corner tl"></div>
              <div class="scan-corner tr"></div>
              <div class="scan-corner bl"></div>
              <div class="scan-corner br"></div>
            </div>

            <!-- Placeholder (tampil saat tidak scanning) -->
            <div class="camera-placeholder" v-if="!isScanning">
              <div class="barcode-pulse-ring"></div>
              <div class="barcode-circle">
                <ion-icon
                  :icon="barcodeOutline"
                  class="placeholder-icon"
                ></ion-icon>
              </div>
              <p class="cam-placeholder-text">Siap untuk scan barcode</p>
              <span class="cam-hint-badge"
                >Tap "Mulai Scan Barcode" untuk mulai</span
              >
            </div>
          </div>

          <ion-button
            expand="block"
            class="scan-btn"
            :color="isScanning ? 'danger' : 'primary'"
            @click="toggleScan"
          >
            <ion-icon
              :icon="isScanning ? stopOutline : scanOutline"
              slot="start"
            ></ion-icon>
            {{ isScanning ? "Stop Scan" : "Mulai Scan Barcode" }}
          </ion-button>
        </div>

        <!-- Input manual -->
        <div class="scan-card">
          <div class="scan-card-header">
            <ion-icon
              :icon="createOutline"
              class="scan-section-icon"
              style="color: #7c3aed; background: #f5f3ff"
            ></ion-icon>
            <span class="scan-section-title">Input Manual</span>
          </div>
          <div class="input-row">
            <input
              v-model="resiNo"
              type="text"
              class="resi-input"
              placeholder="Masukkan nomor resi..."
              @keyup.enter="submitResi"
            />
          </div>
        </div>

        <!-- Result -->
        <div class="result-card" v-if="lastResult">
          <div
            class="result-icon-wrap"
            :class="lastResult.success ? 'result-ok' : 'result-err'"
          >
            <ion-icon
              :icon="
                lastResult.success ? checkmarkCircleOutline : closeCircleOutline
              "
            ></ion-icon>
          </div>
          <div class="result-text">
            <div class="result-title">
              {{ lastResult.success ? "Berhasil!" : "Gagal" }}
            </div>
            <div class="result-msg">{{ lastResult.message }}</div>
            <div class="result-resi" v-if="lastResult.resi">
              Resi: {{ lastResult.resi }}
            </div>
          </div>
        </div>

        <!-- Submit button -->
        <button
          class="submit-btn"
          :class="{ 'submit-loading': loading }"
          :disabled="loading || !resiNo"
          @click="submitResi"
        >
          <ion-spinner
            v-if="loading"
            name="crescent"
            class="btn-spinner"
          ></ion-spinner>
          <template v-else>
            <ion-icon :icon="checkmarkOutline" class="btn-icon"></ion-icon>
            Konfirmasi Pickup
          </template>
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import {
  arrowBackOutline,
  barcodeOutline,
  scanOutline,
  stopOutline,
  createOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { ref, onUnmounted } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import { playBeep } from "@/services/audioService";

// ── State ──────────────────────────────────────────
const resiNo = ref("");
const loading = ref(false);
const isScanning = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const lastResult = ref<any>(null);
const isProcessing = ref(false);
const scanEngine = ref(""); // "Native" | "ZXing"

const userData = JSON.parse(localStorage.getItem("master_user") || "{}");
const scannedBy = userData.user || "unknown";

// ── Internal scanner state ─────────────────────────
let stream: MediaStream | null = null;
let scanInterval: any = null;
let zxingReader: any = null; // instance ZXingBrowser.BrowserMultiFormatReader

// ── Deteksi support BarcodeDetector (Chrome / Android) ─
const isBarcodeDetectorSupported = (): boolean => {
  return typeof (window as any).BarcodeDetector !== "undefined";
};

// ── Buka stream kamera (cross-browser) ────────────
const openCamera = async (): Promise<boolean> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    await showToast(
      "Kamera tidak tersedia. Pastikan akses via HTTPS.",
      "danger"
    );
    return false;
  }

  // Coba kamera belakang (environment) dengan exact, fallback tanpa exact
  const constraints: MediaStreamConstraints[] = [
    {
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    { video: { facingMode: "environment" } },
    { video: true }, // last resort — any camera
  ];

  for (const constraint of constraints) {
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraint);
      break;
    } catch (e) {
      console.warn("Coba constraint berikutnya:", e);
    }
  }

  if (!stream) {
    await showToast(
      "Gagal akses kamera. Pastikan izin kamera sudah diberikan.",
      "danger"
    );
    return false;
  }

  if (videoRef.value) {
    videoRef.value.srcObject = stream;
    // iOS Safari kadang perlu dipaksa play setelah srcObject di-set
    try {
      await videoRef.value.play();
    } catch (playErr) {
      console.warn(
        "Video play error (aman di-ignore di beberapa device):",
        playErr
      );
    }
  }

  return true;
};

// ── Engine 1: Native BarcodeDetector (Chrome/Android) ─
const startNativeScanner = async () => {
  scanEngine.value = "Native";

  const detector = new (window as any).BarcodeDetector({
    formats: [
      "code_128",
      "code_39",
      "ean_13",
      "ean_8",
      "qr_code",
      "data_matrix",
    ],
  });

  scanInterval = setInterval(async () => {
    if (!videoRef.value || videoRef.value.readyState < 2) return;
    if (isProcessing.value) return;
    try {
      const barcodes = await detector.detect(videoRef.value);
      if (barcodes.length > 0) {
        await submitResiAuto(barcodes[0].rawValue);
      }
    } catch (_) {}
  }, 500);
};

// ── Engine 2: ZXing (iOS Safari, Firefox, dll) ────
const startZXingScanner = async () => {
  scanEngine.value = "ZXing";

  try {
    // Dynamic import — hanya load kalau dibutuhkan
    const ZXingBrowser = await import("@zxing/browser");
    const ZXingLibrary = await import("@zxing/library");

    // Hints: aktifkan semua format barcode 1D + 2D yang relevan
    const hints = new Map();
    hints.set(ZXingLibrary.DecodeHintType.POSSIBLE_FORMATS, [
      ZXingLibrary.BarcodeFormat.CODE_128,
      ZXingLibrary.BarcodeFormat.CODE_39,
      ZXingLibrary.BarcodeFormat.EAN_13,
      ZXingLibrary.BarcodeFormat.EAN_8,
      ZXingLibrary.BarcodeFormat.QR_CODE,
      ZXingLibrary.BarcodeFormat.DATA_MATRIX,
      ZXingLibrary.BarcodeFormat.ITF,
    ]);

    zxingReader = new ZXingBrowser.BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 300,
    });

    // Decode terus-menerus dari video element
    zxingReader.decodeFromVideoElement(
      videoRef.value,
      async (result: any, err: any) => {
        if (result && !isProcessing.value) {
          await submitResiAuto(result.getText());
        }
        // err di sini normal (NotFoundException tiap frame kosong) — abaikan
      }
    );
  } catch (importErr) {
    console.error("Gagal load ZXing:", importErr);
    await showToast(
      "Scanner tidak dapat dimuat. Coba gunakan Input Manual.",
      "warning"
    );
  }
};

// ── Start scan ─────────────────────────────────────
const startScan = async () => {
  const cameraOk = await openCamera();
  if (!cameraOk) return;

  isScanning.value = true;

  if (isBarcodeDetectorSupported()) {
    await startNativeScanner();
  } else {
    // Fallback ZXing untuk iOS Safari / Firefox
    await startZXingScanner();
  }
};

// ── Stop scan ──────────────────────────────────────
const stopScan = () => {
  // Hentikan interval native
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }

  // Hentikan ZXing decoder
  if (zxingReader) {
    try {
      zxingReader.reset();
    } catch (_) {}
    zxingReader = null;
  }

  // Matikan stream kamera
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }

  isScanning.value = false;
  scanEngine.value = "";
};

const toggleScan = async () => {
  if (isScanning.value) {
    stopScan();
  } else {
    await startScan();
  }
};

onUnmounted(() => stopScan());

// ── Submit Auto dari Scanner ───────────────────────
const submitResiAuto = async (scanned: string) => {
  if (!scanned.trim() || isProcessing.value) return;

  isProcessing.value = true;
  lastResult.value = null;

  try {
    const response = await api.post("/resi/scan-pickup", {
      resi_no: scanned.trim(),
      scanned_by: scannedBy,
    });

    lastResult.value = {
      success: true,
      message: response.data.message || "Resi berhasil di-scan",
      resi: scanned,
    };

    playBeep("success");
    await showToast("✅ " + (response.data.message || "Berhasil"), "success");
  } catch (err: any) {
    playBeep("error");
    const msg = err.response?.data?.message || "Gagal scan resi";
    lastResult.value = {
      success: false,
      message: msg,
      resi: scanned,
    };
    await showToast("❌ " + msg, "danger");
  } finally {
    // Unlock setelah 2 detik, biar tidak re-scan barcode yang sama terus
    setTimeout(() => {
      isProcessing.value = false;
    }, 2000);
  }
};

// ── Submit Manual ──────────────────────────────────
const submitResi = async () => {
  if (!resiNo.value.trim()) {
    await showToast("Masukkan nomor resi terlebih dahulu", "warning");
    return;
  }

  loading.value = true;
  lastResult.value = null;

  try {
    const response = await api.post("/resi/scan-pickup", {
      resi_no: resiNo.value.trim(),
      scanned_by: scannedBy,
    });

    lastResult.value = {
      success: true,
      message: response.data.message || "Resi berhasil di-scan",
      resi: resiNo.value,
    };

    playBeep("success");
    await showToast("✅ " + (response.data.message || "Berhasil"), "success");
    resiNo.value = "";
  } catch (err: any) {
    playBeep("error");
    const msg = err.response?.data?.message || "Gagal scan resi";

    lastResult.value = {
      success: false,
      message: msg,
      resi: resiNo.value,
    };
    await showToast("❌ " + msg, "danger");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ─── Header ── */
.scan-app-header {
  --background: #1e3a8a;
  background: #1e3a8a;
  box-shadow: none !important;
  border: none !important;
}
.scan-app-header::after {
  display: none !important;
}
.scan-toolbar {
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

/* ─── Engine Badge ── */
.engine-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  color: #16a34a;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  padding: 2px 8px;
  border-radius: 20px;
}

/* ─── Content ── */
ion-content {
  --background: #f0f4f8;
}
.scan-wrapper {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ─── Card ── */
.scan-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}
.scan-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.scan-section-icon {
  font-size: 18px;
  color: #2563eb;
  background: #eff6ff;
  padding: 6px;
  border-radius: 8px;
}
.scan-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

/* ─── Camera Box ── */
.camera-box {
  position: relative;
  width: 100%;
  height: 220px;
  background: #0f172a;
  overflow: hidden;
}
.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.video-hidden {
  display: none !important;
}

/* Canvas tersembunyi untuk ZXing capture */
.canvas-hidden {
  display: none !important;
}

/* ─── Camera Placeholder ── */
.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #1e3a8a22 100%);
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
.barcode-pulse-ring {
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 2px solid rgba(37, 99, 235, 0.35);
  animation: barcodePulse 2.4s ease-out infinite;
}
@keyframes barcodePulse {
  0% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(0.85);
    opacity: 0;
  }
}
.barcode-circle {
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
  margin-bottom: 14px;
}
.placeholder-icon {
  font-size: 34px;
  color: #ffffff;
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
  letter-spacing: 0.2px;
}

/* ─── Scan Overlay ── */
.scan-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.scan-line {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #22c55e;
  top: 50%;
  animation: scanMove 2s ease-in-out infinite;
  box-shadow: 0 0 8px #22c55e;
}
@keyframes scanMove {
  0%,
  100% {
    top: 25%;
  }
  50% {
    top: 75%;
  }
}
.scan-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #22c55e;
  border-style: solid;
}
.scan-corner.tl {
  top: 16px;
  left: 16px;
  border-width: 3px 0 0 3px;
}
.scan-corner.tr {
  top: 16px;
  right: 16px;
  border-width: 3px 3px 0 0;
}
.scan-corner.bl {
  bottom: 16px;
  left: 16px;
  border-width: 0 0 3px 3px;
}
.scan-corner.br {
  bottom: 16px;
  right: 16px;
  border-width: 0 3px 3px 0;
}

.scan-btn {
  margin: 12px 16px;
  --border-radius: 14px;
  font-weight: 700;
}

/* ─── Input ── */
.input-row {
  padding: 14px 16px;
}
.resi-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #1e293b;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.resi-input:focus {
  border-color: #2563eb;
}

/* ─── Result ── */
.result-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}
.result-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.result-ok {
  background: #dcfce7;
  color: #16a34a;
}
.result-err {
  background: #fee2e2;
  color: #dc2626;
}
.result-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.result-msg {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.result-resi {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  font-family: monospace;
}

/* ─── Submit Button ── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
  transition: transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.submit-btn:active:not(.submit-loading) {
  transform: scale(0.97);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.submit-loading {
  opacity: 0.75;
}
.btn-icon {
  font-size: 18px;
}
.btn-spinner {
  --color: #fff;
  width: 18px;
  height: 18px;
}
</style>