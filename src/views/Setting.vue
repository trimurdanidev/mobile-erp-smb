<template>
  <ion-page>
    <ion-header class="setting-app-header" :translucent="false">
      <ion-toolbar class="setting-toolbar">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="handleHeaderBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">
            {{ activeSection ? sectionTitles[activeSection] : 'Pengaturan' }}
          </span>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="false">
      <transition name="fade-slide" mode="out-in">
        <!-- ══════════ MAIN MENU LIST ══════════ -->
        <div v-if="!activeSection" key="menu" class="settings-menu">
          <div class="menu-item item-bluetooth" @click="openSection('bluetooth')">
            <div class="menu-item-icon icon-bluetooth">
              <ion-icon :icon="bluetoothOutline"></ion-icon>
            </div>
            <div class="menu-item-body">
              <span class="menu-item-title">Bluetooth</span>
              <span class="menu-item-subtitle">
                {{ bluetoothEnabled ? 'Aktif' : 'Tidak Aktif' }}
              </span>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="menu-item-chevron"></ion-icon>
          </div>

          <div class="menu-item item-device" @click="openSection('device')">
            <div class="menu-item-icon icon-device">
              <ion-icon :icon="informationCircleOutline"></ion-icon>
            </div>
            <div class="menu-item-body">
              <span class="menu-item-title">Informasi Perangkat</span>
              <span class="menu-item-subtitle">{{ deviceInfo.platform }} · {{ deviceInfo.manufacturer }}</span>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="menu-item-chevron"></ion-icon>
          </div>

          <div class="menu-item item-version" @click="openSection('version')">
            <div class="menu-item-icon icon-version">
              <ion-icon :icon="constructOutline"></ion-icon>
            </div>
            <div class="menu-item-body">
              <span class="menu-item-title">Versi Aplikasi</span>
              <span class="menu-item-subtitle">v{{ appVersion }}</span>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="menu-item-chevron"></ion-icon>
          </div>
        </div>

        <!-- ══════════ BLUETOOTH DETAIL ══════════ -->
        <div v-else-if="activeSection === 'bluetooth'" key="bluetooth" class="section-detail">
          <button class="detail-back-btn" @click="closeSection">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
            <span>Pengaturan</span>
          </button>

          <div class="detail-card">
            <div class="detail-card-header">
              <div class="detail-icon icon-bluetooth">
                <ion-icon :icon="bluetoothOutline"></ion-icon>
              </div>
              <div>
                <h2 class="detail-title">Bluetooth</h2>
                <p class="detail-subtitle">Hubungkan ke perangkat terdekat</p>
              </div>
            </div>

            <div class="toggle-row">
              <span class="toggle-row-label">{{ bluetoothEnabled ? 'Aktif' : 'Tidak Aktif' }}</span>
              <ion-toggle :checked="bluetoothEnabled" @ionChange="toggleBluetooth"></ion-toggle>
            </div>

            <div v-if="!bluetoothEnabled && !hasBluetoothPermission" class="permission-warning">
              <span>Bluetooth belum diaktifkan atau izin tidak diberikan</span>
              <button class="permission-btn" @click="requestBluetoothPermission">
                Beri Izin
              </button>
            </div>

            <template v-else-if="bluetoothEnabled">
              <div class="device-list-header">
                <span>Perangkat Tersedia</span>
                <button class="rescan-btn" :disabled="isScanning" @click="startScan">
                  <ion-icon :icon="refreshOutline"></ion-icon>
                </button>
              </div>

              <div v-if="isScanning" class="device-scanning">
                <ion-spinner class="device-spinner"></ion-spinner>
                <span>Mencari perangkat...</span>
              </div>

              <div v-else-if="discoveredDevices.length === 0" class="device-empty">
                <span>Tidak ada perangkat ditemukan</span>
                <span class="device-hint">Tekan tombol scan untuk mencari ulang</span>
              </div>

              <div v-else class="device-list">
                <div
                  v-for="result in discoveredDevices"
                  :key="result.device.deviceId"
                  class="device-item"
                  :class="{ 'device-selected': pairedDevice && pairedDevice.address === result.device.deviceId }"
                  @click="connectDevice(result)"
                >
                  <div class="device-info-col">
                    <div class="device-name">{{ result.device.name || 'Perangkat Tanpa Nama' }}</div>
                    <div class="device-address">{{ result.device.deviceId }}</div>
                  </div>
                  <ion-icon :icon="chevronForwardOutline" class="device-action"></ion-icon>
                </div>
              </div>

              <div v-if="pairedDevice" class="connected-banner">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <span>Terhubung dengan {{ pairedDevice.name || pairedDevice.address }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- ══════════ DEVICE INFO DETAIL ══════════ -->
        <div v-else-if="activeSection === 'device'" key="device" class="section-detail">
          <button class="detail-back-btn" @click="closeSection">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
            <span>Pengaturan</span>
          </button>

          <div class="detail-card">
            <div class="detail-card-header">
              <div class="detail-icon icon-device">
                <ion-icon :icon="informationCircleOutline"></ion-icon>
              </div>
              <div>
                <h2 class="detail-title">Informasi Perangkat</h2>
                <p class="detail-subtitle">Detail perangkat yang digunakan</p>
              </div>
            </div>

            <div class="info-list">
              <div class="info-row">
                <span class="info-label">Platform</span>
                <span class="info-value">{{ deviceInfo.platform }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Versi OS</span>
                <span class="info-value">{{ deviceInfo.version }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Manufacturer</span>
                <span class="info-value">{{ deviceInfo.manufacturer }}</span>
              </div>
              <div class="info-row" v-if="deviceInfo.model">
                <span class="info-label">Model</span>
                <span class="info-value">{{ deviceInfo.model }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════ APP VERSION DETAIL ══════════ -->
        <div v-else-if="activeSection === 'version'" key="version" class="section-detail">
          <button class="detail-back-btn" @click="closeSection">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
            <span>Pengaturan</span>
          </button>

          <div class="detail-card version-card">
            <div class="version-badge">
              <ion-icon :icon="constructOutline"></ion-icon>
            </div>
            <span class="version-number">v{{ appVersion }}</span>
            <span class="version-caption">Versi Aplikasi Terkini</span>

            <div class="info-list" v-if="buildNumber">
              <div class="info-row">
                <span class="info-label">Build</span>
                <span class="info-value">{{ buildNumber }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
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
  IonToggle,
} from "@ionic/vue";
import {
  arrowBackOutline,
  chevronBackOutline,
  chevronForwardOutline,
  bluetoothOutline,
  informationCircleOutline,
  constructOutline,
  refreshOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { Device } from "@capacitor/device";
import { App } from "@capacitor/app";
// npm i @capacitor-community/bluetooth-le  (jika belum terpasang di project)
import { BleClient } from "@capacitor-community/bluetooth-le";

const router = useRouter();

/* ─────────────── Navigasi antar section ─────────────── */
const activeSection = ref(null); // null | 'bluetooth' | 'device' | 'version'
const sectionTitles = {
  bluetooth: "Bluetooth",
  device: "Informasi Perangkat",
  version: "Versi Aplikasi",
};

const openSection = (section) => {
  activeSection.value = section;
};
const closeSection = () => {
  activeSection.value = null;
};
const handleHeaderBack = () => {
  if (activeSection.value) {
    closeSection();
  } else {
    router.replace("/");
  }
};

/* ─────────────── Bluetooth ─────────────── */
const bluetoothEnabled = ref(false);
const hasBluetoothPermission = ref(true);
const isScanning = ref(false);
const discoveredDevices = ref([]);
const pairedDevice = ref(null);

const initBluetooth = async () => {
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
  } catch (error) {
    console.warn("Bluetooth LE tidak tersedia di platform ini:", error);
  }
};

const toggleBluetooth = async (event) => {
  const isEnabled = event.detail.checked;

  if (isEnabled) {
    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      bluetoothEnabled.value = true;
      hasBluetoothPermission.value = true;
      await showToast("Bluetooth berhasil diaktifkan", "success");
      startScan();
    } catch (error) {
      console.error("Gagal mengaktifkan Bluetooth:", error);
      bluetoothEnabled.value = false;
      hasBluetoothPermission.value = false;
      await showToast("Gagal mengaktifkan Bluetooth", "danger");
    }
  } else {
    try {
      if (isScanning.value) {
        await BleClient.stopLEScan();
        isScanning.value = false;
      }
      if (pairedDevice.value) {
        await BleClient.disconnect(pairedDevice.value.address);
        pairedDevice.value = null;
      }
    } catch (error) {
      console.error("Gagal menonaktifkan Bluetooth dengan bersih:", error);
    }
    discoveredDevices.value = [];
    bluetoothEnabled.value = false;
    await showToast("Bluetooth berhasil dimatikan", "success");
  }
};

const requestBluetoothPermission = async () => {
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
    hasBluetoothPermission.value = true;
    await showToast("Izin Bluetooth telah diberikan", "success");
  } catch (error) {
    console.error("Gagal meminta izin Bluetooth:", error);
    await showToast("Gagal mendapatkan izin Bluetooth", "danger");
  }
};

const startScan = async () => {
  discoveredDevices.value = [];
  isScanning.value = true;
  try {
    await BleClient.requestLEScan({}, (result) => {
      const exists = discoveredDevices.value.find(
        (d) => d.device.deviceId === result.device.deviceId
      );
      if (!exists) discoveredDevices.value.push(result);
    });

    setTimeout(async () => {
      try {
        await BleClient.stopLEScan();
      } catch (error) {
        console.error("Gagal menghentikan scan:", error);
      }
      isScanning.value = false;
    }, 8000);
  } catch (error) {
    console.error("Gagal memulai scan:", error);
    isScanning.value = false;
    await showToast("Gagal memindai perangkat", "danger");
  }
};

const connectDevice = async (result) => {
  try {
    await BleClient.connect(result.device.deviceId);
    pairedDevice.value = {
      name: result.device.name,
      address: result.device.deviceId,
    };
    await showToast(
      `Terhubung dengan ${result.device.name || result.device.deviceId}`,
      "success"
    );
  } catch (error) {
    console.error("Gagal terhubung ke perangkat:", error);
    await showToast("Gagal terhubung ke perangkat", "danger");
  }
};

/* ─────────────── Informasi Perangkat ─────────────── */
const deviceInfo = ref({
  platform: "Unknown",
  version: "Unknown",
  manufacturer: "Unknown",
  model: "",
});

const getDeviceInfo = async () => {
  try {
    const info = await Device.getInfo();
    deviceInfo.value = {
      platform: info.platform || "Unknown",
      version: info.osVersion || "Unknown",
      manufacturer: info.manufacturer || "Unknown",
      model: info.model || "",
    };
  } catch (error) {
    console.error("Gagal mengambil informasi perangkat:", error);
  }
};

/* ─────────────── Versi Aplikasi ─────────────── */
const appVersion = ref("1.0.0");
const buildNumber = ref("");

const getAppVersion = async () => {
  try {
    const info = await App.getInfo();
    appVersion.value = info.version || "1.0.0";
    buildNumber.value = info.build || "";
  } catch (error) {
    console.error("Gagal mengambil versi aplikasi:", error);
    appVersion.value = "1.0.0";
  }
};

onMounted(() => {
  getDeviceInfo();
  getAppVersion();
  initBluetooth();
});
</script>

<style scoped>
/* ═══════════════════ Header ═══════════════════ */
.setting-app-header {
  --background: #1e3a8a;
  background: #1e3a8a;
  box-shadow: none !important;
  border: none !important;
}
.setting-app-header::after {
  display: none !important;
}
.setting-toolbar {
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

ion-content {
  --background: #f0f4f8;
}

/* ═══════════════════ Transisi ═══════════════════ */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* ═══════════════════ Menu Utama ═══════════════════ */
.settings-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.menu-item:active {
  transform: scale(0.98);
}

.item-bluetooth {
  background: #eaf6ff;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.08);
}
.item-device {
  background: #eefbf1;
  box-shadow: 0 2px 10px rgba(5, 150, 105, 0.08);
}
.item-version {
  background: #fff7ea;
  box-shadow: 0 2px 10px rgba(180, 83, 9, 0.08);
}

.menu-item-icon {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.icon-bluetooth {
  background: #dbeafe;
  color: #2563eb;
}
.icon-device {
  background: #dcfce7;
  color: #059669;
}
.icon-version {
  background: #fef3c7;
  color: #b45309;
}

.menu-item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.menu-item-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.menu-item-subtitle {
  font-size: 12.5px;
  color: #64748b;
  font-weight: 500;
}
.menu-item-chevron {
  font-size: 18px;
  color: #94a3b8;
}

/* ═══════════════════ Section Detail ═══════════════════ */
.section-detail {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-back-btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: none;
  border-radius: 999px;
  padding: 8px 14px 8px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.detail-back-btn ion-icon {
  font-size: 18px;
}

.detail-card {
  background: #fff;
  border-radius: 20px;
  padding: 20px 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.detail-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
}
.detail-subtitle {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: #64748b;
}

/* Toggle row */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px;
}
.toggle-row-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

/* Permission warning */
.permission-warning {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 12px;
  border: 1px solid #fde047;
}
.permission-warning span {
  font-size: 13px;
  color: #92400e;
}
.permission-btn {
  align-self: flex-start;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}
.permission-btn:hover {
  background: #d97706;
}

/* Device list */
.device-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}
.rescan-btn {
  border: none;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.rescan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.device-scanning {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}
.device-spinner {
  --color: #2563eb;
  width: 22px;
  height: 22px;
}

.device-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px 0;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}
.device-hint {
  font-size: 11.5px;
  color: #94a3b8;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s ease;
}
.device-item:active {
  transform: scale(0.98);
}
.device-item.device-selected {
  background: #dbeafe;
  border-color: #2563eb;
}
.device-name {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.device-address {
  font-size: 11.5px;
  color: #64748b;
  font-family: monospace;
  margin-top: 2px;
}
.device-action {
  font-size: 18px;
  color: #94a3b8;
}

.connected-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #dcfce7;
  color: #166534;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}
.connected-banner ion-icon {
  font-size: 18px;
}

/* Info list */
.info-list {
  display: flex;
  flex-direction: column;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}
.info-value {
  font-size: 13px;
  color: #374151;
  font-weight: 700;
}

/* Version card */
.version-card {
  align-items: center;
  text-align: center;
  padding: 28px 18px;
}
.version-badge {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #fef3c7;
  color: #b45309;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.version-number {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
}
.version-caption {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
}
</style>