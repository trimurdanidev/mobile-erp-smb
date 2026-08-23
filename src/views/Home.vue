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
        <!-- ── Menu Utama ── -->
        <div class="action-grid">
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
          <!-- Jadwal Kerja -->
          <button
            class="action-card"
            @click="goTo('jadwal')"
            aria-label="Jadwal Kerja"
          >
            <div class="action-icon-wrap jadwal-icon-bg">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <span class="action-title">Jadwal Kerja</span>
          </button>

          <button
            v-if="showScanResi"
            class="action-card"
            @click="goTo('scan-resi')"
            aria-label="Scan Resi"
          >
            <div class="action-icon-wrap resi-icon-bg">
              <ion-icon :icon="barcodeOutline"></ion-icon>
            </div>
            <span class="action-title">Scan Resi</span>
          </button>

          <button
            v-if="showScanPacking"
            class="action-card"
            @click="goTo('scan-packing')"
            aria-label="Scan Packing"
          >
            <div class="action-icon-wrap packing-icon-bg">
              <ion-icon :icon="cubeOutline"></ion-icon>
            </div>
            <span class="action-title">Scan Packing</span>
          </button>

          <button
            class="action-card"
            @click="goTo('history-scan')"
            aria-label="Riwayat Scan Resi"
          >
            <div class="action-icon-wrap history-icon-bg">
              <ion-icon :icon="timeOutline"></ion-icon>
            </div>
            <span class="action-title">Riwayat Scan</span>
          </button>
          <button
            v-if="showLaporan"
            class="action-card"
            @click="openLaporan"
            aria-label="Laporan"
          >
            <div class="action-icon-wrap laporan-icon-bg">
              <ion-icon :icon="barChartOutline"></ion-icon>
            </div>
            <span class="action-title">Laporan</span>
          </button>

          <button
            class="action-card action-card-wide"
            @click="openErpWeb"
            aria-label="ERP SMB Web"
          >
            <div class="action-icon-wrap erp-icon-bg">
              <ion-icon :icon="globeOutline"></ion-icon>
            </div>
            <div class="erp-text">
              <span class="action-title erp-title">ERP SMB Web</span>
              <span class="erp-sub">Buka di browser</span>
            </div>
          </button>
        </div>

        <!-- ── Dual Dashboard Cards ── -->
        <div class="dual-section">
          <!-- Floating arrow kiri -->
          <button
            v-if="activeSlide === 1"
            class="carousel-arrow carousel-arrow-left"
            @click="goToSlide(0)"
            aria-label="Sebelumnya"
          >
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </button>

          <!-- Floating arrow kanan -->
          <button
            v-if="activeSlide === 0"
            class="carousel-arrow carousel-arrow-right"
            @click="goToSlide(1)"
            aria-label="Berikutnya"
          >
            <ion-icon :icon="chevronForwardOutline"></ion-icon>
          </button>

          <!-- Track carousel -->
          <div
            class="dual-scroll"
            ref="carouselRef"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
          >
            <!-- Card Ranking Absensi -->
            <div class="dash-card">
              <div class="dash-card-header">
                <div class="dash-header-left">
                  <div class="dash-icon star-bg">
                    <ion-icon :icon="starOutline"></ion-icon>
                  </div>
                  <div class="dash-header-text">
                    <span class="dash-card-title">Ranking Absensi</span>
                    <span class="dash-card-sub"
                      >{{ tamBulan }} {{ tahun }}</span
                    >
                  </div>
                </div>
              </div>

              <div v-if="dataArray.length === 0" class="dash-empty">
                <ion-icon
                  :icon="peopleOutline"
                  class="dash-empty-icon"
                ></ion-icon>
                <p>Belum ada data ranking</p>
              </div>

              <div v-else class="rank-table-wrap">
                <div class="rank-head">
                  <span class="rh-no">#</span>
                  <span class="rh-name">Nama</span>
                  <span class="rh-avg">Avg Masuk</span>
                </div>
                <div class="rank-scroll">
                  <div
                    v-for="(item, index) in dataArray.slice(0, 10)"
                    :key="index"
                    class="rank-row"
                    :class="{ 'rank-top3': index < 3 }"
                  >
                    <span class="rh-no">
                      <span v-if="index === 0" class="medal medal-gold">1</span>
                      <span v-else-if="index === 1" class="medal medal-silver"
                        >2</span
                      >
                      <span v-else-if="index === 2" class="medal medal-bronze"
                        >3</span
                      >
                      <span v-else class="rank-plain">{{ index + 1 }}</span>
                    </span>
                    <div class="rh-name name-col">
                      <span class="name-main">{{ item.namaKaryawan }}</span>
                      <span class="name-dept">{{ item.bagian }}</span>
                    </div>
                    <span class="rh-avg">
                      <span class="avg-badge">{{ item.rataJamMasuk }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Stok Aktual -->
            <div class="dash-card">
              <div class="dash-card-header">
                <div class="dash-header-left">
                  <div class="dash-icon stock-bg">
                    <ion-icon :icon="cubeOutline"></ion-icon>
                  </div>
                  <div class="dash-header-text">
                    <span class="dash-card-title">Stok Aktual</span>
                    <span class="dash-card-sub" v-if="!stockLoading"
                      >{{ stockAll.length }} produk</span
                    >
                  </div>
                </div>
                <button class="btn-lihat-semua" @click="goTo('stok-detail')">
                  Lihat Semua
                  <ion-icon :icon="chevronForwardOutline"></ion-icon>
                </button>
              </div>

              <!-- Mini search -->
              <div class="stok-search-wrap">
                <ion-icon
                  :icon="searchOutline"
                  class="stok-search-icon"
                ></ion-icon>
                <input
                  v-model="stockSearch"
                  type="text"
                  class="stok-search-input"
                  placeholder="Cari produk..."
                  @input="onStockSearch"
                />
                <button
                  v-if="stockSearch"
                  class="stok-search-clear"
                  @click="clearStockSearch"
                >
                  <ion-icon :icon="closeCircleOutline"></ion-icon>
                </button>
              </div>

              <!-- Skeleton -->
              <div v-if="stockLoading" class="stok-skeleton">
                <div v-for="n in 4" :key="n" class="skel-row">
                  <div class="skel skel-name"></div>
                  <div class="skel skel-qty"></div>
                </div>
              </div>

              <!-- Empty -->
              <div v-else-if="stockFiltered.length === 0" class="dash-empty">
                <ion-icon
                  :icon="searchOutline"
                  class="dash-empty-icon"
                ></ion-icon>
                <p>Tidak ada produk cocok</p>
              </div>

              <!-- List -->
              <div v-else class="stok-mini-list">
                <div
                  v-for="(item, idx) in stockFiltered.slice(0, 7)"
                  :key="item.id"
                  class="stok-row"
                  :class="{ 'stok-row-low': item.qty_stock <= 5 }"
                >
                  <div class="stok-row-left">
                    <span class="stok-no">{{ idx + 1 }}</span>
                    <div class="stok-info">
                      <span class="stok-name">{{ item.nm_product }}</span>
                      <span class="stok-code">{{
                        item.kd_product || item.kd_product_universal || "-"
                      }}</span>
                      <span class="stok-updated"
                        >🕒Terakhir Update:
                        {{ formatStokDate(item.updated_at) }}</span
                      >
                    </div>
                  </div>
                  <div class="stok-row-right">
                    <span
                      class="qty-badge"
                      :class="stockQtyClass(item.qty_stock)"
                      >{{ item.qty_stock }}</span
                    >
                    <span class="qty-unit">pcs</span>
                  </div>
                </div>
                <button class="stok-footer-btn" @click="goTo('stok-detail')">
                  <ion-icon :icon="arrowForwardCircleOutline"></ion-icon>
                  Lihat semua {{ stockAll.length }} produk
                </button>
              </div>
            </div>
          </div>

          <!-- Dot indicator -->
          <div class="carousel-dots">
            <button
              v-for="(_, i) in 2"
              :key="i"
              class="carousel-dot"
              :class="{ 'carousel-dot-active': activeSlide === i }"
              @click="goToSlide(i)"
            ></button>
          </div>
        </div>
        <!-- end dual section -->
      </div>

      <!-- Modal Laporan -->
      <div v-if="showLaporanModal" class="modal-overlay" @click="closeLaporan">
        <div class="modal-sheet" @click.stop>
          <div class="modal-handle"></div>
          <div class="modal-title">Pilih Laporan</div>

          <button class="modal-item" @click="goToLaporan('laporan-status')">
            <div class="modal-icon-wrap status-icon-bg">
              <ion-icon :icon="listOutline"></ion-icon>
            </div>
            <div class="modal-item-text">
              <span class="modal-item-title">Laporan Resi by Status</span>
              <span class="modal-item-sub"
                >Laporan berdasarkan status proses</span
              >
            </div>
            <ion-icon
              :icon="chevronForwardOutline"
              class="modal-chevron"
            ></ion-icon>
          </button>

          <button class="modal-item" @click="goToLaporan('laporan-admin')">
            <div class="modal-icon-wrap admin-icon-bg">
              <ion-icon :icon="personOutline"></ion-icon>
            </div>
            <div class="modal-item-text">
              <span class="modal-item-title">Laporan Resi by Admin</span>
              <span class="modal-item-sub">Laporan berdasarkan admin/user</span>
            </div>
            <ion-icon
              :icon="chevronForwardOutline"
              class="modal-chevron"
            ></ion-icon>
          </button>

          <button class="modal-cancel" @click="closeLaporan">Batal</button>
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
  calendarOutline,
  barcodeOutline,
  cubeOutline,
  timeOutline,
  barChartOutline,
  listOutline,
  personOutline,
  chevronForwardOutline,
  chevronBackOutline,
  searchOutline,
  closeCircleOutline,
  arrowForwardCircleOutline,
} from "ionicons/icons";
import { onMounted, onUnmounted, ref, computed } from "vue";
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

    const parsedUser = getUser ? JSON.parse(getUser) : {};
    const deptName = (parsedUser.department_name || "").toLowerCase();
    const deptCode = (parsedUser.department_code || "").toUpperCase();
    const showScanResi = [
      "DPT001",
      "DPT002",
      "DPT005",
      "DPT006",
      "DPT007",
    ].includes(deptCode);
    const showScanPacking = [
      "DPT001",
      "DPT002",
      "DPT005",
      "DPT006",
      "DPT007",
      "DPT008",
    ].includes(deptCode);

    const showLaporan = ["DPT005", "DPT006", "DPT007"].includes(deptCode);

    // Modal laporan
    const showLaporanModal = ref(false);
    const openLaporan = () => {
      showLaporanModal.value = true;
    };
    const closeLaporan = () => {
      showLaporanModal.value = false;
    };
    const goToLaporan = (type) => {
      showLaporanModal.value = false;
      router.replace(`/${type}`);
    };

    // ── Carousel state ─────────────────────────────
    const activeSlide = ref(0);
    const carouselRef = ref(null);
    let touchStartX = 0;
    let touchStartY = 0;
    let autoSlideTimer = null;

    const goToSlide = (idx) => {
      activeSlide.value = idx;
      if (carouselRef.value) {
        const cardWidth =
          carouselRef.value.querySelector(".dash-card")?.offsetWidth || 0;
        const gap = 12;
        carouselRef.value.scrollTo({
          left: idx * (cardWidth + gap),
          behavior: "smooth",
        });
      }
      // Reset auto-slide timer setiap kali user navigasi manual
      resetAutoSlide();
    };

    const onTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      // Hanya block scroll vertikal kalau swipe horizontal lebih dominan
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0 && activeSlide.value < 1) goToSlide(1);
        if (dx > 0 && activeSlide.value > 0) goToSlide(0);
      }
    };

    // Auto-slide setiap 10 detik kalau tidak ada interaksi
    const startAutoSlide = () => {
      autoSlideTimer = setInterval(() => {
        goToSlide(activeSlide.value === 0 ? 1 : 0);
      }, 10000);
    };

    const resetAutoSlide = () => {
      if (autoSlideTimer) clearInterval(autoSlideTimer);
      startAutoSlide();
    };

    // Stock
    const stockAll = ref([]);
    const stockSearch = ref("");
    const stockLoading = ref(false);
    let stockDebounce = null;

    const stockFiltered = computed(() => {
      const q = stockSearch.value.trim().toLowerCase();
      if (!q) return stockAll.value;
      return stockAll.value.filter(
        (item) =>
          (item.nm_product || "").toLowerCase().includes(q) ||
          (item.kd_product_universal || "").toLowerCase().includes(q) ||
          (item.kd_product || "").toLowerCase().includes(q)
      );
    });

    const fetchStock = async () => {
      stockLoading.value = true;
      try {
        const res = await api.get("/actual-stock");
        if (res.data.success) stockAll.value = res.data.data;
      } catch (err) {
        console.error("Gagal fetch stok:", err);
        await showToast("Gagal memuat data stok", "danger");
      } finally {
        stockLoading.value = false;
      }
    };

    const onStockSearch = () => {
      if (stockDebounce) clearTimeout(stockDebounce);
      stockDebounce = setTimeout(() => {
        if (stockAll.value.length === 0) fetchStock();
      }, 300);
    };

    const clearStockSearch = () => {
      stockSearch.value = "";
    };

    const stockQtyClass = (qty) => {
      if (qty <= 0) return "qty-empty";
      if (qty <= 5) return "qty-low";
      if (qty <= 20) return "qty-medium";
      return "qty-ok";
    };

    // Ranking
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
        console.error("Gagal Mengambil Data Ranking", error.message);
      }
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

    const handleRefresh = (event) => {
      setTimeout(() => {
        window.location.reload();
        event.target.complete();
      }, 1000);
    };

    const goTo = (menu) => {
      router.replace(`/${menu}`);
    };

    const openErpWeb = async () => {
      try {
        const parsedUser = JSON.parse(getUser);
        const url = `https://erpsmb.cloud/index.php?model=login&action=checkLogin&user=${encodeURIComponent(
          parsedUser.user
        )}&password=${encodeURIComponent(parsedUser.password)}`;
        await Browser.open({ url, windowName: "_system" });
      } catch (error) {
        console.error("Gagal membuka ERP SMB Web:", error);
        await showToast("Gagal membuka ERP SMB Web", "danger");
      }
    };

    const formatStokDate = (dateStr) => {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    };

    onMounted(() => {
      loadAbsensi();
      checkToken();
      getRangking();
      fetchStock();
      if (ff.value) disableButtonMasuk.value = true;
      startAutoSlide();
    });

    onUnmounted(() => {
      if (autoSlideTimer) clearInterval(autoSlideTimer);
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
      calendarOutline,
      barcodeOutline,
      cubeOutline,
      timeOutline,
      barChartOutline,
      listOutline,
      personOutline,
      chevronForwardOutline,
      chevronBackOutline,
      searchOutline,
      closeCircleOutline,
      arrowForwardCircleOutline,
      userData,
      TabsPage,
      Tanggal,
      disableButtonPulang,
      disableButtonMasuk,
      IonRefresher,
      IonRefresherContent,
      handleRefresh,
      IonList,
      IonItem,
      arrayRangking,
      dataArray,
      tamBulan,
      tahun,
      showScanResi,
      showScanPacking,
      showLaporan,
      showLaporanModal,
      openLaporan,
      closeLaporan,
      goToLaporan,
      stockAll,
      stockSearch,
      stockFiltered,
      stockLoading,
      onStockSearch,
      clearStockSearch,
      stockQtyClass,
      formatStokDate,
      // Carousel
      activeSlide,
      carouselRef,
      goToSlide,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    };
  },
};
</script>

<style scoped>
/* ─── Base ── */
ion-page {
  --background: #f0f4f8;
  --ion-background-color: #f0f4f8;
  background: #f0f4f8 !important;
}
.app-header {
  --background: #1e3a8a;
  background: #1e3a8a !important;
  box-shadow: none !important;
  border: none !important;
}
.app-header::after,
.app-header::before {
  display: none !important;
}

ion-content {
  --background: #f0f4f8;
  --ion-background-color: #f0f4f8;
}
ion-content::part(scroll) {
  background: #f0f4f8;
}

/* ─── Wrapper ── */
.home-wrapper {
  padding: 16px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f0f4f8;
}

/* ─── Action Grid ── */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.action-card {
  background: #ffffff;
  border: none;
  border-radius: 18px;
  padding: 14px 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.action-card:active {
  transform: scale(0.96);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.action-card-wide {
  grid-column: 1 / -1;
  flex-direction: row;
  justify-content: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%);
  position: relative;
  overflow: hidden;
}
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
.erp-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 1;
}
.erp-title {
  color: #fff !important;
  font-size: 14px !important;
  font-weight: 800 !important;
  text-align: left !important;
}
.erp-sub {
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  font-weight: 500;
}

.action-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.action-icon-wrap ion-icon {
  font-size: 22px;
  color: #fff;
}

.action-card-wide .action-icon-wrap {
  background: rgba(255, 255, 255, 0.15) !important;
}

.action-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #334155;
  text-align: center;
  line-height: 1.3;
}

.absen-icon-bg {
  background: linear-gradient(135deg, #4a90e2, #2563eb);
}
.rekap-icon-bg {
  background: linear-gradient(135deg, #6c757d, #495057);
}
.jadwal-icon-bg {
  background: linear-gradient(135deg, #10b981, #059669);
}
.resi-icon-bg {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.packing-icon-bg {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}
.history-icon-bg {
  background: linear-gradient(135deg, #0891b2, #0e7490);
}
.laporan-icon-bg {
  background: linear-gradient(135deg, #0891b2, #0e7490);
}
.erp-icon-bg {
  background: rgba(255, 255, 255, 0.15);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
}

/* ══════════════════════════════════════
   DUAL CARDS SECTION
══════════════════════════════════════ */
.dual-section {
  width: 100%;
  position: relative; /* anchor untuk floating arrows */
}

.dual-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  /* Sembunyikan scrollbar — navigasi via arrow/swipe */
  scrollbar-width: none;
}
.dual-scroll::-webkit-scrollbar {
  display: none;
}

/* ── Floating Arrow Buttons ── */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(
    -60%
  ); /* sedikit ke atas dari tengah supaya tidak nutup konten */
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  color: #2563eb;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, transform 0.15s;
}
.carousel-arrow:active {
  background: #eff6ff;
  transform: translateY(-60%) scale(0.93);
}
.carousel-arrow-left {
  left: -10px;
}
.carousel-arrow-right {
  right: -10px;
}

/* ── Dot indicator ── */
.carousel-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.carousel-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: none;
  background: #cbd5e1;
  cursor: pointer;
  padding: 0;
  transition: all 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}
.carousel-dot-active {
  width: 20px;
  border-radius: 4px;
  background: #2563eb;
}

/* ── Individual Card ── */
.dash-card {
  flex-shrink: 0;
  width: 82vw;
  max-width: 320px;
  min-width: 260px;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
}

/* ── Card Header ── */
.dash-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.dash-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dash-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dash-icon ion-icon {
  font-size: 18px;
  color: #fff;
}
.star-bg {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.stock-bg {
  background: linear-gradient(135deg, #0891b2, #0e7490);
}

.dash-header-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.dash-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.dash-card-sub {
  font-size: 11px;
  color: #94a3b8;
}

/* Lihat Semua */
.btn-lihat-semua {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 10px;
  border: 1.5px solid #2563eb;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-lihat-semua ion-icon {
  font-size: 13px;
}
.btn-lihat-semua:active {
  background: #dbeafe;
}

/* ── Empty ── */
.dash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
  gap: 6px;
  flex: 1;
}
.dash-empty-icon {
  font-size: 32px;
  color: #cbd5e1;
}
.dash-empty p {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

/* ── Ranking Table ── */
.rank-table-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rank-head {
  display: grid;
  grid-template-columns: 28px 1fr 68px;
  padding: 8px 12px;
  background: #f8fafc;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.rank-scroll {
  overflow-y: auto;
  max-height: 240px;
  -webkit-overflow-scrolling: touch;
}
.rank-scroll::-webkit-scrollbar {
  width: 3px;
}
.rank-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.rank-row {
  display: grid;
  grid-template-columns: 28px 1fr 68px;
  padding: 9px 12px;
  align-items: center;
  border-bottom: 1px solid #f8fafc;
}
.rank-row:last-child {
  border-bottom: none;
}
.rank-top3 {
  background: #fafbff;
}

.rh-no {
  display: flex;
  align-items: center;
}
.medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 10px;
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
.rank-plain {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.name-col {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.name-main {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.name-dept {
  font-size: 10px;
  color: #94a3b8;
}

.rh-avg {
  display: flex;
  justify-content: flex-end;
}
.avg-badge {
  background: #f0f9ff;
  color: #0284c7;
  font-weight: 700;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
}

/* ── Stok Search ── */
.stok-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin: 10px 12px 6px;
  flex-shrink: 0;
}
.stok-search-icon {
  position: absolute;
  left: 10px;
  font-size: 14px;
  color: #94a3b8;
  pointer-events: none;
}
.stok-search-input {
  width: 100%;
  padding: 8px 28px 8px 30px;
  font-size: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #1e293b;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.stok-search-input:focus {
  border-color: #2563eb;
}
.stok-search-input::placeholder {
  color: #cbd5e1;
}
.stok-search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}

/* ── Stok Skeleton ── */
.stok-skeleton {
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.skel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.skel {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
  height: 12px;
}
.skel-name {
  flex: 1;
}
.skel-qty {
  width: 36px;
  flex-shrink: 0;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ── Stok Mini List ── */
.stok-mini-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stok-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #f8fafc;
}
.stok-row:active {
  background: #f8fafc;
}
.stok-row-low {
  background: #fffbeb;
}

.stok-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.stok-no {
  font-size: 10px;
  font-weight: 600;
  color: #cbd5e1;
  min-width: 18px;
  text-align: right;
  flex-shrink: 0;
}
.stok-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.stok-name {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stok-code {
  font-size: 10px;
  color: #94a3b8;
  font-family: monospace;
}

.stok-row-right {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  margin-left: 8px;
}
.qty-badge {
  font-size: 12px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 7px;
  min-width: 32px;
  text-align: center;
}
.qty-unit {
  font-size: 9px;
  color: #94a3b8;
}

.qty-empty {
  background: #fee2e2;
  color: #b91c1c;
}
.qty-low {
  background: #fef3c7;
  color: #b45309;
}
.qty-medium {
  background: #e0f2fe;
  color: #0369a1;
}
.qty-ok {
  background: #dcfce7;
  color: #15803d;
}

/* Footer btn stok */
.stok-footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px 12px;
  border: none;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  margin-top: auto;
}
.stok-footer-btn:active {
  background: #eff6ff;
}
.stok-footer-btn ion-icon {
  font-size: 15px;
}
</style>

<style>
.ion-page,
ion-app > .ion-page {
  --ion-background-color: #f0f4f8;
}

/* ── Modal Laporan ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}
.modal-sheet {
  width: 100%;
  background: #ffffff;
  border-radius: 24px 24px 0 0;
  padding: 12px 20px 36px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideUp 0.25s ease;
}
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.modal-handle {
  width: 40px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  margin: 0 auto 12px;
}
.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  padding-left: 4px;
}

.modal-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 12px;
  background: #f8fafc;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.15s;
}
.modal-item:active {
  background: #f1f5f9;
}
.modal-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.modal-icon-wrap ion-icon {
  font-size: 22px;
  color: #fff;
}
.status-icon-bg {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.admin-icon-bg {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}
.modal-item-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.modal-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.modal-item-sub {
  font-size: 12px;
  color: #94a3b8;
}
.modal-chevron {
  font-size: 18px;
  color: #cbd5e1;
  flex-shrink: 0;
}
.modal-cancel {
  margin-top: 6px;
  padding: 14px;
  background: none;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  width: 100%;
}
.stok-updated {
  font-size: 9.5px;
  color: #b0bec5;
  margin-top: 1px;
}
</style>