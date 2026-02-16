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
  IonTitle,
  IonToolbar,
  alertController,
  useIonRouter,
} from "@ionic/vue";
import { homeSharp, personSharp, logOutSharp } from "ionicons/icons";
import router from "@/router";

const getUser = localStorage.getItem("master_user");
const ionRouter = useIonRouter();

const logout = async () => {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("master_user");
    localStorage.clear();

    // router.replace("/login");
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
      {
        text: "Batal",
        role: "cancel",
        cssClass: "alert-btn-cancel",
      },
      {
        text: "Logout",
        cssClass: "alert-btn-logout",
        handler: async () => {
          await logout();
        },
      },
    ],
  });
  await alert.present();
};
</script>

<style scoped>
/* ─── Tab Bar ───────────────────────────────────── */
ion-tab-bar {
  --background: #ffffff;
  --border: none;
  padding: 8px 8px 12px;
  padding-bottom: 10%;
  height: 68px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  border-top: 1px solid #f1f5f9;
}

/* ─── Tab Button ────────────────────────────────── */
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

/* ─── Icon Wrap ─────────────────────────────────── */
.tab-icon-wrap {
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

/* ─── Active State ──────────────────────────────── */
ion-tab-button.tab-selected .tab-icon-wrap,
ion-tab-button[aria-selected="true"] .tab-icon-wrap {
  background: #eff6ff;
}

ion-tab-button.tab-selected .tab-icon-wrap ion-icon,
ion-tab-button[aria-selected="true"] .tab-icon-wrap ion-icon {
  transform: scale(1.1);
}

/* ─── Logout Tab ────────────────────────────────── */
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

/* Tap feedback */
ion-tab-button:active .tab-icon-wrap {
  transform: scale(0.92);
}
</style>

<style>
/* ─── Logout Alert ──────────────────────────────── */
.logout-alert .alert-wrapper {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;
}

.logout-alert .alert-head {
  background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%) !important;
  padding: 18px 20px 14px !important;
}

.logout-alert .alert-title {
  color: #ffffff !important;
  font-size: 17px !important;
  font-weight: 800 !important;
  letter-spacing: -0.2px;
}

.logout-alert .alert-message {
  color: #334155 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 1.6 !important;
  padding: 16px 20px !important;
}

.logout-alert .alert-button-group {
  padding: 4px 12px 12px !important;
  gap: 8px;
  display: flex;
}

/* Tombol Batal */
.logout-alert .alert-btn-cancel {
  flex: 1;
  border-radius: 12px !important;
  background: #f1f5f9 !important;
  font-weight: 700 !important;
  font-size: 14px !important;
}

.logout-alert .alert-btn-cancel .alert-button-inner {
  color: #64748b !important;
  justify-content: center;
}

/* Tombol Logout */
.logout-alert .alert-btn-logout {
  flex: 1;
  border-radius: 12px !important;
  background: linear-gradient(135deg, #dc2626, #ef4444) !important;
  font-weight: 700 !important;
  font-size: 14px !important;
}

.logout-alert .alert-btn-logout .alert-button-inner {
  color: #ffffff !important;
  justify-content: center;
}
</style>