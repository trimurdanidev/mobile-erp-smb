<template>
  <ion-page>
    <ion-header :translucent="false">
      <ion-toolbar class="notif-toolbar">
        <ion-buttons slot="start">
          <ion-button @click="$router.replace('/')">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="toolbar-title-block">
          <span class="toolbar-title">Notifikasi</span>
          <span class="toolbar-subtitle">{{ unreadCount }} belum dibaca</span>
        </div>
        <ion-buttons slot="end">
          <ion-button v-if="unreadCount > 0" @click="markAllRead" fill="clear">
            <span class="read-all-text">Baca Semua</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading -->
      <div v-if="loading" class="center-wrap">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <!-- Empty -->
      <div v-else-if="notifications.length === 0" class="empty-wrap">
        <ion-icon :icon="notificationsOffOutline" class="empty-icon"></ion-icon>
        <p class="empty-text">Belum ada notifikasi</p>
      </div>

      <!-- List -->
      <div v-else class="notif-list">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="notif-card"
          :class="{ 'notif-unread': !notif.fields.is_read }"
          @click="handleRead(notif)"
        >
          <div class="notif-icon-wrap" :class="iconBg(notif.fields.event_type)">
            <ion-icon :icon="iconType(notif.fields.event_type)"></ion-icon>
          </div>
          <div class="notif-body">
            <div class="notif-header-row">
              <span class="notif-title">{{ notif.fields.title }}</span>
              <span v-if="!notif.fields.is_read" class="unread-dot"></span>
            </div>
            <p class="notif-message">{{ notif.fields.body }}</p>
            <span class="notif-time">{{
              formatTime(notif.fields.created_at)
            }}</span>
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
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/vue";
import {
  arrowBackOutline,
  notificationsOffOutline,
  checkmarkCircleOutline,
  calendarOutline,
  alertCircleOutline,
  megaphoneOutline,
} from "ionicons/icons";
import { getNotifications, markAsRead } from "@/services/notificationService";

// ── State ──────────────────────────────────────────
const notifications = ref<any[]>([]);
const loading = ref(false);
const getUser = localStorage.getItem("master_user");
const userData = JSON.parse(getUser || "{}");

const unreadCount = computed(
  () => notifications.value.filter((n) => !n.fields.is_read).length
);

// ── Load ───────────────────────────────────────────
const load = async () => {
  loading.value = true;
  try {
    const res = await getNotifications(userData.user);
    // Sort terbaru di atas
    notifications.value = res.data.sort(
      (a: any, b: any) =>
        new Date(b.fields.created_at).getTime() -
        new Date(a.fields.created_at).getTime()
    );
  } catch (e) {
    console.error("Gagal load notif:", e);
  } finally {
    loading.value = false;
  }
};

// ── Mark read ──────────────────────────────────────
const handleRead = async (notif: any) => {
  if (!notif.fields.is_read) {
    await markAsRead(notif.id);
    notif.fields.is_read = true;
  }
};

const markAllRead = async () => {
  const unread = notifications.value.filter((n) => !n.fields.is_read);
  await Promise.all(unread.map((n) => markAsRead(n.id)));
  notifications.value.forEach((n) => (n.fields.is_read = true));
};

// ── Refresh ────────────────────────────────────────
const handleRefresh = async (event: any) => {
  await load();
  event.target.complete();
};

// ── Helpers ────────────────────────────────────────
const formatTime = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const iconType = (eventType: string) => {
  const map: Record<string, any> = {
    absensi: checkmarkCircleOutline,
    jadwal: calendarOutline,
    pengumuman: megaphoneOutline,
  };
  return map[eventType] || alertCircleOutline;
};

const iconBg = (eventType: string) => {
  const map: Record<string, string> = {
    absensi: "bg-green",
    jadwal: "bg-blue",
    pengumuman: "bg-orange",
  };
  return map[eventType] || "bg-gray";
};

onMounted(load);
</script>

<style scoped>
.notif-toolbar {
  --background: #1e3a8a;
  --color: #fff;
  padding-top: 5%;
}

.toolbar-title-block {
  display: flex;
  flex-direction: column;
  padding-left: 8px;
}
.toolbar-title {
  font-size: 17px;
  font-weight: 800;
  color: #fff;
}
.toolbar-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}
.read-all-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

ion-content {
  --background: #f0f4f8;
}

.center-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  gap: 12px;
}
.empty-icon {
  font-size: 56px;
  color: #cbd5e1;
}
.empty-text {
  font-size: 14px;
  color: #94a3b8;
}

.notif-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notif-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.15s;
}
.notif-card:active {
  transform: scale(0.98);
}
.notif-unread {
  border-left: 3px solid #2563eb;
}

.notif-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.bg-green {
  background: #f0fdf4;
  color: #16a34a;
}
.bg-blue {
  background: #eff6ff;
  color: #2563eb;
}
.bg-orange {
  background: #fff7ed;
  color: #ea580c;
}
.bg-gray {
  background: #f1f5f9;
  color: #64748b;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.notif-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
  flex-shrink: 0;
  margin-left: 6px;
}
.notif-message {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 6px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-time {
  font-size: 11px;
  color: #94a3b8;
}
</style>