<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/home">
          <div class="tab-icon-wrap">
            <ion-icon :icon="homeSharp" />
          </div>
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <!-- ── Notifikasi Tab ── -->
        <ion-tab-button tab="notifications" href="/notifications">
          <div class="tab-icon-wrap notif-wrap">
            <ion-icon :icon="notificationsSharp" />
            <span v-if="unreadCount > 0" class="notif-badge">
              {{ unreadCount > 99 ? "99+" : unreadCount }}
            </span>
          </div>
          <ion-label>Notifikasi</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/profile">
          <div class="tab-icon-wrap">
            <ion-icon :icon="personSharp" />
          </div>
          <ion-label>Profile</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="logout" @click="showLogoutConfirm">
          <div class="tab-icon-wrap logout-wrap">
            <ion-icon :icon="logOutSharp" />
          </div>
          <ion-label>Logout</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
  alertController,
  useIonRouter,
} from "@ionic/vue";
import {
  homeSharp,
  personSharp,
  logOutSharp,
  notificationsSharp,
} from "ionicons/icons";
import { removeFcmToken } from '@/services/fcmService';
import { Capacitor } from '@capacitor/core';

const ionRouter = useIonRouter();
const getUser = localStorage.getItem("master_user");
const userData = JSON.parse(getUser || "{}");
const unreadCount = ref(0);
let poolInterval: ReturnType<typeof setInterval> | null = null;

// ── Fetch unread count ─────────────────────────────
const fetchUnreadCount = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const res = await api.get(`/notifications/${userData.user}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notifs = res.data?.data || [];
    unreadCount.value = notifs.filter((n: any) => !n.fields.is_read).length;
  } catch (e) {
    console.error("Gagal fetch notif count:", e);
  }
};

// ── Polling tiap 30 detik ──────────────────────────
onMounted(() => {
  fetchUnreadCount();
  poolInterval = setInterval(fetchUnreadCount, 30000);
});

onUnmounted(() => {
  if (poolInterval) clearInterval(poolInterval);
});

// ── Logout ─────────────────────────────────────────
const logout = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await removeFcmToken();
    }

    localStorage.clear();
    ionRouter.navigate("/login", "root", "replace");
    await showToast("Logout Berhasil. Sampai Bertemu Lagi!", "primary");
  } catch (error) {
    console.error("Logout gagal:", error);
    await showToast("Terjadi Kesalahan Sistem", "danger");
  }
};

const showLogoutConfirm = async () => {
  const alert = await alertController.create({
    header: "Konfirmasi Logout",
    message: "Apakah Anda yakin ingin logout?",
    cssClass: "logout-alert",
    buttons: [
      { text: "Batal", role: "cancel", cssClass: "alert-btn-cancel" },
      {
        text: "Logout",
        cssClass: "alert-btn-logout",
        handler: async () => await logout(),
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
ion-tab-bar {
  --background: #ffffff;
  --border: none;
  padding: 8px 8px 12px;
  padding-bottom: 10%;
  height: 68px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  border-top: 1px solid #f1f5f9;
}

ion-tab-button {
  --color: #94a3b8;
  --color-selected: #2563eb;
  --ripple-color: transparent;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
}

ion-tab-button ion-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  margin-top: 2px;
}

.tab-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 30px;
  border-radius: 14px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.tab-icon-wrap ion-icon {
  font-size: 20px;
  transition: transform 0.2s ease;
}

ion-tab-button.tab-selected .tab-icon-wrap,
ion-tab-button[aria-selected="true"] .tab-icon-wrap {
  background: #eff6ff;
}

ion-tab-button.tab-selected .tab-icon-wrap ion-icon,
ion-tab-button[aria-selected="true"] .tab-icon-wrap ion-icon {
  transform: scale(1.1);
}

/* ── Badge merah unread ── */
.notif-wrap {
  position: relative;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #fff;
  line-height: 1;
}

.logout-wrap ion-icon {
  color: #ef4444;
}

ion-tab-button:last-child {
  --color: #ef4444;
  --color-selected: #ef4444;
}
ion-tab-button:last-child ion-label {
  color: #ef4444;
}

ion-tab-button:active .tab-icon-wrap {
  transform: scale(0.92);
}
</style>