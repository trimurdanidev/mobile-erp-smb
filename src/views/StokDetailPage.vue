<template>
  <ion-page class="forced-light">
    <ion-header class="stok-header" :translucent="false">
      <ion-toolbar class="stok-toolbar">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">Stok Aktual</span>
          <span class="toolbar-subtitle"
            >{{ filteredList.length }} produk ditampilkan</span
          >
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="false" :scroll-y="false" class="light-content">
      <div class="page-layout">
        <!-- Search bar -->
        <div class="search-wrap">
          <div class="search-inner">
            <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Cari nama atau kode produk..."
              autofocus
            />
            <button
              v-if="searchQuery"
              class="search-clear"
              @click="searchQuery = ''"
            >
              <ion-icon :icon="closeCircleOutline"></ion-icon>
            </button>
          </div>

          <!-- Filter stok -->
          <div class="filter-chips">
            <button
              v-for="f in filters"
              :key="f.value"
              class="chip"
              :class="{ 'chip-active': activeFilter === f.value }"
              @click="activeFilter = f.value"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <!-- Stats bar -->
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-num">{{ stats.total }}</span>
            <span class="stat-label">Total Produk</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num stat-empty">{{ stats.empty }}</span>
            <span class="stat-label">Habis</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num stat-low">{{ stats.low }}</span>
            <span class="stat-label">Hampir Habis</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num stat-ok">{{ stats.ok }}</span>
            <span class="stat-label">Aman</span>
          </div>
        </div>

        <!-- List area -->
        <div class="list-outer">
          <!-- Loading -->
          <div v-if="isLoading" class="center-state">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Memuat data stok...</p>
          </div>

          <!-- Empty -->
          <div v-else-if="filteredList.length === 0" class="center-state">
            <ion-icon :icon="searchOutline" class="state-icon"></ion-icon>
            <p>Tidak ada produk yang cocok</p>
            <span class="state-hint">Coba kata kunci atau filter lain</span>
          </div>

          <!-- List -->
          <div v-else class="stok-list" ref="listRef" @scroll="onScroll">
            <div
              v-for="(item, idx) in filteredList"
              :key="item.id"
              class="stok-card"
              :class="stockCardClass(item.qty_stock)"
            >
              <div class="stok-card-left">
                <span class="stok-no">{{ idx + 1 }}</span>
                <div class="stok-info">
                  <span class="stok-name">{{ item.nm_product }}</span>
                  <span class="stok-code">{{
                    item.kd_product || item.kd_product_universal || "-"
                  }}</span>
                  <span class="stok-cat" v-if="item.kategori">{{
                    item.kategori
                  }}</span>
                  <span class="stok-updated"
                    >🕒Terakhir Update: {{ formatStokDate(item.updated_at) }}</span
                  >
                </div>
              </div>
              <div class="stok-card-right">
                <span class="qty-badge" :class="qtyClass(item.qty_stock)">
                  {{ item.qty_stock }}
                </span>
                <span class="qty-label">pcs</span>
                <div
                  class="qty-status-dot"
                  :class="qtyDotClass(item.qty_stock)"
                ></div>
              </div>
            </div>

            <div class="list-end">
              <span>✅ {{ filteredList.length }} produk ditampilkan</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
  searchOutline,
  closeCircleOutline,
} from "ionicons/icons";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";

interface StokItem {
  id: number;
  nm_product: string;
  kd_product?: string;
  kd_product_universal?: string;
  qty_stock: number;
  kategori?: string;
  updated_at?: string;
}

const stockAll = ref<StokItem[]>([]);
const isLoading = ref(false);
const searchQuery = ref("");
const activeFilter = ref("ALL");
const listRef = ref<HTMLElement | null>(null);

const filters = [
  { label: "Semua", value: "ALL" },
  { label: "Habis", value: "EMPTY" },
  { label: "Hampir Habis", value: "LOW" },
  { label: "Aman", value: "OK" },
];

const filteredList = computed(() => {
  let list = stockAll.value;
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (item) =>
        (item.nm_product || "").toLowerCase().includes(q) ||
        (item.kd_product || "").toLowerCase().includes(q) ||
        (item.kd_product_universal || "").toLowerCase().includes(q)
    );
  }
  if (activeFilter.value === "EMPTY")
    return list.filter((i) => i.qty_stock <= 0);
  if (activeFilter.value === "LOW")
    return list.filter((i) => i.qty_stock > 0 && i.qty_stock <= 5);
  if (activeFilter.value === "OK") return list.filter((i) => i.qty_stock > 5);
  return list;
});

const stats = computed(() => ({
  total: stockAll.value.length,
  empty: stockAll.value.filter((i) => i.qty_stock <= 0).length,
  low: stockAll.value.filter((i) => i.qty_stock > 0 && i.qty_stock <= 5).length,
  ok: stockAll.value.filter((i) => i.qty_stock > 5).length,
}));

const fetchStock = async () => {
  isLoading.value = true;
  try {
    const res = await api.get("/actual-stock");
    if (res.data.success) stockAll.value = res.data.data;
  } catch (err) {
    await showToast("Gagal memuat data stok", "danger");
  } finally {
    isLoading.value = false;
  }
};

const stockCardClass = (qty: number) => {
  if (qty <= 0) return "card-empty";
  if (qty <= 5) return "card-low";
  return "";
};
const qtyClass = (qty: number) => {
  if (qty <= 0) return "qty-empty";
  if (qty <= 5) return "qty-low";
  if (qty <= 20) return "qty-medium";
  return "qty-ok";
};
const qtyDotClass = (qty: number) => {
  if (qty <= 0) return "dot-empty";
  if (qty <= 5) return "dot-low";
  return "dot-ok";
};

const onScroll = () => {};

const formatStokDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: '2-digit', minute: '2-digit'
  }) + ' WIB';
};

onMounted(() => fetchStock());
</script>

<style scoped>
.forced-light,
.light-content {
  --background: #f0f4f8 !important;
  background: #f0f4f8 !important;
  color: #1e293b !important;
}
.stok-header {
  --background: #1e3a8a;
  background: #1e3a8a;
  box-shadow: none !important;
  border: none !important;
}
.stok-header::after {
  display: none !important;
}
.stok-toolbar {
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

.page-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Search */
.search-wrap {
  background: #fff;
  padding: 12px 16px 10px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}
.search-inner {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.search-icon {
  position: absolute;
  left: 11px;
  font-size: 16px;
  color: #94a3b8;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 36px 10px 34px;
  font-size: 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #1e293b;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.search-input:focus {
  border-color: #2563eb;
  background: #fff;
}
.search-input::placeholder {
  color: #cbd5e1;
}
.search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}
.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;
}
.filter-chips::-webkit-scrollbar {
  display: none;
}
.chip {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.chip-active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

/* Stats */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  margin: 10px 12px 0;
  border-radius: 14px;
  padding: 12px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-num {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
}
.stat-empty {
  color: #dc2626;
}
.stat-low {
  color: #b45309;
}
.stat-ok {
  color: #15803d;
}
.stat-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.stat-divider {
  width: 1px;
  height: 32px;
  background: #f1f5f9;
}

/* List */
.list-outer {
  flex: 1;
  min-height: 0;
  margin: 10px 12px 8px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.center-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  text-align: center;
  padding: 40px 16px;
}
.center-state p {
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0 0;
}
.state-icon {
  font-size: 40px;
  color: #cbd5e1;
}
.state-hint {
  font-size: 12px;
  color: #cbd5e1;
}

.stok-list {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}
.stok-list::-webkit-scrollbar {
  width: 3px;
}
.stok-list::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.stok-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.12s;
}
.stok-card:last-of-type {
  border-bottom: none;
}
.stok-card:active {
  background: #f8fafc;
}
.card-empty {
  background: #fff5f5;
}
.card-low {
  background: #fffbeb;
}

.stok-card-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.stok-no {
  font-size: 11px;
  font-weight: 600;
  color: #cbd5e1;
  min-width: 22px;
  text-align: right;
  padding-top: 2px;
  flex-shrink: 0;
}
.stok-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.stok-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}
.stok-code {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}
.stok-cat {
  font-size: 10.5px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 2px;
  display: inline-block;
  width: fit-content;
}

.stok-card-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 12px;
}
.qty-badge {
  font-size: 14px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  min-width: 40px;
  text-align: center;
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
.qty-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
}
.qty-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-empty {
  background: #dc2626;
}
.dot-low {
  background: #f59e0b;
}
.dot-ok {
  background: #22c55e;
}

.list-end {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.stok-updated {
  font-size: 9.5px;
  color: #b0bec5;
  margin-top: 1px;
}
</style>