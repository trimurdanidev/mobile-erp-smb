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
          </div>

          <div class="camera-box" :class="{ 'camera-active': isScanning }">
            <video
              ref="videoRef"
              class="camera-video"
              :class="{ 'video-hidden': !isScanning }"
              autoplay
              playsinline
              muted
            ></video>

            <!-- Scan overlay -->
            <div class="scan-overlay" v-if="isScanning">
              <div class="scan-line"></div>
              <div class="scan-corner tl"></div>
              <div class="scan-corner tr"></div>
              <div class="scan-corner bl"></div>
              <div class="scan-corner br"></div>
            </div>

            <!-- Placeholder -->
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

    <!-- ══════════════════════════════════════
         MODAL PILIH MARKETPLACE (Dinamis dari API)
    ══════════════════════════════════════ -->
    <ion-modal
      :is-open="isShopModalOpen"
      css-class="shop-label-modal"
      :backdrop-dismiss="false"
    >
      <div class="shop-modal-inner">
        <!-- Header modal -->
        <div class="shop-modal-header">
          <button class="modal-x-btn" @click="cancelShopModal" :disabled="submitShopLoading">
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>

          <div class="shop-modal-icon-wrap">
            <ion-icon
              :icon="alertCircleOutline"
              class="shop-modal-alert-icon"
            ></ion-icon>
          </div>
          <div class="shop-modal-title">Resi Tidak Ditemukan</div>
          <div class="shop-modal-subtitle">
            Resi <span class="resi-highlight">{{ pendingResi }}</span> tidak ada
            di Shopee. Pilih marketplace untuk melanjutkan pickup:
          </div>
        </div>

        <!-- Pilihan Marketplace — DINAMIS dari API -->
        <div class="marketplace-list">
          <!-- Loading state saat fetch marketplace -->
          <div v-if="isLoadingMarketplace" class="marketplace-loading-state">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Memuat daftar marketplace...</p>
          </div>

          <!-- Empty state kalau API gagal/kosong -->
          <div
            v-else-if="marketplaceList.length === 0"
            class="marketplace-empty-state"
          >
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <p>Gagal memuat daftar marketplace.</p>
            <button class="retry-marketplace-btn" @click="fetchMarketplaceList">
              <ion-icon :icon="refreshOutline"></ion-icon>
              Coba Lagi
            </button>
          </div>

          <!-- List marketplace dari API -->
          <button
            v-else
            v-for="shop in marketplaceList"
            :key="shop.id"
            class="marketplace-btn"
            :class="{
              'marketplace-selected': selectedShop === shop.marketplace_name,
              'marketplace-loading-btn':
                submitShopLoading && selectedShop === shop.marketplace_name,
            }"
            @click="selectAndSubmit(shop.marketplace_name)"
            :disabled="submitShopLoading"
          >
            <div class="marketplace-logo-wrap">
              <img
                :src="shop.marketplace_image_url"
                :alt="shop.marketplace_name"
                class="marketplace-logo-img"
                @error="handleLogoError($event)"
              />
            </div>
            <div class="marketplace-info">
              <span class="marketplace-name">{{ shop.marketplace_name }}</span>
              <span class="marketplace-desc"
                >Konfirmasi pickup via {{ shop.marketplace_name }}</span
              >
            </div>
            <div class="marketplace-action">
              <ion-spinner
                v-if="
                  submitShopLoading && selectedShop === shop.marketplace_name
                "
                name="crescent"
                class="shop-spinner"
              ></ion-spinner>
              <ion-icon
                v-else
                :icon="
                  selectedShop === shop.marketplace_name
                    ? checkmarkCircleOutline
                    : chevronForwardOutline
                "
                class="marketplace-arrow"
                :class="{
                  'arrow-selected': selectedShop === shop.marketplace_name,
                }"
              ></ion-icon>
            </div>
          </button>
        </div>

        <!-- Footer modal -->
        <div class="shop-modal-footer">
          <button
            class="btn-cancel-shop"
            @click="cancelShopModal"
            :disabled="submitShopLoading"
          >
            Batalkan Scan
          </button>
        </div>
      </div>
    </ion-modal>
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
  IonModal,
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
  alertCircleOutline,
  chevronForwardOutline,
  refreshOutline,
  closeOutline,
} from "ionicons/icons";
import { ref, onMounted, onUnmounted } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import { playBeep } from "@/services/audioService";
import { Html5Qrcode } from "html5-qrcode";

// ── State ──────────────────────────────────────────
const resiNo = ref("");
const loading = ref(false);
const isScanning = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const lastResult = ref<any>(null);
const isProcessing = ref(false);

// ── Shop Modal State ───────────────────────────────
const isShopModalOpen = ref(false);
const pendingResi = ref("");
const selectedShop = ref<string | null>(null);
const submitShopLoading = ref(false);

// ── Marketplace List (dinamis dari API) ────────────
interface MarketplaceItem {
  id: number;
  marketplace_name: string;
  marketplace_image: string;
  marketplace_image_url: string;
}
const marketplaceList = ref<MarketplaceItem[]>([]);
const isLoadingMarketplace = ref(false);

const userData = JSON.parse(localStorage.getItem("master_user") || "{}");
const scannedBy = userData.user || "unknown";

// ── Fetch daftar marketplace dari API ──────────────
const fetchMarketplaceList = async () => {
  isLoadingMarketplace.value = true;
  try {
    const response = await api.get("/getListMarketplace");
    if (response.data.success) {
      marketplaceList.value = response.data.data;
    } else {
      marketplaceList.value = [];
    }
  } catch (err) {
    console.error("Gagal mengambil daftar marketplace:", err);
    marketplaceList.value = [];
  } finally {
    isLoadingMarketplace.value = false;
  }
};

// Fallback gambar kalau logo gagal di-load
const handleLogoError = (event: Event) => {
  (event.target as HTMLImageElement).src =
    "https://placehold.co/100x100/f1f5f9/94a3b8?text=Shop";
};

// ── Scanner ────────────────────────────────────────
let stream: MediaStream | null = null;
let scanInterval: any = null;
let html5QrcodeScanner: Html5Qrcode | null = null;

const startScan = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      await showToast(
        "Kamera tidak tersedia. Pastikan akses via HTTPS.",
        "danger"
      );
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (exactErr) {
      console.warn("exact environment gagal, fallback:", exactErr);
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
    }

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }
    isScanning.value = true;

    if ("BarcodeDetector" in window) {
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
    } else {
      console.warn(
        "BarcodeDetector tidak didukung, menggunakan fallback html5-qrcode."
      );
      const elementId = "video-container-id";
      html5QrcodeScanner = new Html5Qrcode(elementId);
      const config = {
        fps: 10,
        qrbox: (width: number, height: number) => ({
          width: width * 0.7,
          height: height * 0.7,
        }),
      };
      await html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          if (isProcessing.value) return;
          await submitResiAuto(decodedText);
        },
        () => {}
      );
    }
  } catch (err: any) {
    console.error("Kamera error:", err);
    await showToast("Gagal akses kamera: " + (err.message || err), "danger");
  }
};

const stopScan = async () => {
  if (scanInterval) clearInterval(scanInterval);
  if (html5QrcodeScanner) {
    try {
      if (html5QrcodeScanner.isScanning) await html5QrcodeScanner.stop();
    } catch (err) {
      console.error("Gagal menghentikan html5QrcodeScanner:", err);
    }
    html5QrcodeScanner = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (videoRef.value) videoRef.value.srcObject = null;
  isScanning.value = false;
};

const toggleScan = async () => {
  if (isScanning.value) stopScan();
  else await startScan();
};

onMounted(() => {
  // Prefetch daftar marketplace di awal biar modal langsung siap saat dibutuhkan
  fetchMarketplaceList();
});

onUnmounted(() => stopScan());

// ── Handle Response API ────────────────────────────
const handleScanResponse = (response: any, resi: string) => {
  const data = response.data;

  // Cek need_shop_label → buka modal pilih marketplace
  if (!data.success && data.need_shop_label === true) {
    pendingResi.value = data.data?.resi_no || resi;
    selectedShop.value = null;
    isShopModalOpen.value = true;

    // Refresh daftar marketplace tiap kali modal dibuka,
    // jaga-jaga ada marketplace baru ditambahkan di backend
    if (marketplaceList.value.length === 0) {
      fetchMarketplaceList();
    }
    return;
  }

  if (data.success) {
    lastResult.value = {
      success: true,
      message: data.message || "Resi berhasil di-scan",
      resi,
    };
    playBeep("success");
    showToast("✅ " + (data.message || "Berhasil"), "success");
  } else {
    lastResult.value = {
      success: false,
      message: data.message || "Gagal scan resi",
      resi,
    };
    playBeep("error");
    showToast("❌ " + (data.message || "Gagal"), "danger");
  }
};

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
    handleScanResponse(response, scanned.trim());
  } catch (err: any) {
    if (err.response?.data?.need_shop_label === true) {
      pendingResi.value = err.response.data?.data?.resi_no || scanned.trim();
      selectedShop.value = null;
      isShopModalOpen.value = true;
      if (marketplaceList.value.length === 0) fetchMarketplaceList();
    } else {
      playBeep("error");
      const msg = err.response?.data?.message || "Gagal scan resi";
      lastResult.value = { success: false, message: msg, resi: scanned };
      await showToast("❌ " + msg, "danger");
    }
  } finally {
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
    handleScanResponse(response, resiNo.value.trim());
    if (response.data.success) resiNo.value = "";
  } catch (err: any) {
    if (err.response?.data?.need_shop_label === true) {
      pendingResi.value =
        err.response.data?.data?.resi_no || resiNo.value.trim();
      selectedShop.value = null;
      isShopModalOpen.value = true;
      if (marketplaceList.value.length === 0) fetchMarketplaceList();
    } else {
      playBeep("error");
      const msg = err.response?.data?.message || "Gagal scan resi";
      lastResult.value = { success: false, message: msg, resi: resiNo.value };
      await showToast("❌ " + msg, "danger");
    }
  } finally {
    loading.value = false;
  }
};

// ── Shop Modal Actions ─────────────────────────────
const selectAndSubmit = async (shopName: string) => {
  if (submitShopLoading.value) return;
  selectedShop.value = shopName;
  submitShopLoading.value = true;

  try {
    const response = await api.post("/resi/scan-pickup", {
      resi_no: pendingResi.value,
      scanned_by: scannedBy,
      shop_label: shopName, // ← kirim nama marketplace yang dipilih ke backend
    });

    const data = response.data;
    isShopModalOpen.value = false;

    lastResult.value = {
      success: data.success,
      message: data.message || (data.success ? "Berhasil" : "Gagal"),
      resi: pendingResi.value,
    };

    if (data.success) {
      playBeep("success");
      await showToast("✅ " + (data.message || "Berhasil"), "success");
      resiNo.value = "";
    } else {
      playBeep("error");
      await showToast("❌ " + (data.message || "Gagal"), "danger");
    }
  } catch (err: any) {
    playBeep("error");
    const msg = err.response?.data?.message || "Gagal konfirmasi pickup";
    await showToast("❌ " + msg, "danger");
    lastResult.value = {
      success: false,
      message: msg,
      resi: pendingResi.value,
    };
    isShopModalOpen.value = false;
  } finally {
    submitShopLoading.value = false;
    selectedShop.value = null;
    pendingResi.value = "";
  }
};

const cancelShopModal = () => {
  if (submitShopLoading.value) return;
  isShopModalOpen.value = false;
  selectedShop.value = null;
  pendingResi.value = "";
  lastResult.value = {
    success: false,
    message: "Scan dibatalkan.",
    resi: "",
  };
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

/* ─── Camera ── */
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

/* Scan overlay */
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

/* ════════════════════════════════════
   SHOP LABEL MODAL
════════════════════════════════════ */
.shop-modal-inner {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  height: 100%;
}

/* Header modal */
.shop-modal-header {
  position: relative; /* ← TAMBAH INI */
  background: #ffffff;
  padding: 24px 20px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}
.shop-modal-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff7ed;
  border: 2px solid #fed7aa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}
.shop-modal-alert-icon {
  font-size: 26px;
  color: #ea580c;
}
.shop-modal-title {
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
}
.shop-modal-subtitle {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  max-width: 280px;
}
.resi-highlight {
  font-weight: 700;
  color: #2563eb;
  font-family: monospace;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 4px;
}

/* Marketplace List */
.marketplace-list {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

/* Loading / empty state untuk fetch marketplace */
.marketplace-loading-state,
.marketplace-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  gap: 8px;
  text-align: center;
}
.marketplace-loading-state p,
.marketplace-empty-state p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}
.marketplace-empty-state ion-icon {
  font-size: 36px;
  color: #fca5a5;
}
.retry-marketplace-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 8px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.marketplace-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.15s, background 0.15s;
}
.marketplace-btn:active:not(:disabled) {
  background: #f8fafc;
}
.marketplace-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.marketplace-selected {
  border-color: #2563eb !important;
  background: #eff6ff !important;
}
.marketplace-loading-btn {
  border-color: #93c5fd !important;
}

/* Logo area — sekarang pakai <img> dari API */
.marketplace-logo-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  overflow: hidden;
  padding: 6px;
}
.marketplace-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Info */
.marketplace-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.marketplace-name {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.marketplace-desc {
  font-size: 11.5px;
  color: #94a3b8;
}

/* Action icon */
.marketplace-action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.marketplace-arrow {
  font-size: 20px;
  color: #cbd5e1;
}
.arrow-selected {
  color: #2563eb;
  font-size: 22px;
}
.shop-spinner {
  --color: #2563eb;
  width: 20px;
  height: 20px;
}

/* Footer modal */
.shop-modal-footer {
  padding: 14px 16px 24px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}
.btn-cancel-shop {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.btn-cancel-shop:active:not(:disabled) {
  background: #f1f5f9;
}
.btn-cancel-shop:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<style>
ion-modal.shop-label-modal {
  --width: 100%;
  --height: auto;
  --max-height: 75%;
  --border-radius: 24px 24px 0 0;
  --box-shadow: 0 -6px 24px rgba(15, 23, 42, 0.18);
  align-items: flex-end;
}
ion-modal.shop-label-modal::part(content) {
  border-radius: 24px 24px 0 0;
}
/* ── Tombol X pojok kanan atas ── */
.modal-x-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  z-index: 10;
}
.modal-x-btn:active:not(:disabled) {
  background: #e2e8f0;
}
.modal-x-btn:disabled {
  opacity: 0.4;
}

/* ── Safe area fix — footer naik dari bawah ── */
.shop-modal-footer {
  padding: 14px 16px calc(24px + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}
</style>