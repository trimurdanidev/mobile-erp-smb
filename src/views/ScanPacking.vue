<template>
  <ion-page>
    <ion-header class="scan-app-header" :translucent="false">
      <ion-toolbar class="scan-toolbar">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">Scan Packing</span>
          <span class="toolbar-subtitle">Scan barcode paket packing</span>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="false">
      <div class="scan-wrapper">
        <!-- Kamera / Scanner -->
        <div class="scan-card">
          <div class="scan-card-header">
            <ion-icon
              :icon="scanOutline"
              class="scan-section-icon"
            ></ion-icon>
            <span class="scan-section-title">Barcode Packing</span>
            <span class="engine-badge" v-if="isScanning && scanEngine">
              {{ scanEngine }}
            </span>
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
            :color="isScanning ? 'danger' : 'warning'"
            @click="toggleScan"
          >
            <ion-icon
              :icon="isScanning ? stopOutline : scanOutline"
              slot="start"
            ></ion-icon>
            {{ isScanning ? "Stop Scan" : "Mulai Scan Barcode" }}
          </ion-button>
        </div>

        <!-- Input manual / HID scanner -->
        <div class="scan-card">
          <div class="scan-card-header">
            <ion-icon
              :icon="createOutline"
              class="scan-section-icon"
              style="color: #7c3aed; background: #f5f3ff"
            ></ion-icon>
            <span class="scan-section-title">Input Manual / Scanner</span>
            <span class="hid-status" :class="{ 'hid-on': inputFocused }">
              <i class="hid-dot"></i>
              {{ inputFocused ? "Scanner siap" : "Tap untuk aktif" }}
            </span>
          </div>
          <div class="input-row">
            <input
              ref="packingInputRef"
              v-model="packingNo"
              type="text"
              class="resi-input"
              :placeholder="
                useSoftKeyboard
                  ? 'Masukkan nomor packing...'
                  : 'Scan barcode / ketik packing...'
              "
              :inputmode="useSoftKeyboard ? 'text' : 'none'"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="done"
              @keydown.enter.prevent="submitPacking"
              @focus="inputFocused = true"
              @blur="onInputBlur"
            />
            <button
              class="kb-btn"
              :class="{ 'kb-btn-active': useSoftKeyboard }"
              type="button"
              title="Tampilkan keyboard layar"
              @click="toggleKeyboard"
            >
              <ion-icon :icon="keypadOutline"></ion-icon>
            </button>
          </div>
        </div>

        <!-- Riwayat scan (list + counter) -->
        <div class="scan-card">
          <div class="scan-card-header">
            <ion-icon
              :icon="listOutline"
              class="scan-section-icon"
              style="color: #16a34a; background: #f0fdf4"
            ></ion-icon>
            <span class="scan-section-title">Hasil Scan</span>
            <span class="scan-section-sub">Hari ini · {{ scannedBy }}</span>
            <button
              v-if="scanList.length"
              class="clear-btn"
              type="button"
              @click="clearList"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
              Bersihkan
            </button>
          </div>

          <!-- Counter -->
          <div class="stat-row">
            <div class="stat-box stat-total">
              <span class="stat-num">{{ scanList.length }}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-box stat-ok">
              <span class="stat-num">{{ successCount }}</span>
              <span class="stat-label">Berhasil</span>
            </div>
            <div class="stat-box stat-err">
              <span class="stat-num">{{ errorCount }}</span>
              <span class="stat-label">Gagal</span>
            </div>
          </div>

          <!-- List scrollable -->
          <div ref="listRef" class="result-list">
            <div v-if="!scanList.length" class="result-empty">
              Belum ada packing yang di-scan.<br />Arahkan scanner ke barcode packing.
            </div>

            <div
              v-for="(item, idx) in scanList"
              :key="item.id"
              class="result-item"
              :class="'ri-' + item.status"
            >
              <div class="ri-num">{{ scanList.length - idx }}</div>
              <div class="ri-icon">
                <ion-spinner
                  v-if="item.status === 'pending'"
                  name="crescent"
                  class="ri-spinner"
                ></ion-spinner>
                <ion-icon
                  v-else-if="item.status === 'success'"
                  :icon="checkmarkCircleOutline"
                ></ion-icon>
                <ion-icon v-else :icon="closeCircleOutline"></ion-icon>
              </div>
              <div class="ri-body">
                <div class="ri-packing">{{ item.packing }}</div>
                <div class="ri-msg">{{ item.message }}</div>
                <div class="ri-sub">{{ item.time }} · {{ item.source }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit button -->
        <button
          class="submit-btn"
          type="button"
          :disabled="!packingNo.trim()"
          @click="submitPacking"
        >
          <ion-icon :icon="checkmarkOutline" class="btn-icon"></ion-icon>
          Konfirmasi Packing
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
  onIonViewDidEnter,
  onIonViewWillLeave,
} from "@ionic/vue";
import {
  arrowBackOutline,
  scanOutline,
  stopOutline,
  createOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  checkmarkOutline,
  keypadOutline,
  listOutline,
  trashOutline,
  barcodeOutline,
} from "ionicons/icons";
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import { playBeep } from "@/services/audioService";

// ════════════════════════════════════════════════════
// STATE UTAMA
// ════════════════════════════════════════════════════
const packingNo = ref("");
const isScanning = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const scanEngine = ref("");

const userData = JSON.parse(localStorage.getItem("master_user") || "{}");
const scannedBy = userData.user || "unknown";

// ════════════════════════════════════════════════════
// RIWAYAT SCAN (list + counter)
// ════════════════════════════════════════════════════
type ScanStatus = "pending" | "success" | "error";
type ScanSource = "HID" | "Kamera" | "Manual";

interface ScanItem {
  id: number;
  packing: string;
  status: ScanStatus;
  message: string;
  time: string;
  source: ScanSource;
}

// ── Persist riwayat ke storage ─────────────────────
// Key = scan_packing_history:<id user>:<shift>
// Default: 1 "shift" = 1 hari
const historyStore: Storage = localStorage;
const HISTORY_PREFIX = "scan_packing_history:";
const HISTORY_MAX = 500; // batas item yang disimpan

const getShiftKey = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const buildHistoryKey = () =>
  `${HISTORY_PREFIX}${userData.id ?? scannedBy}:${getShiftKey()}`;

let activeKey = buildHistoryKey();

const loadHistory = (): ScanItem[] => {
  try {
    // Bersihkan riwayat shift/hari sebelumnya (punya semua user di device ini)
    const suffix = `:${getShiftKey()}`;
    Object.keys(historyStore)
      .filter((k) => k.startsWith(HISTORY_PREFIX) && !k.endsWith(suffix))
      .forEach((k) => historyStore.removeItem(k));

    const raw = historyStore.getItem(activeKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Item yang belum selesai saat halaman ditinggal statusnya nggak pasti
    // → tandai gagal, user tinggal scan ulang untuk cek status di server.
    return parsed.map((i: ScanItem) => {
      if (i.status === "pending") {
        return {
          ...i,
          status: "error" as ScanStatus,
          message: "Terputus saat pindah halaman — scan ulang untuk cek status",
        };
      }
      return i;
    });
  } catch (err) {
    console.warn("Gagal membaca riwayat scan:", err);
    return [];
  }
};

let saveTimer: any = null;
const saveHistory = () => {
  try {
    if (scanList.value.length === 0) {
      historyStore.removeItem(activeKey);
    } else {
      historyStore.setItem(
        activeKey,
        JSON.stringify(scanList.value.slice(0, HISTORY_MAX))
      );
    }
  } catch (err) {
    console.warn("Gagal menyimpan riwayat scan:", err);
  }
};
const flushHistory = () => {
  clearTimeout(saveTimer);
  saveHistory();
};

const scanList = ref<ScanItem[]>(loadHistory()); // index 0 = scan terbaru
const listRef = ref<HTMLElement | null>(null);
let scanSeq = scanList.value.reduce((max, i) => Math.max(max, i.id), 0);

// Simpan otomatis setiap ada perubahan (debounce 200ms)
watch(
  scanList,
  () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveHistory, 200);
  },
  { deep: true }
);

// Kalau app dibiarkan terbuka lewat pergantian hari/shift → mulai list baru
const reloadIfShiftChanged = () => {
  const key = buildHistoryKey();
  if (key === activeKey) return;
  flushHistory();
  activeKey = key;
  scanList.value = loadHistory();
  scanSeq = scanList.value.reduce((max, i) => Math.max(max, i.id), 0);
};

const successCount = computed(
  () => scanList.value.filter((i) => i.status === "success").length
);
const errorCount = computed(
  () => scanList.value.filter((i) => i.status === "error").length
);

const updateItem = (id: number, patch: Partial<ScanItem>) => {
  const item = scanList.value.find((i) => i.id === id);
  if (item) Object.assign(item, patch);
};

const nowTime = () =>
  new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const scrollListToTop = () =>
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = 0;
  });

const clearList = () => {
  if (!window.confirm("Bersihkan semua riwayat scan hari ini?")) return;
  // Item yang masih diproses / nunggu pilih marketplace jangan dihapus
  scanList.value = scanList.value.filter((i) => i.status === "pending");
  focusInput();
};

// ════════════════════════════════════════════════════
// CORE SCAN — dipakai HID, kamera, dan manual
// Non-blocking: input langsung siap untuk scan berikutnya
// tanpa nunggu response API.
// ════════════════════════════════════════════════════
const RECENT_WINDOW_MS: Record<ScanSource, number> = {
  HID: 1500,
  Manual: 1500,
  Kamera: 3000, // kamera kebaca terus selama barcode masih di depan lensa
};
const recentReads = new Map<string, number>();

const enqueueScan = (raw: string, source: ScanSource) => {
  const packing = (raw || "").trim();
  if (!packing) return;

  // 1) Guard double-read (scanner kebaca 2x / kamera kebaca terus).
  //    Timestamp di-refresh tiap kali kebaca, jadi selama barcode masih
  //    terbaca terus-menerus, tidak akan bikin baris baru.
  const now = Date.now();
  const last = recentReads.get(packing);
  recentReads.set(packing, now);
  if (last && now - last < RECENT_WINDOW_MS[source]) return;

  // 2) Cek riwayat sesi ini
  const existing = scanList.value.find(
    (i) => i.packing === packing && i.status !== "error"
  );
  if (existing) {
    // Masih diproses / nunggu pilih marketplace → abaikan diam-diam
    if (existing.status === "pending") {
      return;
    }
    // Sudah sukses di sesi ini → kasih tanda duplikat tanpa hit API
    playBeep("error");
    scanList.value.unshift({
      id: ++scanSeq,
      packing,
      status: "error",
      message: "Packing sudah di-scan di sesi ini",
      time: nowTime(),
      source,
    });
    scrollListToTop();
    return;
  }

  // 3) Scan baru → tampil langsung (pending), kirim ke API di background
  const id = ++scanSeq;
  scanList.value.unshift({
    id,
    packing,
    status: "pending",
    message: "Memproses...",
    time: nowTime(),
    source,
  });
  scrollListToTop();
  processScan(id);
};

const applyResponse = (id: number, data: any) => {
  if (data.success) {
    updateItem(id, {
      status: "success",
      message: data.message || "Packing berhasil di-scan",
    });
    playBeep("success");
  } else {
    updateItem(id, {
      status: "error",
      message: data.message || "Gagal scan packing",
    });
    playBeep("error");
  }
};

const processScan = async (id: number) => {
  const item = scanList.value.find((i) => i.id === id);
  if (!item) return;

  const payload = {
    resi_no: item.packing, // API menggunakan field resi_no untuk packing juga
    packing_by: scannedBy,
  };

  try {
    const response = await api.post("/resi/scan-packing", payload);
    applyResponse(id, response.data);
  } catch (err: any) {
    const data = err.response?.data;
    playBeep("error");
    updateItem(id, {
      status: "error",
      message: data?.message || "Gagal scan packing",
    });
  }
};

// ════════════════════════════════════════════════════
// INPUT: HID BARCODE SCANNER + MANUAL
// HID scanner = "keyboard" yang ngetik packing lalu kirim Enter.
// Kuncinya: input SELALU fokus, Enter langsung submit, input langsung
// dikosongkan (tanpa nunggu API) → scan berikutnya bisa langsung masuk.
// ════════════════════════════════════════════════════
const packingInputRef = ref<HTMLInputElement | null>(null);
const inputFocused = ref(false);
const useSoftKeyboard = ref(false); // false = keyboard layar disembunyikan (mode scanner)
let isPageActive = true;

const focusInput = () =>
  nextTick(() => packingInputRef.value?.focus({ preventScroll: true }));

const submitPacking = () => {
  const value = packingNo.value.trim();
  if (!value) {
    focusInput();
    return;
  }
  packingNo.value = ""; // kosongkan dulu → siap untuk scan berikutnya
  enqueueScan(value, useSoftKeyboard.value ? "Manual" : "HID");
  focusInput();
};

const toggleKeyboard = () => {
  useSoftKeyboard.value = !useSoftKeyboard.value;
  nextTick(() => {
    const el = packingInputRef.value;
    if (!el) return;
    el.blur();
    el.focus({ preventScroll: true });
  });
};

// Kalau fokus lepas (misal habis tap tombol lain), balikin otomatis
const onInputBlur = () => {
  inputFocused.value = false;
  setTimeout(() => {
    if (!isPageActive) return;
    const a = document.activeElement as HTMLElement | null;
    if (a && ["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName)) return;
    packingInputRef.value?.focus({ preventScroll: true });
  }, 150);
};

// Fallback: kalau ada karakter masuk padahal fokus lagi di tombol/elemen lain,
// tarik fokus ke input (karakter pertama tetap masuk ke input).
const onGlobalKeydown = (e: KeyboardEvent) => {
  if (!isPageActive) return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  const t = e.target as HTMLElement | null;
  if (
    t &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
  ) {
    return;
  }
  packingInputRef.value?.focus({ preventScroll: true });
};

// ════════════════════════════════════════════════════
// SCANNER KAMERA
// ════════════════════════════════════════════════════
let stream: MediaStream | null = null;
let scanInterval: any = null;
let detecting = false; // cegah detect() numpuk kalau lebih lambat dari interval

// Off-screen canvas untuk ROI crop (hanya di memory, tidak di-mount ke DOM)
let roiCanvas: HTMLCanvasElement | null = null;
let roiCtx: CanvasRenderingContext2D | null = null;

const ROI_W_RATIO = 0.7;
const ROI_H_RATIO = 0.5;

const initRoiCanvas = (videoW: number, videoH: number) => {
  roiCanvas = document.createElement("canvas");
  roiCanvas.width = Math.floor(videoW * ROI_W_RATIO);
  roiCanvas.height = Math.floor(videoH * ROI_H_RATIO);
  roiCtx = roiCanvas.getContext("2d", { willReadFrequently: true })!;
};

const cropRoi = (video: HTMLVideoElement): HTMLCanvasElement | null => {
  if (!roiCanvas || !roiCtx) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  // Ambil area tengah video sesuai ukuran ROI canvas
  const srcX = Math.floor((vw - roiCanvas.width) / 2);
  const srcY = Math.floor((vh - roiCanvas.height) / 2);
  roiCtx.drawImage(
    video,
    srcX,
    srcY,
    roiCanvas.width,
    roiCanvas.height,
    0,
    0,
    roiCanvas.width,
    roiCanvas.height
  );
  return roiCanvas;
};

const startScan = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      await showToast(
        "Kamera tidak tersedia. Pastikan akses via HTTPS.",
        "danger"
      );
      return;
    }

    const constraints: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      },
      {
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      },
      { video: { facingMode: "environment" } },
      { video: true },
    ];

    for (const c of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch (_) {
        /* coba constraint berikutnya */
      }
    }

    if (!stream) {
      await showToast(
        "Gagal akses kamera. Berikan izin kamera di browser.",
        "danger"
      );
      return;
    }

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      try {
        await videoRef.value.play();
      } catch (_) {}
    }
    isScanning.value = true;

    // ── Engine 1: Native BarcodeDetector (Chrome/Android) ──
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({
        // Tambah ITF — format umum di barcode packing/warehouse
        formats: [
          "code_128",
          "code_39",
          "ean_13",
          "ean_8",
          "qr_code",
          "data_matrix",
          "itf",
        ],
      });

      scanInterval = setInterval(async () => {
        const video = videoRef.value;
        if (!video || video.readyState < 2 || detecting) return;
        detecting = true;

        try {
          // Init ROI canvas sekali saat ukuran video sudah diketahui
          if (!roiCanvas && video.videoWidth > 0) {
            initRoiCanvas(video.videoWidth, video.videoHeight);
          }

          // Decode hanya area ROI (bukan full frame) → hemat CPU ~50-60%
          const source = roiCanvas ? cropRoi(video) ?? video : video;
          const barcodes = await detector.detect(source);

          if (barcodes.length > 0) {
            // Non-blocking + sudah ada guard duplikat di enqueueScan
            enqueueScan(barcodes[0].rawValue, "Kamera");
          }
        } catch (_) {
        } finally {
          detecting = false;
        }
      }, 80); // ← 80ms (diubah dari 500ms sebelumnya untuk responsivitas)
    } else {
      // ── Engine 2: ZXing fallback (iOS Safari / Firefox) ──
      console.warn("BarcodeDetector tidak didukung, fallback ke ZXing.");

      try {
        const ZXingBrowser = await import("@zxing/browser");
        const ZXingLibrary = await import("@zxing/library");

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
        // TRY_HARDER: ZXing mencoba lebih keras untuk barcode miring/buram/kecil
        hints.set(ZXingLibrary.DecodeHintType.TRY_HARDER, true);

        const zxingReader = new ZXingBrowser.BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 80, // ← turun dari 300ms ke 80ms
        });

        if (videoRef.value && stream) {
          await zxingReader.decodeFromStream(
            stream,
            videoRef.value,
            async (result: any, err: any) => {
              if (!result) return;
              enqueueScan(result.getText(), "Kamera");
            }
          );
        }
      } catch (importErr) {
        console.error("Gagal load ZXing:", importErr);
        await showToast(
          "Scanner tidak dapat dimuat. Coba gunakan Input Manual.",
          "warning"
        );
      }
    }
  } catch (err: any) {
    console.error("Kamera error:", err);
    await showToast("Gagal akses kamera: " + (err.message || err), "danger");
  }
};

const stopScan = async () => {
  // Stop interval (Native)
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }

  // Stop semua track kamera
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
      track.enabled = false;
    });
    stream = null;
  }

  // Reset video element
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.srcObject = null;
    videoRef.value.load();
  }

  // Bersihkan ROI canvas dari memory
  roiCanvas = null;
  roiCtx = null;
  detecting = false;

  isScanning.value = false;
  isProcessing.value = false;
  scanEngine.value = "";
};

const toggleScan = async () => {
  if (isScanning.value) await stopScan();
  else await startScan();
  focusInput();
};

// ── State tambahan untuk kamera (menjaga kompatibilitas) ──
const loading = ref(false);
const isProcessing = ref(false);
const isMounted = ref(true);
const lastResult = ref<any>(null);

onUnmounted(async () => {
  isMounted.value = false;
  await stopScan();
});

// ════════════════════════════════════════════════════
// LIFECYCLE
// ════════════════════════════════════════════════════
// Simpan langsung saat app masuk background / halaman disembunyikan.
// Di Android, app bisa di-kill OS tanpa sempat unmount → tanpa ini scan
// terakhir (yang masih nunggu debounce) bisa hilang.
const onVisibilityChange = () => {
  if (document.visibilityState === "hidden") flushHistory();
};

onMounted(() => {
  document.addEventListener("keydown", onGlobalKeydown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", flushHistory);
  setTimeout(focusInput, 300);
});

onIonViewDidEnter(() => {
  isPageActive = true;
  reloadIfShiftChanged();
  setTimeout(focusInput, 200);
});

onIonViewWillLeave(() => {
  isPageActive = false;
  flushHistory();
  stopScan();
});

onUnmounted(() => {
  document.removeEventListener("keydown", onGlobalKeydown);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("pagehide", flushHistory);
  flushHistory();
  stopScan();
});
</script>

<style scoped>
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

ion-content {
  --background: #f0f4f8;
}
.scan-wrapper {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

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
}
.scan-section-icon {
  font-size: 18px;
  padding: 6px;
  border-radius: 8px;
}
.scan-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.engine-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
  letter-spacing: 0.3px;
}

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
  letter-spacing: 0.2px;
}

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
  background: #f97316;
  top: 50%;
  animation: scanMove 2s ease-in-out infinite;
  box-shadow: 0 0 8px #f97316;
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
  border-color: #f97316;
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

.input-row {
  padding: 14px 16px;
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.resi-input {
  flex: 1;
  min-width: 0;
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
  border-color: #ea580c;
}
.kb-btn {
  width: 46px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.kb-btn-active {
  background: #eff6ff;
  border-color: #ea580c;
  color: #ea580c;
}

/* Status HID (kanan header input) */
.hid-status {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: #94a3b8;
}
.hid-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #cbd5e1;
}
.hid-on {
  color: #16a34a;
}
.hid-on .hid-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

/* ─── Hasil Scan: tombol bersihkan ── */
.clear-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* ─── Counter ── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 16px 4px;
}
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 12px;
}
.stat-num {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
}
.stat-label {
  font-size: 10.5px;
  font-weight: 600;
  margin-top: 2px;
}
.stat-total {
  background: #f1f5f9;
  color: #334155;
}
.stat-ok {
  background: #dcfce7;
  color: #15803d;
}
.stat-err {
  background: #fee2e2;
  color: #b91c1c;
}

/* ─── List scrollable ── */
.result-list {
  margin: 8px 12px 14px;
  max-height: 260px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}
.result-list::-webkit-scrollbar {
  width: 6px;
}
.result-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 6px;
}
.result-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
}
.result-empty {
  padding: 22px 12px;
  text-align: center;
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border-left: 4px solid transparent;
  background: #f8fafc;
  flex-shrink: 0;
}
.ri-success {
  background: #f0fdf4;
  border-left-color: #22c55e;
}
.ri-error {
  background: #fef2f2;
  border-left-color: #ef4444;
}
.ri-pending {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.ri-num {
  min-width: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-align: center;
}
.ri-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.ri-success .ri-icon {
  color: #16a34a;
}
.ri-error .ri-icon {
  color: #dc2626;
}
.ri-spinner {
  --color: #2563eb;
  width: 18px;
  height: 18px;
}
.ri-body {
  flex: 1;
  min-width: 0;
}
.ri-packing {
  font-size: 12.5px;
  font-weight: 700;
  color: #1e293b;
  font-family: monospace;
  word-break: break-all;
}
.ri-msg {
  font-size: 11.5px;
  color: #475569;
  margin-top: 1px;
  line-height: 1.35;
}
.ri-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* ─── Submit Button ── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ea580c, #dc2626);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.3);
  transition: transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.submit-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-icon {
  font-size: 18px;
}
</style>