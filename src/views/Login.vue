<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="login-bg">

        <!-- Top Wave / Hero -->
        <div class="login-hero">
          <img src="/public/smb_logo_new.png" alt="logo-smb" class="hero-logo" />
          <h1 class="hero-title">ERP SMB</h1>
          <p class="hero-sub">Sistem Absensi & Manajemen Karyawan</p>
        </div>

        <!-- Login Card -->
        <div class="login-card">
          <h2 class="card-title">Masuk ke Akun</h2>
          <p class="card-sub">Masukkan kredensial Anda untuk melanjutkan</p>

          <!-- Username -->
          <div class="input-group">
            <label class="input-label">
              <ion-icon :icon="personOutline" class="input-label-icon"></ion-icon>
              Username
            </label>
            <div class="input-wrap" :class="{ 'input-focus': focusUser }">
              <input
                v-model="username"
                type="text"
                class="custom-input"
                placeholder="Masukkan username"
                @focus="focusUser = true"
                @blur="focusUser = false"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="input-group">
            <label class="input-label">
              <ion-icon :icon="lockClosedOutline" class="input-label-icon"></ion-icon>
              Password
            </label>
            <div class="input-wrap" :class="{ 'input-focus': focusPass }">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="custom-input"
                placeholder="Masukkan password"
                @focus="focusPass = true"
                @blur="focusPass = false"
                @keyup.enter="login"
              />
              <button class="eye-btn" @click="togglePassword" tabindex="-1">
                <ion-icon :icon="showPassword ? eyeOff : eye" class="eye-icon"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Login Button -->
          <button
            class="login-btn"
            :class="{ 'login-btn-loading': loading }"
            @click="login"
            :disabled="loading"
          >
            <ion-spinner v-if="loading" name="crescent" class="login-spinner"></ion-spinner>
            <template v-else>
              <ion-icon :icon="logInOutline" class="login-btn-icon"></ion-icon>
              Login
            </template>
          </button>

          <!-- Divider -->
          <div class="divider">
            <span class="divider-line"></span>
            <span class="divider-text">atau</span>
            <span class="divider-line"></span>
          </div>

          <!-- Reset Password -->
          <div class="forgot-row">
            <span class="forgot-label">Lupa password?</span>
            <button class="reset-btn" @click="showResetModal = true">
              <ion-icon :icon="keyOutline" class="reset-icon"></ion-icon>
              Reset Password
            </button>
          </div>

          <!-- Footer -->
          <p class="footer-text">© FAH Software 2025. All rights reserved.<br />Versi 2.0.1</p>
        </div>

      </div>

      <!-- ── Modal Reset Password ──────────────────── -->
      <ion-modal :is-open="showResetModal" @didDismiss="closeModal">
        <ion-header>
          <ion-toolbar class="modal-toolbar">
            <div class="modal-header-inner">
              <div class="modal-title-block">
                <ion-icon :icon="keyOutline" class="modal-title-icon"></ion-icon>
                <span class="modal-title-text">Reset Password</span>
              </div>
              <button class="modal-close-btn" @click="closeModal">
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="modal-body">
            <p class="modal-desc">
              Masukkan nomor WhatsApp yang terdaftar. Password baru akan dikirim via WhatsApp.
            </p>
            <div class="input-group">
              <label class="input-label">
                <ion-icon :icon="logoWhatsapp" class="input-label-icon wa-color"></ion-icon>
                Nomor WhatsApp
              </label>
              <div class="input-wrap">
                <input
                  v-model="whatsappNumber"
                  type="tel"
                  class="custom-input"
                  placeholder="08xxxxxxxxxx"
                  inputmode="numeric"
                  @keypress="onlyNumberInput"
                />
              </div>
            </div>
            <button class="modal-save-btn" @click="handleResetPassword">
              <ion-icon :icon="sendOutline"></ion-icon>
              Kirim
            </button>
          </div>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonAlert,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/vue";
import {
  eye,
  eyeOff,
  personOutline,
  lockClosedOutline,
  logInOutline,
  keyOutline,
  closeOutline,
  logoWhatsapp,
  sendOutline,
} from "ionicons/icons";
import { showToast } from "@/services/toastHandlers";
import api from "@/services/api";
import { computed } from "vue";

export default {
  components: {
    IonPage,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonSpinner,
    IonAlert,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
  },
  setup() {
    const username = ref("");
    const password = ref("");
    const showPassword = ref(false);
    const loading = ref(false);
    const router = useRouter();
    const showResetModal = ref(false);
    const whatsappNumber = ref("");
    const focusUser = ref(false);
    const focusPass = ref(false);

    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };

    const closeModal = () => {
      showResetModal.value = false;
    };

    const handleResetPassword = async () => {
      loading.value = true;
      try {
        const response = await api.post("/reset-password", {
          phone: whatsappNumber.value,
        });
        await showToast(response.data.message, "success");
        console.log(response.data.message);
        whatsappNumber.value = "";
        showResetModal.value = false;
      } catch (error) {
        if (error.response && error.response.data) {
          await showToast(error.response.data.message, "danger");
          loading.value = false;
        } else {
          await showToast("Terjadi kesalahan", "danger");
          loading.value = false;
        }
      } finally {
        loading.value = false;
      }
    };

    const onlyNumberInput = async (e) => {
      const charCode = e.key;
      if (!/^[0-9]$/.test(charCode)) {
        e.preventDefault();
      }
    };

    const login = async () => {
      if (!username.value)
        return await showToast("Username harus diisi!", "danger");
      else if (!password.value) {
        return await showToast("Password harus diisi!", "danger");
      }

      loading.value = true;

      try {
        const response = await api.post("/login", {
          user: username.value,
          password: password.value,
        });

        localStorage.setItem("access_token", response.data.access_token);
        const masterUser = response.data.master_user;
        localStorage.setItem("master_user", JSON.stringify(masterUser));

        username.value = "";
        password.value = "";
        router.replace("/");
        window.location.replace("/");
        await showToast(response.data.message, "success");
      } catch (error) {
        if (error.response && error.response.data) {
          await showToast(error.response.data.error, "danger");
          loading.value = false;
        } else {
          await showToast("Terjadi kesalahan", "danger");
          loading.value = false;
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      username,
      password,
      showPassword,
      togglePassword,
      login,
      loading,
      eye,
      eyeOff,
      personOutline,
      lockClosedOutline,
      logInOutline,
      keyOutline,
      closeOutline,
      logoWhatsapp,
      sendOutline,
      showResetModal,
      closeModal,
      handleResetPassword,
      whatsappNumber,
      onlyNumberInput,
      focusUser,
      focusPass,
    };
  },
};
</script>

<style scoped>
/* ─── Page Background ───────────────────────────── */
ion-content {
  --background: #f0f4f8;
}

.login-bg {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f4f8;
}

/* ─── Hero Section ──────────────────────────────── */
.login-hero {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  padding: 52px 24px 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border-radius: 0 0 36px 36px;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.35);
}

.hero-logo {
  width: 140px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
}

.hero-title {
  font-size: 26px;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.5px;
}

.hero-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  margin: 0;
  text-align: center;
  font-weight: 500;
  line-height: 1.4;
}

/* ─── Login Card ────────────────────────────────── */
.login-card {
  background: #ffffff;
  border-radius: 24px;
  margin: -20px 16px 32px;
  padding: 28px 20px 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.card-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 2px;
  letter-spacing: -0.3px;
}

.card-sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 4px;
  font-weight: 400;
}

/* ─── Input Groups ──────────────────────────────── */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.input-label-icon {
  font-size: 14px;
  color: #2563eb;
}

.wa-color { color: #22c55e; }

.input-wrap {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrap.input-focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: #ffffff;
}

.custom-input {
  flex: 1;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  background: transparent;
  border: none;
  outline: none;
  min-width: 0;
}

.custom-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.eye-btn {
  padding: 0 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  -webkit-tap-highlight-color: transparent;
}

.eye-icon {
  font-size: 20px;
  color: #94a3b8;
}

/* ─── Login Button ──────────────────────────────── */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  letter-spacing: 0.3px;
  -webkit-tap-highlight-color: transparent;
  margin-top: 4px;
}

.login-btn:active:not(.login-btn-loading) {
  transform: scale(0.97);
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.25);
}

.login-btn-loading {
  opacity: 0.75;
  cursor: not-allowed;
}

.login-btn-icon { font-size: 20px; }
.login-spinner { --color: #ffffff; width: 20px; height: 20px; }

/* ─── Divider ───────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.divider-text {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* ─── Reset Row ─────────────────────────────────── */
.forgot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.forgot-label {
  font-size: 13px;
  color: #64748b;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff1f2;
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
}
.reset-btn:active { transform: scale(0.96); }
.reset-icon { font-size: 16px; }

/* ─── Footer ────────────────────────────────────── */
.footer-text {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  margin: 4px 0 0;
  line-height: 1.6;
}

/* ─── Modal ─────────────────────────────────────── */
.modal-toolbar {
  --background: #ffffff;
  --border-color: transparent;
  padding: 0;
  box-shadow: 0 1px 0 #f1f5f9;
}

.modal-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
}

.modal-title-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title-icon {
  font-size: 20px;
  color: #ef4444;
  background: #fff1f2;
  padding: 7px;
  border-radius: 10px;
}

.modal-title-text {
  font-size: 17px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.3px;
}

.modal-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.modal-close-btn ion-icon {
  font-size: 18px;
  color: #64748b;
}

.modal-content { --background: #f0f4f8; }

.modal-body {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.modal-save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37,99,235,0.3);
  transition: transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.modal-save-btn:active { transform: scale(0.97); }
.modal-save-btn ion-icon { font-size: 18px; }
</style>