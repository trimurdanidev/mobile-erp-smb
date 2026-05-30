\<template>
  <ion-page>
    <ion-header class="jadwal-app-header" :translucent="false">
      <ion-toolbar class="custom-header">
        <ion-buttons slot="start">
          <ion-button class="back-btn" @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="header-content">
          <div class="header-title">Jadwal Kerja</div>
          <div class="header-sub">Lihat jadwal shift bulanan</div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="false">
      <!-- Filter Bulan & Tahun -->
      <div class="filter-wrap">
        <div class="filter-group">
          <label class="filter-label">Bulan</label>
          <select
            v-model="selectedMonth"
            class="filter-select"
            @change="loadJadwal"
          >
            <option v-for="(m, i) in months" :key="i" :value="i + 1">
              {{ m }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Tahun</label>
          <select
            v-model="selectedYear"
            class="filter-select"
            @change="loadJadwal"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <!-- ✅ Filter Karyawan — di luar v-else, selalu tampil untuk privileged -->
      <div
        v-if="isPrivileged && getUserData2.length > 0"
        class="employee-filter-card"
        style="margin: 12px 16px 0"
      >
        <div class="employee-filter-header">
          <ion-icon :icon="peopleOutline" class="emp-icon"></ion-icon>
          <span class="emp-label">Pilih Karyawan</span>
        </div>
        <select
          v-model="selectedUser"
          class="filter-select"
          @change="loadJadwal"
        >
          <option v-for="u in getUserData2" :key="u.id" :value="u.user">
            {{ u.username }}
          </option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="center-state">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Memuat jadwal...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!loading && jadwalList.length === 0" class="center-state">
        <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
        <p>Tidak ada jadwal di bulan ini</p>
      </div>

      <!-- Jadwal List -->
      <div v-else class="jadwal-wrap">
        <!-- Info user -->
        <div class="user-info-card">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-text">
            <div class="user-name">{{ selectedUserName }}</div>
            <div class="user-dept">{{ selectedUserDept }}</div>
          </div>
          <div class="month-badge">
            {{ months[selectedMonth - 1] }} {{ selectedYear }}
          </div>
        </div>

        <!-- Legend dinamis -->
        <div class="legend-wrap">
          <span v-for="s in masterShifts" :key="s.shift_id" class="legend-item">
            <span
              class="legend-dot"
              :style="getLegendDotColor(s.shift_code)"
            ></span>
            {{ s.shift_name }}
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background: #ced4da"></span>Off
          </span>
        </div>

        <!-- Grid Kalender -->
        <div class="calendar-grid">
          <div
            v-for="item in jadwalList"
            :key="item.schedule_date"
            class="day-card"
            :class="getDayClass(item)"
          >
            <div class="day-num">{{ formatDay(item.schedule_date) }}</div>
            <div class="day-name">{{ getDayName(item.schedule_date) }}</div>
            <div class="shift-badge" :class="getShiftClass(item.shift_code)">
              {{ item.shift_code || "·" }}
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary-card">
          <div class="summary-title">Ringkasan Bulan Ini</div>
          <div class="summary-row">
            <div
              v-for="shift in masterShifts"
              :key="shift.shift_id"
              class="summary-item"
            >
              <div
                class="sum-val"
                :style="{ color: getShiftColor(shift.shift_code) }"
              >
                {{ countShift(shift.shift_code) }}
              </div>
              <div class="sum-lbl">{{ shift.shift_name }}</div>
            </div>
            <div class="summary-item">
              <div class="sum-val sum-off">{{ countShift("off") }}</div>
              <div class="sum-lbl">Off</div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import {
  calendarOutline,
  arrowBackOutline,
  peopleOutline,
} from "ionicons/icons";
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";

const today = new Date();
const selectedMonth = ref(today.getMonth() + 1);
const selectedYear = ref(today.getFullYear());
const loading = ref(false);
const jadwalList = ref<any[]>([]);

const userData = ref(JSON.parse(localStorage.getItem("master_user") || "{}"));
const getUser = localStorage.getItem("master_user");
const getUserData2 = ref<any[]>([]);
const selectedUser = ref(userData.value.user);
const userInitial = computed(() => {
  const name = userData.value.description || userData.value.user || "?";
  return name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});

const months = [
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
const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 1 + i);

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const loadAllUsers = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const res = await api.get("/showAll", {
      headers: { Authorization: `Bearer ${token}` },
    });
    getUserData2.value = res.data.data || res.data || [];
  } catch (err) {
    console.error("Gagal load users:", err);
  }
};

const formatDay = (dateStr: string) => new Date(dateStr).getDate();
const getDayName = (dateStr: string) => dayNames[new Date(dateStr).getDay()];
const isHoliday = (dateStr: string) => new Date(dateStr).getDay() === 0;

const getDayClass = (item: any) => ({
  "day-holiday": isHoliday(item.schedule_date),
  "day-today": item.schedule_date === today.toISOString().slice(0, 10),
  "day-has-shift": item.shift_code && item.shift_code !== "off",
});

const getLegendDotColor = (code: string) => {
  const colors: Record<string, string> = {
    P: "#28a745",
    S: "#fd7e14",
    N: "#007bff",
    M: "#7c3aed",
  };
  return { background: colors[code] ?? "#888" };
};

const masterShifts = ref<any[]>([]);
const shiftCodeMap = ref<Record<number, string>>({}); // {1:'N', 2:'P', 3:'S'}
const shiftTimeMap = ref<Record<number, string>>({}); // {1:'08:30–17:00', ...}

// Load master shifts dari API
const loadMasterShifts = async () => {
  try {
    const response = await api.get("/getMasterShifts");
    masterShifts.value = response.data.data || [];

    // Build map dinamis
    masterShifts.value.forEach((s: any) => {
      shiftCodeMap.value[s.shift_id] = s.shift_code;
      shiftTimeMap.value[s.shift_id] = s.shift_time;
    });
  } catch (err) {
    console.error("Gagal load master shifts:", err);
  }
};

const privilegedDepts = ["Owner", "Manager", "IT"];
const isPrivileged = privilegedDepts.some((d) =>
  (userData.value.department_name || "").includes(d)
);

// Update getShiftClass — pakai shiftCodeMap
const getShiftClass = (code: string) => {
  if (code === "P") return "badge-p";
  if (code === "S") return "badge-s";
  if (code === "N") return "badge-n";
  if (code === "M") return "badge-m";
  return "badge-off";
};

// Update loadJadwal — map shift_code dari masterShifts
const loadJadwal = async () => {
  loading.value = true;
  try {
    const user = selectedUser.value || userData.value.user;
    const response = await api.get(
      `/getUserSchedule/${user}/${selectedYear.value}/${selectedMonth.value}`
    );
    const raw = response.data.data || [];
    jadwalList.value = raw.map((item: any) => ({
      ...item,
      shift_code: item.shift_id
        ? shiftCodeMap.value[item.shift_id] ?? "off"
        : "off",
      shift_time: item.shift_id
        ? shiftTimeMap.value[item.shift_id] ?? null
        : null,
    }));
  } catch (err) {
    console.error("Gagal load jadwal:", err);
    jadwalList.value = [];
  } finally {
    loading.value = false;
  }
};

const selectedUserName = computed(() => {
  if (!isPrivileged) return userData.value.description || userData.value.user;
  const found = getUserData2.value.find((u) => u.user === selectedUser.value);
  return found ? found.username : userData.value.description;
});

const selectedUserDept = computed(() => {
  if (!isPrivileged) return userData.value.department_name || "";
  const found = getUserData2.value.find((u) => u.user === selectedUser.value);
  return found ? found.department_name || "" : userData.value.department_name;
});

const getShiftColor = (code: string): string => {
  const colorMap: Record<string, string> = {
    P: "#28a745",
    S: "#fd7e14",
    N: "#007bff",
    M: "#7c3aed",
  };
  return colorMap[code] ?? "#888888";
};

const countShift = (code: string) =>
  jadwalList.value.filter((j) => {
    const isSunday = new Date(j.schedule_date).getDay() === 0;
    if (code === "off") {
      // Jangan hitung Minggu sebagai off
      return !isSunday && (!j.shift_code || j.shift_code === "off");
    }
    return j.shift_code === code;
  }).length;

onMounted(async () => {
  await loadMasterShifts();
  if (isPrivileged) {
    await loadAllUsers();
  }
  await loadJadwal();
});
</script>

<style scoped>
/* ─── Header — sama persis dengan Rekap Absensi ── */
.jadwal-app-header {
  --background: #1e3a8a;
  background: #1e3a8a;
  box-shadow: none !important;
  border: none !important;
}
.jadwal-app-header::after {
  display: none !important;
}

.custom-header {
  --background: transparent;
  --border-color: transparent;
  --padding-top: 4px;
  --padding-bottom: 4px;
  padding-top: 5%;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: 8px;
}

.header-title {
  font-size: 17px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.header-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

/* ─── Content ── */
ion-content {
  --background: #f0f4f8;
}

/* ─── Filter ── */
.filter-wrap {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  margin: 16px 16px 0;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
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
}

/* ─── States ── */
.center-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: #94a3b8;
}
.center-state p {
  font-size: 14px;
  margin: 0;
}
.empty-icon {
  font-size: 48px;
}

/* ─── Jadwal Wrap ── */
.jadwal-wrap {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── User Info Card — badge simpel ── */
.user-info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}
.user-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}
.user-dept {
  font-size: 11px;
  color: #94a3b8;
}
.month-badge {
  margin-left: auto;
  background: #eff6ff;
  color: #2563eb;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* ─── Legend ── */
.legend-wrap {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64748b;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-p .legend-dot {
  background: #28a745;
}
.legend-s .legend-dot {
  background: #fd7e14;
}
.legend-n .legend-dot {
  background: #007bff;
}
.legend-off .legend-dot {
  background: #ced4da;
}

/* ─── Calendar Grid ── */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.day-card {
  background: #fff;
  border-radius: 10px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid #f1f5f9;
  min-height: 80px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.day-card.day-holiday {
  background: #fff5f5;
  border-color: #fecaca;
}
.day-card.day-today {
  border: 2px solid #2563eb;
}
.day-card.day-has-shift {
  background: #f0f9ff;
}

.day-num {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}
.day-name {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 600;
}
.day-card.day-holiday .day-name {
  color: #ef4444;
}

.shift-badge {
  font-size: 11px;
  font-weight: 800;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.badge-p {
  background: #d4edda;
  color: #28a745;
}
.badge-s {
  background: #fde8d4;
  color: #fd7e14;
}
.badge-n {
  background: #cce5ff;
  color: #007bff;
}
.badge-off {
  background: transparent;
  color: #ced4da;
  font-size: 14px;
}
.badge-m {
  background: #ede9fe;
  color: #7c3aed;
}
.shift-time {
  font-size: 8px;
  color: #94a3b8;
  text-align: center;
}

/* ─── Summary Card ── */
.summary-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}
.summary-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 14px;
}
.summary-row {
  display: flex;
  justify-content: space-around;
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.sum-val {
  font-size: 24px;
  font-weight: 800;
}
.sum-lbl {
  font-size: 11px;
  color: #94a3b8;
}
.sum-pagi {
  color: #28a745;
}
.sum-siang {
  color: #fd7e14;
}
.sum-normal {
  color: #007bff;
}
.sum-off {
  color: #ced4da;
}
.employee-filter-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.employee-filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emp-icon {
  font-size: 18px;
  color: #2563eb;
  background: #eff6ff;
  padding: 6px;
  border-radius: 8px;
}

.emp-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}
</style>