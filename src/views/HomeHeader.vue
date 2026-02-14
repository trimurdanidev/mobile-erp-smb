<template>
  <div class="home-header">
    <div class="header-card">
      <!-- Top Row: Greeting + Avatar -->
      <div class="header-top">
        <div class="greeting-block">
          <p class="greeting-sub">{{ hariIni }}, {{ tanggalHariIni }}</p>
          <h2 class="greeting-name">{{ showuser }}</h2>
          <p class="greeting-app">Welcome to ERP SMB</p>
        </div>
        <div class="avatar-circle">
          <span class="avatar-initial">{{ avatarInitial }}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="header-divider"></div>

      <!-- Status Row -->
      <div class="status-row">
        <div v-if="seterAbsenmasuk" class="status-badge status-hadir">
          <ion-icon
            :icon="checkmarkCircleOutline"
            class="status-icon"
          ></ion-icon>
          <span
            >Absen masuk pukul <strong>{{ absenMasuk }}</strong></span
          >
        </div>
        <div v-else class="status-badge status-belum">
          <ion-icon :icon="closeCircleOutline" class="status-icon"></ion-icon>
          <span>Anda belum absen masuk</span>
        </div>
      </div>
    </div>
  </div>
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
} from "@ionic/vue";
import {
  logInOutline,
  logOutOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { onMounted, ref, computed } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
  },
  setup() {
    const router = useRouter();
    const hariIni = ref("");
    const tanggalHariIni = ref("");
    const absenMasuk = ref(null);
    const Tanggal = ref("");
    const getUser = localStorage.getItem("master_user");
    const showuser = ref(null);
    const timeIn = ref(null);
    const timeOut = ref(null);
    const seterAbsenmasuk = ref(null);
    const dd = ref(null);

    const avatarInitial = computed(() => {
      if (!showuser.value) return "?";
      const parts = showuser.value.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    });

    const getHariTanggal = () => {
      const hariList = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
      ];
      const today = new Date();
      Tanggal.value =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        today.getDate();
      hariIni.value = hariList[today.getDay()];
      tanggalHariIni.value = today.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const userData = ref([]);

    const loadAbsensi = async () => {
      try {
        userData.value = JSON.parse(getUser);
        const response = api.get(
          "/getAbsenUser/" + userData.value.user + "/" + Tanggal.value
        );
        const parsedAbsenMasuk = (await response).data;
        seterAbsenmasuk.value = JSON.stringify(parsedAbsenMasuk.data);
        dd.value = JSON.parse(seterAbsenmasuk.value);
        absenMasuk.value = dd.value.time_in;
      } catch (error) {
        console.error("Gagal memuat data absensi:", error);
      }
    };

    const handleRefresh = async (event) => {
      await loadAbsensi();
      event.target.complete();
    };

    onMounted(() => {
      getHariTanggal();
      loadAbsensi();
      const parseUser = JSON.parse(getUser);
      showuser.value = parseUser.description;
    });

    return {
      hariIni,
      tanggalHariIni,
      logInOutline,
      logOutOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      handleRefresh,
      Tanggal,
      userData,
      getUser,
      showuser,
      timeIn,
      timeOut,
      seterAbsenmasuk,
      dd,
      absenMasuk,
      avatarInitial,
    };
  },
};
</script>

<style scoped>
/* ─── Wrapper ───────────────────────────────────── */
.home-header {
  width: 100%;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  /* HAPUS position: sticky, top: 0, z-index */
}

/* ─── Card ──────────────────────────────────────── */
.header-card {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  border-radius: 0 0 28px 28px;
  padding: 14px 20px 20px; /* kurangi padding-top dari 48px → 14px */
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
}

/* ─── Top Row ───────────────────────────────────── */
.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.greeting-block {
  flex: 1;
  min-width: 0;
}

.greeting-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 4px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.greeting-name {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.greeting-app {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-weight: 400;
}

/* ─── Avatar ────────────────────────────────────── */
.avatar-circle {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.avatar-initial {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5px;
}

/* ─── Divider ───────────────────────────────────── */
.header-divider {
  height: 1px;
  /* background: rgba(255, 255, 255, 0.15); */
  background: #ffffff;
  margin: 14px 0;
}

/* ─── Status Badge ──────────────────────────────── */
.status-row {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 30px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}

.status-badge.status-hadir {
  background: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.status-belum {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.status-badge strong {
  font-weight: 700;
  color: #ffffff;
}
</style>