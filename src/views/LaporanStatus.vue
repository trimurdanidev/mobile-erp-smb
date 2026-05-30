<template>
  <ion-page>
    <ion-header class="app-header" :translucent="false">
      <div class="header-card">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="header-text">
          <span class="header-title">Laporan By Process</span>
          <span class="header-sub">Laporan resi berdasarkan status proses</span>
        </div>
      </div>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-wrapper">
        <!-- ── Filter Card ─────────────────────────── -->
        <div class="filter-card">
          <!-- Pilih Process -->
          <div class="filter-group">
            <label class="filter-label">
              <ion-icon :icon="personCircleOutline"></ion-icon>
              Pilih Process
            </label>
            <div class="select-wrapper">
              <select v-model="selectedProcess" class="filter-select">
                <option value="">Semua</option>
                <option
                  v-for="p in processList"
                  :key="p.value"
                  :value="p.value"
                >
                  {{ p.label }}
                </option>
              </select>
              <ion-icon
                :icon="chevronDownOutline"
                class="select-icon"
              ></ion-icon>
            </div>
          </div>

          <!-- Pilih Ekspedisi -->
          <div class="filter-group">
            <label class="filter-label">
              <ion-icon :icon="cubeOutline"></ion-icon>
              Pilih Ekspedisi
            </label>
            <div class="select-wrapper">
              <select v-model="selectedEkspedisi" class="filter-select">
                <option value="">Silahkan pilih</option>
                <option v-for="e in ekspedisiList" :key="e.id" :value="e.id">
                  {{ e.name }}
                </option>
              </select>
              <ion-icon
                :icon="chevronDownOutline"
                class="select-icon"
              ></ion-icon>
            </div>
          </div>

          <!-- Date Range -->
          <div class="date-row">
            <div class="filter-group half">
              <label class="filter-label">
                <ion-icon :icon="calendarOutline"></ion-icon>
                Start Date
              </label>
              <div class="date-input-wrap" @click="openStartDate">
                <span class="date-display">{{
                  formatDateDisplay(startDate)
                }}</span>
                <ion-icon :icon="calendarOutline" class="date-icon"></ion-icon>
              </div>
              <input
                type="date"
                ref="startDateRef"
                v-model="startDate"
                class="date-hidden"
              />
            </div>
            <div class="filter-group half">
              <label class="filter-label">
                <ion-icon :icon="calendarOutline"></ion-icon>
                End Date
              </label>
              <div class="date-input-wrap" @click="openEndDate">
                <span class="date-display">{{
                  formatDateDisplay(endDate)
                }}</span>
                <ion-icon :icon="calendarOutline" class="date-icon"></ion-icon>
              </div>
              <input
                type="date"
                ref="endDateRef"
                v-model="endDate"
                class="date-hidden"
              />
            </div>
          </div>

          <!-- Tombol Proses -->
          <button class="btn-proses" @click="loadLaporan" :disabled="isLoading">
            <ion-icon
              v-if="isLoading"
              :icon="refreshOutline"
              class="spin"
            ></ion-icon>
            <span>{{ isLoading ? "Memproses..." : "PROSES" }}</span>
          </button>
        </div>

        <!-- ── Hasil Laporan ───────────────────────── -->
        <div v-if="hasResult" class="result-card">
          <div class="result-meta">
            <span class="result-period"
              >{{ formatDate(startDate) }} – {{ formatDate(endDate) }}</span
            >
            <span class="result-total"
              >Total Resi : <strong>{{ totalResi }}</strong></span
            >
          </div>

          <div class="table-wrap">
            <div class="table-head">
              <span class="col-no">No</span>
              <span class="col-proses">Proses</span>
              <span class="col-eksp">Ekspedisi</span>
              <span class="col-jml">Jumlah Resi</span>
            </div>

            <template v-for="(group, gi) in groupedData" :key="gi">
              <div class="table-row row-group">
                <span class="col-no">{{ gi + 1 }}</span>
                <span class="col-proses proses-name">{{ group.status }}</span>
                <span class="col-eksp"></span>
                <span class="col-jml jml-bold">{{ group.total }}</span>
              </div>
              <div
                v-for="(sub, si) in group.items"
                :key="si"
                class="table-row row-sub"
              >
                <span class="col-no"></span>
                <span class="col-proses"></span>
                <span class="col-eksp">{{ sub.ekspedisi }}</span>
                <span class="col-jml">{{ sub.jumlah }}</span>
              </div>
              <div class="row-divider"></div>
            </template>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!isLoading && searched" class="empty-state">
          <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
          <p>Tidak ada data ditemukan</p>
        </div>
      </div>
    </ion-content>

    <!-- ── Download Bar ───────────────────────────── -->
    <div v-if="hasResult" class="download-bar">
      <button class="btn-download" @click="downloadLaporan">
        <ion-icon :icon="downloadOutline"></ion-icon>
        Download Laporan
      </button>
    </div>
  </ion-page>
</template>

<script>
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonIcon,
  IonButtons,
  IonButton,
} from "@ionic/vue";
import {
  arrowBackOutline,
  calendarOutline,
  chevronDownOutline,
  cubeOutline,
  personCircleOutline,
  refreshOutline,
  downloadOutline,
  documentTextOutline,
} from "ionicons/icons";
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";

export default {
  components: {
    IonPage,
    IonHeader,
    IonContent,
    IonIcon,
    IonButtons,
    IonButton,
  },
  setup() {
    const today = new Date();
    const toDateStr = (d) =>
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");

    const startDate = ref(toDateStr(today));
    const endDate = ref(toDateStr(today));
    const selectedProcess = ref("");
    const selectedEkspedisi = ref("");
    const isLoading = ref(false);
    const searched = ref(false);
    const laporanData = ref([]);
    const ekspedisiList = ref([]);
    const processList = ref([]);
    const totalResiFromApi = ref(0);

    const startDateRef = ref(null);
    const endDateRef = ref(null);

    const openStartDate = () => {
      if (startDateRef.value) {
        startDateRef.value.showPicker
          ? startDateRef.value.showPicker()
          : startDateRef.value.click();
      }
    };
    const openEndDate = () => {
      if (endDateRef.value) {
        endDateRef.value.showPicker
          ? endDateRef.value.showPicker()
          : endDateRef.value.click();
      }
    };

    const totalResi = computed(() => totalResiFromApi.value);
    const groupedData = computed(() => laporanData.value);
    const hasResult = computed(
      () => searched.value && laporanData.value.length > 0
    );

    const bulan = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const formatDate = (str) => {
      if (!str) return "";
      const [y, m, d] = str.split("-");
      return `${d} ${bulan[parseInt(m) - 1]} ${y}`;
    };

    const formatDateDisplay = (str) => {
      if (!str) return "Pilih tanggal";
      const [y, m, d] = str.split("-");
      return `${d} ${bulan[parseInt(m) - 1]} ${y}`;
    };

    const loadResiStatus = async () => {
      try {
        const res = await api.get("/resi/getListResiStatus");
        processList.value = res.data.data || [];
      } catch (e) {
        showToast("Gagal memuat daftar status proses", "danger");
      }
    };

    const loadEkspedisi = async () => {
      try {
        const res = await api.get("/getListEkspedisi");
        ekspedisiList.value = res.data.data || [];
      } catch (e) {
        showToast("Gagal memuat daftar ekspedisi", "danger");
      }
    };

    const loadLaporan = async () => {
      isLoading.value = true;
      searched.value = false;
      try {
        const params = {
          start_date: startDate.value,
          end_date: endDate.value,
          process: selectedProcess.value || undefined,
          ekspedisi: selectedEkspedisi.value || undefined,
        };
        const res = await api.get("/resi/getLaporanByStatus", { params });
        laporanData.value = res.data.data || [];
        totalResiFromApi.value = res.data.total_resi || 0;
        searched.value = true;
      } catch (e) {
        await showToast("Gagal memuat laporan", "danger");
        searched.value = true;
      } finally {
        isLoading.value = false;
      }
    };

    const downloadLaporan = async () => {
      await showToast("Fitur download belum tersedia", "primary");
    };

    onMounted(() => {
      loadResiStatus();
      loadEkspedisi();
    });

    return {
      startDate,
      endDate,
      startDateRef,
      endDateRef,
      openStartDate,
      openEndDate,
      selectedProcess,
      selectedEkspedisi,
      processList,
      ekspedisiList,
      isLoading,
      searched,
      hasResult,
      laporanData,
      groupedData,
      totalResi,
      loadLaporan,
      downloadLaporan,
      formatDate,
      formatDateDisplay,
      arrowBackOutline,
      calendarOutline,
      chevronDownOutline,
      cubeOutline,
      personCircleOutline,
      refreshOutline,
      downloadOutline,
      documentTextOutline,
    };
  },
};
</script>

<style scoped>
.app-header {
  --background: #1e3a8a;
  background: #1e3a8a !important;
  box-shadow: none !important;
  border: none !important;
}
.app-header::after {
  display: none !important;
}

.header-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 16px;
  padding-top: calc(20px + var(--ion-safe-area-top, 20px));
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
}
.back-btn ion-icon {
  font-size: 20px;
  color: #fff;
}
.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.header-title {
  font-size: 17px;
  font-weight: 800;
  color: #fff;
}
.header-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

ion-content {
  --background: #f0f4f8;
}
ion-content::part(scroll) {
  background: #f0f4f8;
}

.page-wrapper {
  padding: 16px 16px 120px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Filter Card ───────────────────────────────── */
.filter-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-group.half {
  flex: 1;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a8a;
}
.filter-label ion-icon {
  font-size: 16px;
}

.select-wrapper {
  position: relative;
}
.filter-select {
  width: 100%;
  padding: 12px 36px 12px 14px;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 12px;
  font-size: 14px;
  color: #1e293b;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
}
.filter-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #94a3b8;
  pointer-events: none;
}

/* ─── Date Input ────────────────────────────────── */
.date-row {
  display: flex;
  gap: 10px;
}

.date-input-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s;
  user-select: none;
}
.date-input-wrap:active {
  border-color: #2563eb;
}
.date-display {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}
.date-icon {
  font-size: 16px;
  color: #2563eb;
  flex-shrink: 0;
}

.date-hidden {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

/* ─── Tombol Proses ─────────────────────────────── */
.btn-proses {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-proses:disabled {
  opacity: 0.6;
}
.btn-proses:active {
  opacity: 0.85;
}

.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ─── Result Card ───────────────────────────────── */
.result-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}
.result-meta {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 1px solid #f1f5f9;
}
.result-period {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.result-total {
  font-size: 13px;
  color: #64748b;
}
.result-total strong {
  color: #2563eb;
  font-weight: 700;
}

/* ─── Table ─────────────────────────────────────── */
.table-wrap {
  padding-bottom: 8px;
}
.table-head {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 80px;
  padding: 10px 16px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
}
.table-row {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 80px;
  padding: 10px 16px;
  align-items: center;
}
.row-group {
  background: #fafafa;
}
.row-sub {
  background: #fff;
}
.row-divider {
  height: 0;
  margin: 0 16px;
  border-top: 1px dashed #cbd5e1;
}

.col-no {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}
.col-proses {
  font-size: 13px;
  color: #334155;
  padding-right: 8px;
}
.proses-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}
.col-eksp {
  font-size: 13px;
  color: #64748b;
}
.col-jml {
  font-size: 13px;
  color: #334155;
  text-align: right;
}
.jml-bold {
  font-weight: 800;
  font-size: 15px;
  color: #2563eb;
}

/* ─── Empty State ───────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 12px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}
.empty-icon {
  font-size: 48px;
  color: #cbd5e1;
}
.empty-state p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

/* ─── Download Bar ──────────────────────────────── */
.download-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + var(--ion-safe-area-bottom, 0px));
  background: #fff;
  border-top: 1px solid #f1f5f9;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  z-index: 100;
}
.btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-download ion-icon {
  font-size: 18px;
}
.btn-download:active {
  opacity: 0.85;
}
</style>