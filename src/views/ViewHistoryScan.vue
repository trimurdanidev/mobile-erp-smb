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

    <ion-content :fullscreen="false" :scroll-y="false" class="light-content">
      <div class="page-layout">
        <!-- ① Filter -->
        <div class="filter-wrap">
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
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select
              v-model="selectedStatus"
              class="filter-select"
              @change="resetAndFetch"
              :disabled="isLoadingStatus"
            >
              <option value="ALL">Semua</option>
              <option v-for="s in statusList" :key="s.id" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- ② Info bar -->
        <div class="info-bar" v-if="!isLoadingHistory && meta.total > 0">
          <span class="info-total">
            Total <b>{{ meta.total }}</b> data
          </span>
          <button class="refresh-btn" @click="resetAndFetch">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </button>
        </div>

        <!-- ③ Tabel -->
        <div class="table-outer">
          <!-- Header tabel sticky -->
          <div class="table-head">
            <div class="col-center">#</div>
            <div>Data Resi &amp; User</div>
            <div class="col-center">Kurir</div>
            <div class="col-center">Status</div>
            <div class="col-center">Aksi</div>
          </div>

          <!-- Loading state -->
          <div
            v-if="isLoadingHistory && historyList.length === 0"
            class="loading-state"
          >
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Memuat riwayat scan...</p>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!isLoadingHistory && historyList.length === 0"
            class="empty-state"
          >
            <ion-icon class="empty-icon" :icon="timeOutline"></ion-icon>
            <p>Belum ada riwayat scan yang cocok.</p>
          </div>

          <!-- Scrollable body -->
          <div
            v-else
            class="table-scroll-area"
            ref="tableScrollRef"
            @scroll="onTableScroll"
          >
            <div
              v-for="(item, index) in historyList"
              :key="item.id"
              class="table-row"
            >
              <div class="col-index">{{ (meta.from ?? 0) + index }}</div>

              <div class="col-info">
                <div class="row-resi">{{ item.resi_no || "-" }}</div>
                <div class="row-order">
                  No. Order: {{ item.order_no || "-" }}
                </div>
                <div class="row-operator">
                  <span
                    v-if="(item.resi_status || '').toUpperCase() === 'PICKUP'"
                  >
                    👤 Resi: <b>{{ item.scanned_by || "System" }}</b>
                  </span>
                  <span
                    v-else-if="
                      (item.resi_status || '').toUpperCase() === 'PACKING'
                    "
                  >
                    👤 Resi:
                    <b
                      >{{ item.scanned_by || "System" }}<br />
                      👤 Packing: {{ item.packing_by || "System" }}</b
                    >
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

              <!-- ✅ Kolom Aksi -->
              <div class="col-action">
                <button
                  class="btn-detail"
                  :disabled="!item.order_no"
                  @click="openDetail(item.order_no)"
                  title="Lihat Detail Order"
                >
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Load more indicator -->
            <div v-if="isLoadingMore" class="load-more-indicator">
              <ion-spinner name="dots" color="primary"></ion-spinner>
              <span>Memuat halaman {{ meta.current_page + 1 }}…</span>
            </div>

            <!-- End indicator -->
            <div
              v-if="
                !isLoadingMore &&
                meta.current_page >= meta.last_page &&
                historyList.length > 0
              "
              class="end-indicator"
            >
              ✅ Semua data sudah ditampilkan
            </div>
          </div>
        </div>

        <!-- ④ Pagination bar -->
        <div class="pagination-bar" v-if="meta.last_page > 1">
          <button
            class="page-btn"
            :disabled="meta.current_page <= 1 || isLoadingHistory"
            @click="goToPage(meta.current_page - 1)"
          >
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </button>

          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="page-ellipsis">…</span>
            <button
              v-else
              class="page-btn"
              :class="{ 'page-btn-active': p === meta.current_page }"
              :disabled="isLoadingHistory"
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
          </template>

          <button
            class="page-btn"
            :disabled="meta.current_page >= meta.last_page || isLoadingHistory"
            @click="goToPage(meta.current_page + 1)"
          >
            <ion-icon :icon="chevronForwardOutline"></ion-icon>
          </button>
        </div>
      </div>

      <!-- ✅ Modal Detail Order — di dalam ion-content, state independen -->
      <ion-modal
        :is-open="isDetailOpen"
        css-class="order-detail-modal"
        :backdrop-dismiss="true"
        @didDismiss="closeDetail"
      >
        <div class="modal-inner">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-text">
              <span class="modal-title">Detail Order</span>
              <span class="modal-subtitle">{{ selectedOrderNo || "-" }}</span>
            </div>
            <button class="modal-close-btn" @click="closeDetail">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Loading modal -->
            <div v-if="isLoadingDetail" class="modal-loading">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <p>Memuat detail order...</p>
            </div>

            <!-- Error modal -->
            <div v-else-if="detailErrorMsg" class="modal-error">
              <ion-icon
                :icon="alertCircleOutline"
                class="error-icon"
              ></ion-icon>
              <p>{{ detailErrorMsg }}</p>
              <button class="retry-btn" @click="fetchDetail(selectedOrderNo)">
                Coba Lagi
              </button>
            </div>

            <!-- Data modal -->
            <template v-else-if="orderDetail">
              <div class="detail-card">
                <div class="status-row">
                  <span :class="['status-pill', statusClass(orderDetail.header.order_status)]">
                    {{ orderDetail.header.order_status || "UNKNOWN" }}
                  </span>
                  <span v-if="orderDetail.header.cod" class="cod-pill">COD</span>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">No. Order</span>
                    <span class="info-value">{{ orderDetail.header.order_sn || "-" }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">No. Resi / Booking</span>
                    <span class="info-value-row">
                      <span class="info-value">{{ orderDetail.header.booking_sn || "-" }}</span>
                      <button v-if="orderDetail.header.booking_sn" class="copy-btn" @click="copyBookingSn">
                        <ion-icon :icon="copied ? checkmarkOutline : copyOutline"></ion-icon>
                      </button>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Dibuat</span>
                    <span class="info-value">{{ formatDateTime(orderDetail.header.order_create_time) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Batas Kirim</span>
                    <span class="info-value info-value-deadline">{{ formatDateTime(orderDetail.header.ship_by_date) }}</span>
                  </div>
                </div>

                <div v-if="orderDetail.header.message_to_seller" class="seller-note">
                  💬 {{ orderDetail.header.message_to_seller }}
                </div>
              </div>

              <div class="items-section">
                <div class="items-section-title">
                  Produk
                  <span class="items-count">({{ orderDetail.details.length }})</span>
                </div>

                <div v-for="(it, idx) in orderDetail.details" :key="it.id" class="item-card">
                  <div class="item-index">{{ idx + 1 }}</div>
                  <div class="item-info">
                    <div class="item-name">{{ it.item_name }}</div>
                    <div v-if="it.model_name" class="item-variant">Varian: {{ it.model_name }}</div>
                    
                    <div class="item-price-row">
                      <span class="item-qty">{{ it.quantity }}x</span>
                      <span v-if="canViewPrice" class="item-price">
                        {{ formatCurrency(it.discounted_price) }}
                      </span>
                    </div>
                  </div>
                  
                  <div v-if="canViewPrice" class="item-subtotal">
                    {{ formatCurrency(itemSubtotal(it)) }}
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Modal Footer -->
          <div v-if="orderDetail" class="modal-footer">
            <div class="footer-summary">
              <span class="footer-label">Total ({{ totalQty }} barang)</span>
              <span v-if="canViewPrice" class="footer-total">{{ formatCurrency(totalPrice) }}</span>
            </div>
            <button class="footer-close-btn" @click="closeDetail">Tutup</button>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  IonIcon,
  IonModal,
} from "@ionic/vue";
import {
  timeOutline,
  arrowBackOutline,
  searchOutline,
  refreshOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  alertCircleOutline,
  copyOutline,
  checkmarkOutline,
  documentTextOutline,
} from "ionicons/icons";
import api from "@/services/api";

// ── Types ──────────────────────────────────────────
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

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
}

interface ResiStatus {
  id: number;
  value: string;
  label: string;
}

interface OrderHeader {
  id: number;
  order_sn: string;
  booking_sn: string;
  order_status: string;
  cod: number;
  message_to_seller: string | null;
  order_create_time: string;
  ship_by_date: string;
}

interface OrderItemDetail {
  id: number;
  item_name: string;
  model_name: string;
  quantity: number;
  original_price: string;
  discounted_price: string;
}

interface OrderDetailData {
  header: OrderHeader;
  details: OrderItemDetail[];
}

// ── History State ──────────────────────────────────
const selectedStatus = ref("ALL");
const searchQuery = ref("");
const historyList = ref<ResiHistory[]>([]);
const statusList = ref<ResiStatus[]>([]);
const isLoadingHistory = ref(false); // ← khusus tabel history
const isLoadingMore = ref(false);
const isLoadingStatus = ref(false);
const tableScrollRef = ref<HTMLElement | null>(null);
const meta = ref<Meta>({
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 0,
  from: null,
});
const userData = ref(JSON.parse(localStorage.getItem("master_user") || "{}"));

// ── Modal / Detail State ───────────────────────────
const isDetailOpen = ref(false);
const selectedOrderNo = ref<string | null>(null);
const isLoadingDetail = ref(false); // ← khusus modal detail
const detailErrorMsg = ref<string | null>(null);
const orderDetail = ref<OrderDetailData | null>(null);
const copied = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ── Fetch Status List ──────────────────────────────
const fetchStatusList = async () => {
  isLoadingStatus.value = true;
  try {
    const response = await api.get("/resi/getListResiStatus");
    if (response.data.success) {
      statusList.value = response.data.data;
    }
  } catch (error) {
    console.error("Gagal mengambil list status:", error);
  } finally {
    isLoadingStatus.value = false;
  }
};

// ── Fetch History ──────────────────────────────────
const fetchHistory = async (page = 1) => {
  if (page === 1) isLoadingHistory.value = true;
  else isLoadingMore.value = true;

  try {
    const response = await api.get("/resi/history", {
      params: {
        status: selectedStatus.value,
        search: searchQuery.value,
        page,
        per_page: meta.value.per_page,
      },
    });

    if (response.data.success) {
      if (page === 1) {
        historyList.value = response.data.data;
      } else {
        historyList.value.push(...response.data.data);
      }
      meta.value = response.data.meta;
    }
  } catch (error) {
    console.error("Gagal mengambil data history:", error);
  } finally {
    isLoadingHistory.value = false;
    isLoadingMore.value = false;
  }
};

const privilegedDepts = ["Owner", "Manager", "IT"];
const canViewPrice = privilegedDepts.some((d) =>
  (userData.value.department_name || "").includes(d)
);


// ── Fetch Detail Order ─────────────────────────────
const fetchDetail = async (orderNo: string | null) => {
  if (!orderNo) return;
  isLoadingDetail.value = true;
  detailErrorMsg.value = null;
  orderDetail.value = null;

  try {
    const response = await api.get(`/order/detail/${orderNo}`);
    if (response.data.success) {
      orderDetail.value = response.data.data;
    } else {
      detailErrorMsg.value =
        response.data.message || "Gagal mengambil detail order.";
    }
  } catch (error) {
    console.error("Gagal mengambil detail order:", error);
    detailErrorMsg.value = "Terjadi kesalahan saat mengambil data. Coba lagi.";
  } finally {
    isLoadingDetail.value = false;
  }
};

// ── Modal Controls ─────────────────────────────────
const openDetail = (orderNo: string | null) => {
  if (!orderNo) return;
  selectedOrderNo.value = orderNo;
  isDetailOpen.value = true;
  fetchDetail(orderNo);
};

const closeDetail = () => {
  isDetailOpen.value = false;
  // Bersihkan setelah animasi tutup selesai
  setTimeout(() => {
    selectedOrderNo.value = null;
    orderDetail.value = null;
    detailErrorMsg.value = null;
  }, 250);
};

// ── Computed: modal totals ─────────────────────────
const itemSubtotal = (item: OrderItemDetail) => {
  const price = parseFloat(item.discounted_price || item.original_price || "0");
  return price * (item.quantity || 1);
};

const totalQty = computed(
  () =>
    orderDetail.value?.details.reduce(
      (sum, it) => sum + (it.quantity || 0),
      0
    ) ?? 0
);

const totalPrice = computed(
  () =>
    orderDetail.value?.details.reduce((sum, it) => sum + itemSubtotal(it), 0) ??
    0
);

// ── Computed: pagination ───────────────────────────
const visiblePages = computed(() => {
  const current = meta.value.current_page;
  const last = meta.value.last_page;
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages: (number | string)[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(last - 1, current + 1);
    p++
  ) {
    pages.push(p);
  }
  if (current < last - 2) pages.push("...");
  pages.push(last);
  return pages;
});

// ── Helpers ────────────────────────────────────────
const resetAndFetch = () => fetchHistory(1);

const goToPage = (page: number) => {
  if (page < 1 || page > meta.value.last_page) return;
  fetchHistory(page).then(() => {
    tableScrollRef.value?.scrollTo({ top: 0, behavior: "smooth" });
  });
};

const onTableScroll = (e: Event) => {
  const el = e.target as HTMLElement;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  if (
    nearBottom &&
    !isLoadingHistory.value &&
    !isLoadingMore.value &&
    meta.value.current_page < meta.value.last_page
  ) {
    fetchHistory(meta.value.current_page + 1);
  }
};

const cleanLogoUrl = (rawUrl: string) => {
  if (!rawUrl) return "https://placehold.co/100x100/f1f5f9/94a3b8?text=Kurir";
  const idx = rawUrl.search(/https?:\/\/(?!.*https?:\/\/)/);
  return idx !== -1 ? rawUrl.slice(idx) : rawUrl;
};

const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).src =
    "https://placehold.co/100x100/f1f5f9/94a3b8?text=Kurir";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return (
    new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
};

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "-";
  const d = new Date(dateString.replace(" ", "T"));
  if (isNaN(d.getTime())) return dateString;
  return (
    d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
};

const formatCurrency = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const statusClass = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (["SHIPPED", "TO_CONFIRM_RECEIVE"].includes(s)) return "status-shipped";
  if (s === "COMPLETED") return "status-completed";
  if (["CANCELLED", "IN_CANCEL", "TO_RETURN"].includes(s))
    return "status-cancelled";
  if (["UNPAID", "READY_TO_SHIP", "PROCESSED", "RETRY_SHIP"].includes(s))
    return "status-pending";
  return "status-default";
};

const copyBookingSn = async () => {
  if (!orderDetail.value?.header.booking_sn) return;

  const textToCopy = orderDetail.value.header.booking_sn;

  // 💡 Cek apakah browser mendukung navigator.clipboard (Hanya aktif di HTTPS / Localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      copied.value = true;
      setTimeout(() => (copied.value = false), 1500);
      return; // Berhasil, langsung keluar fungsi
    } catch (error) {
      console.error("Gagal menyalin nomor resi via Clipboard API:", error);
    }
  }

  // 🔄 FALLBACK METHOD: Menggunakan trik Element Input (Jalan di HTTP biasa / IP Lokal)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;

    // Sembunyikan elemen agar tidak mengacaukan layout UI
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    // Eksekusi perintah salin bawaan browser lama
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      copied.value = true;
      setTimeout(() => (copied.value = false), 1500);
    } else {
      throw new Error("Perintah execCommand copy mengembalikan nilai false");
    }
  } catch (fallbackError) {
    console.error("Gagal total menyalin nomor resi:", fallbackError);
  }
};

// ── Watch search debounce ──────────────────────────
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(resetAndFetch, 500);
});

// ── Init ───────────────────────────────────────────
onMounted(() => {
  fetchStatusList();
  fetchHistory(1);
});
</script>

<style scoped>
/* ── Anti-darkmode ── */
.forced-light-mode,
.light-content {
  --background: #f8fafc !important;
  background: #f8fafc !important;
  color: #1e293b !important;
}

/* ── Header ── */
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

/* ── Layout ── */
.page-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Filter ── */
.filter-wrap {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 110px;
}
.filter-group-full {
  flex: 2;
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
  padding: 8px 10px 8px 32px;
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

/* ── Info bar ── */
.info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px 4px;
  flex-shrink: 0;
}
.info-total {
  font-size: 12px;
  color: #64748b;
}
.info-total b {
  color: #1e293b;
}
.refresh-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

/* ── Table outer ── */
.table-outer {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 0 12px 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: 0;
}

/* ── Table head — 5 kolom ── */
.table-head {
  display: grid;
  grid-template-columns: 35px 1fr 56px 76px 44px;
  background: #f1f5f9;
  padding: 10px 12px;
  font-size: 11.5px;
  font-weight: 700;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  flex-shrink: 0;
}

/* ── Scroll area ── */
.table-scroll-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* ── Rows — 5 kolom ── */
.table-row {
  display: grid;
  grid-template-columns: 35px 1fr 56px 76px 44px;
  padding: 12px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  background: #ffffff;
  transition: background 0.15s;
}
.table-row:last-child {
  border-bottom: none;
}
.table-row:active {
  background: #f8fafc;
}

.col-center {
  text-align: center;
}
.col-index {
  text-align: center;
  font-weight: 600;
  color: #94a3b8;
  font-size: 12px;
}
.col-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 6px;
}
.row-resi {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.2px;
  word-break: break-all;
}
.row-order {
  font-size: 11px;
  color: #94a3b8;
}
.row-operator {
  font-size: 11px;
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
  width: 36px;
  height: 36px;
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
  font-size: 10px;
  font-weight: 700;
  padding: 4px 6px;
  border-radius: 6px;
  text-transform: uppercase;
  text-align: center;
  letter-spacing: 0.3px;
  white-space: nowrap;
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

/* ── Kolom Aksi ── */
.col-action {
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn-detail {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
  flex-shrink: 0;
}
.btn-detail:active {
  background: #dbeafe;
}
.btn-detail:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Load more / end ── */
.load-more-indicator,
.end-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  font-size: 12px;
  color: #94a3b8;
}

/* ── Loading / Empty ── */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 16px;
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

/* ── Pagination ── */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-btn:not(:disabled):active {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.page-btn-active {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #2563eb !important;
}
.page-ellipsis {
  font-size: 13px;
  color: #94a3b8;
  padding: 0 2px;
}

/* ════════════════════════════════════
   MODAL STYLES
════════════════════════════════════ */
.modal-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 14px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.modal-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
}
.modal-subtitle {
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 600;
}
.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.modal-close-btn:active {
  background: #e2e8f0;
}
.modal-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 14px 16px 16px;
}
.modal-loading,
.modal-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 16px;
  text-align: center;
}
.modal-loading p,
.modal-error p {
  font-size: 13px;
  color: #94a3b8;
  margin: 8px 0 0;
}
.error-icon {
  font-size: 38px;
  color: #f87171;
}
.retry-btn {
  margin-top: 12px;
  padding: 8px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.retry-btn:active {
  background: #f1f5f9;
}
.detail-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}
.status-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.status-pill.status-shipped {
  background: #e0f2fe;
  color: #0369a1;
}
.status-pill.status-completed {
  background: #dcfce7;
  color: #15803d;
}
.status-pill.status-cancelled {
  background: #fee2e2;
  color: #b91c1c;
}
.status-pill.status-pending {
  background: #fef3c7;
  color: #b45309;
}
.status-pill.status-default {
  background: #f1f5f9;
  color: #64748b;
}
.cod-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  background: #ede9fe;
  color: #6d28d9;
  letter-spacing: 0.3px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 10px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.info-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}
.info-value-deadline {
  color: #b45309;
}
.info-value-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.copy-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: #f1f5f9;
  color: #2563eb;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.copy-btn:active {
  background: #e2e8f0;
}
.seller-note {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  font-size: 12.5px;
  color: #475569;
  line-height: 1.4;
}
.items-section-title {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 2px;
}
.items-count {
  color: #cbd5e1;
}
.item-card {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 10px;
  align-items: start;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}
.item-index {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  padding-top: 1px;
}
.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.item-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-variant {
  font-size: 11px;
  color: #94a3b8;
}
.item-price-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.item-qty {
  font-size: 11.5px;
  font-weight: 700;
  color: #64748b;
}
.item-price {
  font-size: 11.5px;
  color: #94a3b8;
}
.item-subtotal {
  font-size: 12.5px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  padding-top: 1px;
}
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.footer-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.footer-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}
.footer-total {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
}
.footer-close-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.footer-close-btn:active {
  background: #1d4ed8;
}
</style>

<style>
ion-modal.order-detail-modal {
  --width: 100%;
  --height: 86%;
  --border-radius: 20px 20px 0 0;
  --box-shadow: 0 -6px 24px rgba(15, 23, 42, 0.18);
  align-items: flex-end;
}
ion-modal.order-detail-modal::part(content) {
  border-radius: 20px 20px 0 0;
}
</style>