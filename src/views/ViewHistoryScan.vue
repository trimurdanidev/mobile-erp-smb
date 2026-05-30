<template>
  <ion-page class="forced-light-mode">
    <ion-header class="scan-app-header" :translucent="false">
      <ion-toolbar class="scan-toolbar">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">Riwayat Scan Resi</span>
          <span class="toolbar-subtitle">Menampilkan Data Scan Resi</span>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="light-content">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content
          pulling-icon="chevron-down-circle-outline"
          refreshing-spinner="crescent"
        ></ion-refresher-content>
      </ion-refresher>

      <!-- Ganti filter-action-bar yang lama dengan ini -->

      <div class="filter-wrap">
        <!-- Search -->
        <div class="filter-group filter-group-full">
          <label class="filter-label">Cari Resi</label>
          <div class="search-input-wrap">
            <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
            <input
              v-model="searchQuery"
              type="text"
              class="filter-input"
              placeholder="Cari nomor resi atau order..."
            />
          </div>
        </div>

        <!-- Status -->
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select
            v-model="selectedStatus"
            class="filter-select"
            @change="fetchHistory"
          >
            <option value="ALL">Semua</option>
            <option value="PICKUP">Pickup</option>
            <option value="PACKING">Packing</option>
          </select>
        </div>
      </div>

      <div class="history-wrapper">
        <div v-if="isLoading" class="loading-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Memuat riwayat scan...</p>
        </div>

        <div v-else-if="filteredHistoryList.length === 0" class="empty-state">
          <ion-icon class="empty-icon" :icon="timeOutline"></ion-icon>
          <p>Belum ada riwayat scan yang cocok.</p>
        </div>

        <div v-else class="table-container">
          <div class="table-head">
            <div class="col-center">#</div>
            <div>Data Resi & User</div>
            <div class="col-center">Kurir</div>
            <div class="col-center">Status</div>
          </div>

          <div
            v-for="(item, index) in filteredHistoryList"
            :key="item.id"
            class="table-row"
          >
            <div class="col-index">{{ index + 1 }}</div>

            <div class="col-info">
              <div class="row-resi">{{ item.resi_no || "-" }}</div>
              <div class="row-order">No. Order: {{ item.order_no || "-" }}</div>

              <div class="row-operator">
                <span
                  v-if="(item.resi_status || '').toUpperCase() === 'PICKUP'"
                >
                  👤 Pickup: <b>{{ item.scanned_by || "System" }}</b>
                </span>
                <span
                  v-else-if="
                    (item.resi_status || '').toUpperCase() === 'PACKING'
                  "
                >
                  👤 Packing: <b>{{ item.packing_by || "System" }}</b>
                </span>
                <span v-else>👤 Operator: -</span>
              </div>
              <div class="row-time">🕒 {{ formatDate(item.updated_at) }}</div>
            </div>

            <div class="col-courier">
              <img
                :src="cleanLogoUrl(item.logo_url)"
                @error="handleImageError($event)"
                class="table-courier-logo"
                alt="courier logo"
              />
            </div>

            <div class="col-status">
              <span
                :class="[
                  'status-badge-text',
                  (item.resi_status || 'UNKNOWN').toLowerCase(),
                ]"
              >
                {{ item.resi_status || "UNKNOWN" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonSpinner,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
} from "@ionic/vue";
import {
  timeOutline,
  arrowBackOutline,
  chevronDownOutline,
  searchOutline,
} from "ionicons/icons";
import api from "@/services/api";

const selectedStatus = ref("ALL");
const searchQuery = ref("");
interface ResiHistory {
  id: number;
  resi_no: string;
  order_no: string;
  resi_status: string;
  scanned_by: string;
  packing_by: string;
  updated_at: string;
  logo_url: string;
}

const historyList = ref<ResiHistory[]>([]);
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const isLoading = ref(false);

/**
 * 💡 PENCARIAN REAL-TIME FRONTEND:
 * Memfilter list berdasarkan kecocokan ketikan Nomor Resi atau Nomor Order
 */
const filteredHistoryList = computed(() => {
  return historyList.value;
});

// Pembersih URL ganda Laravel Storage
const cleanLogoUrl = (rawUrl) => {
  if (!rawUrl) return "https://placehold.co/100x100/f1f5f9/94a3b8?text=Kurir";
  if (rawUrl.includes("http://", 4) || rawUrl.includes("https://", 4)) {
    const correctUrlStartIndex =
      rawUrl.lastIndexOf("http://") !== -1
        ? rawUrl.lastIndexOf("http://")
        : rawUrl.lastIndexOf("https://");

    if (correctUrlStartIndex !== -1) {
      return rawUrl.substring(correctUrlStartIndex);
    }
  }
  return rawUrl;
};

const handleImageError = (event) => {
  event.target.src = "https://placehold.co/100x100/f1f5f9/94a3b8?text=Kurir";
};

// Fungsi Ambil Data dari Laravel
const fetchHistory = async () => {
  isLoading.value = true;
  try {
    const response = await api.get(`/resi/history`, {
      params: {
        status: selectedStatus.value,
        search: searchQuery.value, // ← Mengirimkan kata kunci pencarian langsung ke database Laravel
      },
    });
    if (response.data.success) {
      historyList.value = response.data.data;
    }
  } catch (error) {
    console.error("Gagal mengambil data history scan resi:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleStatusChange = (event) => {
  selectedStatus.value = event.detail.value;
  fetchHistory();
};

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchHistory();
  }, 500);
});

const handleRefresh = async (event) => {
  await fetchHistory();
  event.target.complete();
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return (
    date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
};

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
/* ─── 🛡️ PAKSA FIX BACKGROUND HITAM (Anti-Darkmode) ─── */
.forced-light-mode,
.light-content {
  --background: #f8fafc !important;
  background: #f8fafc !important;
  color: #1e293b !important;
}

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

/* ─── Bar Filter Baru (Select Dropdown & Searchbar) ─── */
/* ─── Filter — seragam dengan halaman lain ── */
.filter-wrap {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  margin: 16px 16px 0;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.filter-group-full {
  flex: 2; /* ← search lebih lebar */
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #1e293b;
  outline: none;
  height: 38px;
}

/* Search input dengan icon */
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 16px;
  color: #94a3b8;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  padding: 8px 10px 8px 32px; /* ← kiri lebih lebar untuk icon */
  font-size: 13px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #1e293b;
  outline: none;
  font-family: inherit;
  height: 38px;
  box-sizing: border-box;
}

.filter-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.filter-input::placeholder {
  color: #94a3b8;
}

/* ─── Grid Tabel Container ── */
.history-wrapper {
  padding: 16px;
}

.table-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.table-head {
  display: grid;
  grid-template-columns: 35px 1fr 60px 85px;
  background: #f8fafc;
  padding: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
}

.table-row {
  display: grid;
  grid-template-columns: 35px 1fr 60px 85px;
  padding: 14px 12px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  background: #ffffff;
}

.table-row:last-child {
  border-bottom: none;
}

.col-center {
  text-align: center;
}

.col-index {
  text-align: center;
  font-weight: 600;
  color: #94a3b8;
}

.col-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 6px;
}

.row-resi {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.2px;
}

.row-order {
  font-size: 11px;
  color: #94a3b8;
}

.row-operator {
  font-size: 11.5px;
  color: #475569;
  margin-top: 2px;
}

.row-time {
  font-size: 11px;
  color: #64748b;
}

.col-courier {
  display: flex;
  justify-content: center;
  align-items: center;
}

.table-courier-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  padding: 2px;
}

.col-status {
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-badge-text {
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  text-align: center;
  letter-spacing: 0.3px;
  width: 100%;
}

.status-badge-text.pickup {
  background: #e0f2fe;
  color: #0369a1;
}

.status-badge-text.packing {
  background: #fef3c7;
  color: #b45309;
}

.status-badge-text.unknown {
  background: #f1f5f9;
  color: #64748b;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  text-align: center;
}

.empty-icon {
  font-size: 44px;
  color: #cbd5e1;
  margin-bottom: 8px;
}

.empty-state p,
.loading-state p {
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0 0;
}
</style>