<template>
  <ion-page>
    <ion-header class="app-header" :translucent="false">
      <HomeHeader />
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content
          pulling-icon="chevron-down-circle-outline"
          refreshing-spinner="crescent"
        ></ion-refresher-content>
      </ion-refresher>

      <div class="home-wrapper">
        <!-- ── Menu Utama ──────────────────────────── -->
        <div class="section-label">Menu Utama</div>
        <div class="action-grid">
          <!-- Absen Masuk -->
          <button
            class="action-card"
            @click="goTo('in')"
            aria-label="Absen Masuk"
          >
            <div class="action-icon-wrap absen-icon-bg">
              <ion-icon :icon="logInOutline"></ion-icon>
            </div>
            <span class="action-title">Absen Masuk</span>
          </button>

          <!-- Rekap Absensi -->
          <button
            class="action-card"
            @click="goTo('rekap')"
            aria-label="Rekap Absensi"
          >
            <div class="action-icon-wrap rekap-icon-bg">
              <ion-icon :icon="documentTextOutline"></ion-icon>
            </div>
            <span class="action-title">Rekap Absensi</span>
          </button>

          <!-- ERP SMB Web -->
          <button
            class="action-card action-card-wide"
            @click="openErpWeb"
            aria-label="ERP SMB Web"
          >
            <div class="action-icon-wrap erp-icon-bg">
              <ion-icon :icon="globeOutline"></ion-icon>
            </div>
            <span class="action-title">ERP SMB Web</span>
            <span class="action-sub">Buka di browser</span>
          </button>
        </div>

        <!-- ── Ranking Section ────────────────────── -->
        <div class="ranking-card">
          <div class="ranking-header">
            <div class="ranking-title-row">
              <ion-icon :icon="starOutline" class="star-icon"></ion-icon>
              <span class="ranking-title">Ranking Absensi</span>
            </div>
            <span class="ranking-period">{{ tamBulan }} {{ tahun }}</span>
          </div>

          <!-- Empty State -->
          <div v-if="dataArray.length === 0" class="empty-state">
            <ion-icon :icon="peopleOutline" class="empty-icon"></ion-icon>
            <p>Belum ada data ranking</p>
          </div>

          <!-- Table -->
          <div v-else class="table-wrapper">
            <div class="table-head">
              <span class="col-no">#</span>
              <span class="col-name">Nama</span>
              <span class="col-avg">Avg Absen</span>
              <span class="col-dept">Bagian</span>
            </div>
            <div class="table-scroll">
              <div
                v-for="(item, index) in dataArray"
                :key="index"
                class="table-row"
                :class="{ 'top-three': index < 3 }"
              >
                <span class="col-no">
                  <span v-if="index === 0" class="medal medal-gold">1</span>
                  <span v-else-if="index === 1" class="medal medal-silver"
                    >2</span
                  >
                  <span v-else-if="index === 2" class="medal medal-bronze"
                    >3</span
                  >
                  <span v-else class="rank-num">{{ index + 1 }}</span>
                </span>
                <span class="col-name">{{ item.namaKaryawan }}</span>
                <span class="col-avg">
                  <span class="avg-badge">{{ item.rataJamMasuk }}</span>
                </span>
                <span class="col-dept">{{ item.bagian }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonItem,
  IonList,
} from "@ionic/vue";
import {
  logInOutline,
  logOutOutline,
  documentTextOutline,
  starOutline,
  peopleOutline,
  globeOutline,
} from "ionicons/icons";
import { onMounted, ref } from "vue";
import api from "@/services/api";
import HomeHeader from "../views/HomeHeader.vue";
import TabsPage from "../views/TabsPage.vue";
import { checkToken } from "@/services/auth";
import { showToast } from "@/services/toastHandlers";
import { Browser } from "@capacitor/browser";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    HomeHeader,
    TabsPage,
    IonItem,
    IonList,
  },
  setup() {
    const router = useRouter();
    const absenMasuk = ref(null);
    const userData = ref([]);
    const getUser = localStorage.getItem("master_user");
    const Tanggal = ref("");
    const today = new Date();
    const ff = ref(null);
    const disableButtonPulang = ref(true);
    const disableButtonMasuk = ref(false);
    const menu = ref(null);
    const arrayRangking = ref([]);
    const dataArray = ref([]);
    const month = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const tamBulan = month[today.getMonth()];
    const tahun = today.getFullYear();

    const handleRefresh = (event) => {
      setTimeout(() => {
        window.location.reload();
        event.target.complete();
      }, 1000);
    };

    Tanggal.value =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      today.getDate();

    const loadAbsensi = async () => {
      try {
        userData.value = JSON.parse(getUser);
        const response = api.get(
          "/getAbsenUser/" + userData.value.user + "/" + Tanggal.value
        );
        const parsedAbsenMasuk = (await response).data;
        absenMasuk.value = JSON.stringify(parsedAbsenMasuk.data);
        ff.value = JSON.parse(absenMasuk.value);
      } catch (error) {
        console.error("Gagal memuat data absensi:", error);
      }
    };

    const getRangking = async () => {
      try {
        const response = await api.get(
          "/showAbsTop/" + today.getFullYear() + "/" + (today.getMonth() + 1)
        );
        arrayRangking.value = response.data.data;
        dataArray.value = arrayRangking.value.map((d) => ({
          no: d["No"],
          namaKaryawan: d["Nama Karyawan"],
          bagian: d["Bagian"],
          periode: d["Periode"],
          rataJamMasuk: d["Rata-Rata Jam Masuk"],
          jumlahHariMasuk: d["Jumlah Hari Masuk"],
        }));
      } catch (error) {
        console.error("Gagal Mengambil Data", error.message);
      }
    };

    const RefreshData = async (event) => {
      setTimeout(() => {
        window.location.reload();
        if (event) event.target.complete();
      }, 2000);
    };

    const goTo = (menu) => {
      router.replace(`/${menu}`);
    };

    // ── ERP SMB Web ──────────────────────────────
    const openErpWeb = async () => {
      try {
        const parsedUser = JSON.parse(getUser);
        const username = parsedUser.user;
        const password = parsedUser.password;

        const url =
          `https://erpsmb.cloud/index.php?model=login&action=checkLogin` +
          `&user=${encodeURIComponent(username)}` +
          `&password=${encodeURIComponent(password)}`;

        // Gunakan Capacitor Browser agar terbuka di browser HP
        await Browser.open({ url, windowName: "_system" });
      } catch (error) {
        console.error("Gagal membuka ERP SMB Web:", error);
        await showToast("Gagal membuka ERP SMB Web", "danger");
      }
    };

    const refreshPage = () => {
      router.go(0);
    };

    onMounted(() => {
      loadAbsensi();
      checkToken();
      getRangking();
      if (ff.value) {
        disableButtonMasuk.value = true;
      }
    });

    return {
      goTo,
      openErpWeb,
      logInOutline,
      logOutOutline,
      documentTextOutline,
      starOutline,
      peopleOutline,
      globeOutline,
      userData,
      TabsPage,
      Tanggal,
      disableButtonPulang,
      disableButtonMasuk,
      RefreshData,
      IonRefresher,
      IonRefresherContent,
      handleRefresh,
      IonList,
      IonItem,
      arrayRangking,
      dataArray,
      tamBulan,
      tahun,
    };
  },
};
</script>

<style scoped>
/* ─── Base ─────────────────────────────────────── */
ion-page {
  --background: #f0f4f8;
  --ion-background-color: #f0f4f8;
  background: #f0f4f8 !important;
}

.app-header {
  --background: #1e3a8a;
  --ion-background-color: #1e3a8a;
  background: #1e3a8a !important;
  box-shadow: none !important;
  border: none !important;
}
.app-header::after {
  display: none !important;
}
.app-header::before {
  display: none !important;
}

ion-content {
  --background: #f0f4f8;
  --ion-background-color: #f0f4f8;
  --padding-top: 0px;
  --offset-top: 0px;
}

/* Paksa semua area di dalam ion-page jadi abu muda */
ion-content::part(scroll) {
  background: #f0f4f8;
}

/* ─── Wrapper ───────────────────────────────────── */
.home-wrapper {
  padding: 20px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f0f4f8;
  min-height: 100%;
}

/* ─── Section Label ─────────────────────────────── */
.section-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #8a9bb0;
  padding-left: 4px;
  margin-bottom: -10px;
}

/* ─── Action Grid ───────────────────────────────── */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* Card normal (2 kolom) */
.action-card {
  background: #ffffff;
  border: none;
  border-radius: 20px;
  padding: 20px 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  -webkit-tap-highlight-color: transparent;
}

.action-card:active {
  transform: scale(0.96);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}

/* ERP Web — full width (span 2 kolom) */
.action-card-wide {
  grid-column: 1 / -1;
  flex-direction: row;
  justify-content: flex-start;
  gap: 16px;
  padding: 18px 20px;
  background: linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%);
  position: relative;
  overflow: hidden;
}

/* Shimmer effect di belakang ERP card */
.action-card-wide::before {
  content: "";
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 50%;
}

.action-card-wide::after {
  content: "";
  position: absolute;
  bottom: -20px;
  right: 40px;
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.action-card-wide .action-icon-wrap {
  background: rgba(255, 255, 255, 0.15) !important;
  flex-shrink: 0;
}

.action-card-wide .action-icon-wrap ion-icon {
  color: #ffffff;
}

.action-card-wide .action-title {
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  text-align: left;
}

.action-card-wide .action-sub {
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  font-weight: 500;
  text-align: left;
  margin-top: -4px;
}

/* Teks block untuk wide card */
.action-card-wide > div:not(.action-icon-wrap) {
  display: flex;
  flex-direction: column;
}

/* ─── Icon Wraps ────────────────────────────────── */
.action-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon-wrap ion-icon {
  font-size: 28px;
  color: #fff;
}

.absen-icon-bg {
  background: linear-gradient(135deg, #4a90e2, #2563eb);
}

.rekap-icon-bg {
  background: linear-gradient(135deg, #6c757d, #495057);
}

.erp-icon-bg {
  background: rgba(255, 255, 255, 0.15);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
}

.action-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  text-align: center;
  line-height: 1.3;
}

.action-sub {
  display: none; /* hanya tampil di wide card via override di atas */
}

/* ─── Ranking Card ──────────────────────────────── */
.ranking-card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}

.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.ranking-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.star-icon {
  font-size: 18px;
  color: #f59e0b;
}

.ranking-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.ranking-period {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 20px;
}

/* ─── Table ─────────────────────────────────────── */
.table-wrapper {
  padding: 0 0 8px;
}

.table-head {
  display: grid;
  grid-template-columns: 36px 1fr 90px 80px;
  padding: 10px 18px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
}

.table-scroll {
  max-height: 300px;
  overflow-y: auto;
}
.table-scroll::-webkit-scrollbar {
  width: 4px;
}
.table-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.table-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}

.table-row {
  display: grid;
  grid-template-columns: 36px 1fr 90px 80px;
  padding: 12px 18px;
  align-items: center;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.15s ease;
}
.table-row:last-child {
  border-bottom: none;
}
.table-row:hover {
  background: #f8fafc;
}

.col-no {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.col-name {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

.col-avg {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
}

.avg-badge {
  background: #f0f9ff;
  color: #0284c7;
  font-weight: 600;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.col-dept {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Medals ────────────────────────────────────── */
.medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
}
.medal-gold {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.medal-silver {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}
.medal-bronze {
  background: linear-gradient(135deg, #c97c3a, #a0522d);
}
.rank-num {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

/* ─── Empty State ───────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  gap: 10px;
}
.empty-icon {
  font-size: 40px;
  color: #cbd5e1;
}
.empty-state p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* ─── Responsive ────────────────────────────────── */
@media (max-width: 360px) {
  .table-head,
  .table-row {
    grid-template-columns: 30px 1fr 78px 64px;
    padding-left: 12px;
    padding-right: 12px;
  }
}
</style>

<!-- Override global Ionic background tanpa scoped -->
<style>
/* Khusus halaman ini: matikan semua background gelap Ionic */
.ion-page,
ion-app > .ion-page {
  --ion-background-color: #f0f4f8;
}
</style>