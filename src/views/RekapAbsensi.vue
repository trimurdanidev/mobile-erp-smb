<template>
  <ion-page>
    <ion-header class="rekap-app-header" :translucent="false">
      <ion-toolbar class="rekap-toolbar">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">Rekap Absensi</span>
          <span class="toolbar-subtitle">Filter & lihat riwayat absen</span>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="false">
      <div class="rekap-wrapper">

        <!-- ── Filter Card ──────────────────────────── -->
        <div class="filter-card">
          <div class="filter-card-header">
            <ion-icon :icon="calendarOutline" class="filter-icon"></ion-icon>
            <span class="filter-title">Rentang Tanggal</span>
          </div>

          <!-- Dari Tanggal -->
          <div class="date-row" @click="showPopover = true">
            <div class="date-row-left">
              <ion-icon :icon="calendarNumberOutline" class="date-icon date-start"></ion-icon>
              <div class="date-text-block">
                <span class="date-label">Dari Tanggal</span>
                <span class="date-value" :class="{ 'date-placeholder': !selectedDate }">
                  {{ selectedDate ? formatDate(selectedDate) : "Pilih tanggal awal" }}
                </span>
              </div>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="chevron-icon"></ion-icon>
          </div>

          <!-- Popover Dari -->
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
              <ion-button expand="block" size="small" @click="confirmDate">OK</ion-button>
            </ion-content>
          </ion-popover>

          <div class="date-divider"></div>

          <!-- Sampai Tanggal -->
          <div class="date-row" @click="showPopover2 = true">
            <div class="date-row-left">
              <ion-icon :icon="calendarNumberOutline" class="date-icon date-end"></ion-icon>
              <div class="date-text-block">
                <span class="date-label">Sampai Tanggal</span>
                <span class="date-value" :class="{ 'date-placeholder': !selectedDateEnd }">
                  {{ selectedDateEnd ? formatDate(selectedDateEnd) : "Pilih tanggal akhir" }}
                </span>
              </div>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="chevron-icon"></ion-icon>
          </div>

          <!-- Popover Sampai -->
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
              <ion-button expand="block" size="small" @click="confirmDate2">OK</ion-button>
            </ion-content>
          </ion-popover>

          <!-- Tombol Lihat -->
          <button
            class="lihat-btn"
            :class="{ 'lihat-btn-loading': loading }"
            @click="loadAbsensiRange"
            :disabled="loading"
          >
            <ion-spinner v-if="loading" name="crescent" class="lihat-spinner"></ion-spinner>
            <template v-else>
              <ion-icon :icon="searchOutline" class="lihat-icon"></ion-icon>
              Lihat Rekap
            </template>
          </button>
        </div>

        <!-- ── Result Header ──────────────────────── -->
        <div v-if="absensi.data && absensi.data.length > 0" class="result-header">
          <div class="result-title-row">
            <ion-icon :icon="listOutline" class="result-icon"></ion-icon>
            <span class="result-title">Rekap Data Absen</span>
            <span class="result-count">{{ absensi.data.length }} data</span>
          </div>
          <span class="result-range">
            {{ formatDate(selectedDate) }} — {{ formatDate(selectedDateEnd) }}
          </span>
        </div>

        <!-- ── Empty State ────────────────────────── -->
        <div v-else-if="absensi.data && absensi.data.length === 0" class="empty-state">
          <ion-icon :icon="documentOutline" class="empty-icon"></ion-icon>
          <p class="empty-text">Tidak ada data absensi</p>
          <span class="empty-sub">Coba ubah rentang tanggal</span>
        </div>

        <!-- ── Absensi List ────────────────────────── -->
        <div class="absen-list" v-if="absensi.data && absensi.data.length > 0">
          <div
            v-for="(absen, index) in absensi.data"
            :key="index"
            class="absen-item"
          >
            <!-- Left: Info -->
            <div class="absen-info">
              <!-- Name + Dept Badge -->
              <div class="absen-name-row">
                <span class="absen-name">{{ absen.username }}</span>
                <span class="absen-dept">{{ absen.department }}</span>
              </div>

              <!-- Detail rows -->
              <div class="absen-detail-row">
                <ion-icon :icon="calendarClearOutline" class="detail-icon"></ion-icon>
                <span>{{ absen.date }}</span>
              </div>
              <div class="absen-detail-row">
                <ion-icon :icon="timeOutline" class="detail-icon time-color"></ion-icon>
                <span><strong>Masuk:</strong> {{ absen.time_in }}</span>
              </div>
              <div class="absen-detail-row" v-if="absen.absensi_ref">
                <ion-icon :icon="chatboxOutline" class="detail-icon note-color"></ion-icon>
                <span>{{ absen.absensi_ref }}</span>
              </div>
              <div class="absen-detail-row loc-row" v-if="absen.address_in">
                <ion-icon :icon="locationOutline" class="detail-icon loc-color"></ion-icon>
                <span class="loc-text">{{ absen.address_in }}</span>
              </div>
            </div>

            <!-- Right: Photo -->
            <div class="absen-photo-wrap" v-if="absen.images_in">
              <ion-img
                :src="storageUrl + absen.images_in"
                alt="Foto Absensi"
                class="absen-photo"
              ></ion-img>
            </div>
          </div>
        </div>

      </div>
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
  IonButtons,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonDatetime,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPopover,
  IonText,
  IonSpinner,
} from "@ionic/vue";
import {
  arrowBackOutline,
  calendarOutline,
  calendarNumberOutline,
  calendarClearOutline,
  chevronForwardOutline,
  searchOutline,
  listOutline,
  documentOutline,
  timeOutline,
  locationOutline,
  chatboxOutline,
} from "ionicons/icons";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import { inject } from "vue";

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
const loading = ref(false);

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
  try {
    userData.value = JSON.parse(getUser);
    const response = api.get("/RekapAllAbs/" + userData.value.user);
    absensi.value = (await response).data;

    if (absensi.length > 0) {
      absensi.value.push(...absensi);
      page.value++;
    } else {
      hasMoreData.value = false;
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
  event.target.complete();
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
    loading.value = true;
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
        absensi.value.push(...absensi);
        page.value++;
      } else {
        hasMoreData.value = false;
      }
      showToast(absensi.value.message, "success");
    } catch (error) {
      console.error("Gagal mengambil data absensi:", error);
    } finally {
      loading.value = false;
    }
  }
};

onMounted(() => {});
</script>

<style scoped>
/* ─── Header ────────────────────────────────────── */
.rekap-app-header {
  --background: #1e3a8a;
  background: #1e3a8a;
  box-shadow: none !important;
  border: none !important;
}
.rekap-app-header::after { display: none !important; }

.rekap-toolbar {
  --background: transparent;
  --border-color: transparent;
  --padding-top: 4px;
  --padding-bottom: 4px;
}

.back-btn {
  --color: rgba(255,255,255,0.85);
  --background: rgba(255,255,255,0.12);
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
  color: rgba(255,255,255,0.6);
  font-weight: 500;
}

/* ─── Content ───────────────────────────────────── */
ion-content {
  --background: #f0f4f8;
}

.rekap-wrapper {
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Filter Card ───────────────────────────────── */
.filter-card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}

.filter-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.filter-icon {
  font-size: 18px;
  color: #2563eb;
  background: #eff6ff;
  padding: 6px;
  border-radius: 8px;
}

.filter-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

/* Date Rows */
.date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.date-row:active { background: #f8fafc; }

.date-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-icon {
  font-size: 20px;
  padding: 7px;
  border-radius: 10px;
  flex-shrink: 0;
}

.date-start { color: #2563eb; background: #eff6ff; }
.date-end   { color: #7c3aed; background: #f5f3ff; }

.date-text-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.date-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.date-placeholder {
  color: #94a3b8;
  font-weight: 400;
  font-size: 13px;
}

.chevron-icon {
  font-size: 16px;
  color: #cbd5e1;
}

.date-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0 16px;
}

/* Lihat Button */
.lihat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: calc(100% - 32px);
  margin: 14px 16px 16px;
  padding: 14px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37,99,235,0.28);
  transition: transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}
.lihat-btn:active:not(.lihat-btn-loading) { transform: scale(0.97); }
.lihat-btn-loading { opacity: 0.75; cursor: not-allowed; }

.lihat-icon { font-size: 18px; }
.lihat-spinner { --color: #ffffff; width: 18px; height: 18px; }

/* ─── Result Header ─────────────────────────────── */
.result-header {
  padding: 4px 4px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-icon {
  font-size: 16px;
  color: #2563eb;
}

.result-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  flex: 1;
}

.result-count {
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 3px 10px;
  border-radius: 20px;
}

.result-range {
  font-size: 12px;
  color: #94a3b8;
  padding-left: 24px;
}

/* ─── Empty State ───────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  gap: 8px;
}

.empty-icon { font-size: 44px; color: #cbd5e1; }
.empty-text { font-size: 15px; font-weight: 700; color: #64748b; margin: 0; }
.empty-sub  { font-size: 12px; color: #94a3b8; margin: 0; }

/* ─── Absensi List ──────────────────────────────── */
.absen-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.absen-item {
  background: #ffffff;
  border-radius: 18px;
  padding: 14px 14px 14px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* Info side */
.absen-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.absen-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.absen-name {
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
}

.absen-dept {
  font-size: 10px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

/* Detail rows */
.absen-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #475569;
}

.detail-icon {
  font-size: 14px;
  color: #94a3b8;
  flex-shrink: 0;
  margin-top: 1px;
}

.time-color { color: #2563eb; }
.note-color { color: #7c3aed; }
.loc-color  { color: #16a34a; }

.loc-row { align-items: flex-start; }

.loc-text {
  line-height: 1.4;
  color: #64748b;
  font-size: 11px;
}

/* Photo side */
.absen-photo-wrap {
  flex-shrink: 0;
}

.absen-photo {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid #f1f5f9;
}
</style>