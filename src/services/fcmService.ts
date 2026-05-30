import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import api from "@/services/api";
import router from "@/router";
import { showToast } from "@/services/toastHandlers";
import { playNotifSound } from "@/services/audioService";
import { ref } from "vue";

const userId = ref([]);

// ── Helper ambil data user dari localStorage ───────
const getMasterUser = () => {
  try {
    const raw = localStorage.getItem("master_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getToken = () => localStorage.getItem("access_token");

// ── Simpan FCM token ke backend ────────────────────
const saveFcmToken = async (fcmToken: string) => {
  try {
    // Ambil user_id dari localStorage
    const masterUser = JSON.parse(localStorage.getItem("master_user") || "{}");

    // Sesuaikan field-nya dengan response login kamu
    // Cek dulu dengan: console.log(masterUser)
    const userId = masterUser.value.user;

    if (!userId) {
      console.warn("[FCM] user_id tidak ditemukan di localStorage");
      return;
    }

    await api.post("/notifications/fcm-token", {
      user_id: userId,
      fcm_token: fcmToken,
    });

    console.log("[FCM] Token tersimpan untuk user:", userId);
  } catch (err) {
    console.error("[FCM] Gagal simpan token:", err);
  }
};

// ── Init FCM ───────────────────────────────────────
export const initFCM = async () => {
  try {
    // 1. Minta izin notifikasi
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") {
      showToast("[FCM] Izin notifikasi ditolak", "danger");
      return;
    }

    // 2. Register ke FCM
    await PushNotifications.register();
  } catch (e) {
    console.error("[FCM] initFCM error:", e);
    return; // ← jangan force close, return saja
  }

  try {
    // 3. Dapat token → kirim ke backend
    PushNotifications.addListener(
      "registration",
      async ({ value: fcmToken }) => {
        await saveFcmToken(fcmToken);
      },
    );

    // 4. Error register
    PushNotifications.addListener("registrationError", (err) => {
      showToast("[FCM] Registration error:", "danger");
      console.error("[FCM] Registration error:", err);
    });

    // 5. Notif diterima saat app FOREGROUND
    PushNotifications.addListener(
      "pushNotificationReceived",
      async (notification) => {
        console.log("[FCM] Notif foreground:", notification);
        playNotifSound();
        try {
          // Tampilkan sebagai local notification supaya tetap muncul
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 10000),
                title: notification.title || "Notifikasi",
                body: notification.body || "",
                schedule: { at: new Date(Date.now() + 500) },
                extra: notification.data,
              },
            ],
          });
        } catch (e) {
          console.error("[FCM] LocalNotif error:", e);
        }
      },
    );

    // 6. User tap notif (app background/killed)
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        console.log("[FCM] Notif di-tap:", action);
        const eventType = action.notification.data?.event_type;

        // Navigasi berdasarkan tipe event
        const routeMap: Record<string, string> = {
          absensi: "/notifications",
          jadwal: "/notifications",
          pengumuman: "/notifications",
        };

        const target = routeMap[eventType] || "/notifications";
        router.push(target);
      },
    );
  } catch (e) {
    console.error("[FCM] Listener error:", e);
  }
};

// ── Hapus FCM token saat logout ────────────────────
export const removeFcmToken = async () => {
  try {
    const fcmToken = localStorage.getItem("fcm_token");
    const userData = getMasterUser();
    if (!fcmToken || !userData) return;

    await api.delete("/notifications/fcm-token", {
      data: { user_id: userData.user, fcm_token: fcmToken },
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    localStorage.removeItem("fcm_token");
    await PushNotifications.removeAllListeners();
    console.log("[FCM] Token dihapus");
  } catch (e) {
    console.error("[FCM] Gagal hapus token:", e);
  }
};
