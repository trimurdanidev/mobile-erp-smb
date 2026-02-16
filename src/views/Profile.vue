<template>
  <ion-page>
    <ion-content>
      <!-- <ion-refresher slot="fixed" @ionRefresh="refreshData">
        <ion-refresher-content
          pulling-icon="chevron-down-circle-outline"
          refreshing-spinner="crescent"
        ></ion-refresher-content>
      </ion-refresher> -->

      <div class="profile-wrapper">
        <!-- Hero / Avatar Section -->
        <div class="hero-section">
          <div class="avatar-wrap">
            <ion-avatar class="avatar">
              <img
                v-if="geterUser?.data?.avatar"
                :src="geterUser.data.avatar"
                alt="Foto Profil"
              />
              <img
                v-else
                src="/public/user.png"
                alt="Default Avatar"
                style="background-color: #e2e8f0"
              />
            </ion-avatar>
            <button
              class="camera-btn"
              @click="changeAvatar"
              aria-label="Ganti Foto"
            >
              <ion-icon :icon="camera"></ion-icon>
            </button>
          </div>
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            accept=".jpg,.jpeg,.png"
            @change="onFileChange"
          />
          <h2 class="hero-name">{{ geterUser?.data?.description || "—" }}</h2>
          <span class="hero-dept">{{
            geterUser?.data?.department_name || "—"
          }}</span>
        </div>

        <!-- Info Card -->
        <div class="info-card" v-if="user">
          <div class="section-label">Informasi Akun</div>
          <div class="info-row">
            <div class="info-icon-wrap blue-bg">
              <ion-icon :icon="personOutline"></ion-icon>
            </div>
            <div class="info-content">
              <span class="info-key">Nama Lengkap</span>
              <span class="info-val">{{
                geterUser?.data?.description || "Belum tersedia"
              }}</span>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-row">
            <div class="info-icon-wrap purple-bg">
              <ion-icon :icon="cardOutline"></ion-icon>
            </div>
            <div class="info-content">
              <span class="info-key">NIK</span>
              <span class="info-val">{{
                geterUser?.data?.nik || "Belum tersedia"
              }}</span>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-row">
            <div class="info-icon-wrap teal-bg">
              <ion-icon :icon="atOutline"></ion-icon>
            </div>
            <div class="info-content">
              <span class="info-key">Username</span>
              <span class="info-val">{{
                geterUser?.data?.user || "Belum tersedia"
              }}</span>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-row">
            <div class="info-icon-wrap green-bg">
              <ion-icon :icon="phonePortraitOutline"></ion-icon>
            </div>
            <div class="info-content">
              <span class="info-key">Nomor HP</span>
              <span class="info-val">{{
                geterUser?.data?.phone || "Belum tersedia"
              }}</span>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-row">
            <div class="info-icon-wrap orange-bg">
              <ion-icon :icon="businessOutline"></ion-icon>
            </div>
            <div class="info-content">
              <span class="info-key">Departemen</span>
              <span class="info-val">{{
                geterUser?.data?.department_name || "Belum tersedia"
              }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-section">
          <button class="action-btn btn-edit" @click="showModalProfile = true">
            <ion-icon :icon="createOutline"></ion-icon>
            <span>Edit Profil</span>
          </button>
          <button class="action-btn btn-password" @click="showModal = true">
            <ion-icon :icon="lockClosedOutline"></ion-icon>
            <span>Ganti Password</span>
          </button>
          <button class="action-btn btn-logout" @click="logout">
            <ion-icon :icon="logOutOutline"></ion-icon>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <!-- Alert Logout -->
      <ion-alert
        :is-open="isAlertOpen"
        header="Konfirmasi Logout"
        message="Apakah Anda yakin ingin logout?"
        :buttons="alertButtons"
        @didDismiss="isAlertOpen = false"
      />

      <!-- Modal Change Password -->
      <ion-modal :is-open="showModal" @did-dismiss="closeModal">
        <ion-header>
          <ion-toolbar class="modal-toolbar">
            <div class="modal-header-inner">
              <div class="modal-title-block">
                <ion-icon
                  :icon="lockClosedOutline"
                  class="modal-title-icon"
                ></ion-icon>
                <span class="modal-title-text">Ganti Password</span>
              </div>
              <button class="modal-close-btn" @click="closeModal">
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="modal-body">
            <div class="custom-field">
              <label class="custom-label">
                <ion-icon
                  :icon="lockClosedOutline"
                  class="field-icon"
                ></ion-icon>
                Password Baru
              </label>
              <div class="custom-input-wrap">
                <input
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  class="custom-input"
                  placeholder="Masukkan password baru"
                />
                <button class="eye-btn" @click="togglePassword" tabindex="-1">
                  <ion-icon
                    :icon="showPassword ? eyeOff : eye"
                    class="eye-icon"
                  ></ion-icon>
                </button>
              </div>
            </div>
            <div class="custom-field">
              <label class="custom-label">
                <ion-icon
                  :icon="lockClosedOutline"
                  class="field-icon"
                ></ion-icon>
                Konfirmasi Password
              </label>
              <div class="custom-input-wrap">
                <input
                  v-model="confirmPassword"
                  :type="showPasswordConf ? 'text' : 'password'"
                  class="custom-input"
                  placeholder="Ulangi password baru"
                />
                <button class="eye-btn" @click="togglePasswordConf" tabindex="-1">
                  <ion-icon
                    :icon="showPasswordConf ? eyeOff : eye"
                    class="eye-icon"
                  ></ion-icon>
                </button>
              </div>
            </div>
            <button class="modal-save-btn" @click="changePassword">
              <ion-icon :icon="checkmarkOutline"></ion-icon>
              Simpan Password
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Modal Edit Profile -->
      <ion-modal :is-open="showModalProfile" @did-dismiss="closeModalProfile">
        <ion-header>
          <ion-toolbar class="modal-toolbar">
            <div class="modal-header-inner">
              <div class="modal-title-block">
                <ion-icon
                  :icon="createOutline"
                  class="modal-title-icon"
                ></ion-icon>
                <span class="modal-title-text">Edit Profil</span>
              </div>
              <button class="modal-close-btn" @click="closeModalProfile">
                <ion-icon :icon="closeOutline"></ion-icon>
              </button>
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="modal-body">
            <div class="custom-field">
              <label class="custom-label">
                <ion-icon :icon="personOutline" class="field-icon"></ion-icon>
                Nama Lengkap
              </label>
              <div class="custom-input-wrap">
                <input
                  v-model="description"
                  type="text"
                  class="custom-input"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>
            <div class="custom-field">
              <label class="custom-label readonly-label">
                <ion-icon
                  :icon="cardOutline"
                  class="field-icon field-icon-muted"
                ></ion-icon>
                NIK
                <span class="readonly-badge">Tidak dapat diubah</span>
              </label>
              <div class="custom-input-wrap input-wrap-readonly">
                <input
                  v-model="nik"
                  type="text"
                  class="custom-input input-readonly-text"
                  readonly
                />
              </div>
            </div>
            <div class="custom-field">
              <label class="custom-label readonly-label">
                <ion-icon
                  :icon="atOutline"
                  class="field-icon field-icon-muted"
                ></ion-icon>
                Username
                <span class="readonly-badge">Tidak dapat diubah</span>
              </label>
              <div class="custom-input-wrap input-wrap-readonly">
                <input
                  v-model="user"
                  type="text"
                  class="custom-input input-readonly-text"
                  readonly
                />
              </div>
            </div>
            <div class="custom-field">
              <label class="custom-label">
                <ion-icon
                  :icon="phonePortraitOutline"
                  class="field-icon"
                ></ion-icon>
                No. Handphone
              </label>
              <div class="custom-input-wrap">
                <input
                  v-model="phone"
                  type="tel"
                  class="custom-input"
                  placeholder="Masukkan nomor HP"
                />
              </div>
            </div>
            <div class="custom-field">
              <label class="custom-label readonly-label">
                <ion-icon
                  :icon="businessOutline"
                  class="field-icon field-icon-muted"
                ></ion-icon>
                Departemen
                <span class="readonly-badge">Tidak dapat diubah</span>
              </label>
              <div class="custom-input-wrap input-wrap-readonly">
                <input
                  v-model="department_name"
                  type="text"
                  class="custom-input input-readonly-text"
                  readonly
                />
              </div>
            </div>
            <button class="modal-save-btn" @click="saveProfile">
              <ion-icon :icon="checkmarkOutline"></ion-icon>
              Simpan Perubahan
            </button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import { showToast } from "@/services/toastHandlers";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAvatar,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  loadingController,
} from "@ionic/vue";
import {
  camera,
  personOutline,
  cardOutline,
  atOutline,
  phonePortraitOutline,
  businessOutline,
  createOutline,
  lockClosedOutline,
  logOutOutline,
  closeOutline,
  checkmarkOutline,
  eye,
  eyeOff,
} from "ionicons/icons";

const user = ref(null);
const router = useRouter();
const userData = ref(null);
const getUser = localStorage.getItem("master_user");
const parsedUser = ref(null);
const geterUser = ref(null);
const nik = ref(null);
const description = ref(null);
const phone = ref(null);
const department_name = ref(null);
let loading = null;
const showPassword = ref(false);
const showPasswordConf = ref(false);

const showLoading = async () => {
  loading = await loadingController.create({
    message: "Tunggu sebentar...",
    spinner: "dots",
  });
  await loading.present();
};
const hideLoading = async () => {
  if (loading) await loading.dismiss();
};

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    userData.value = JSON.parse(getUser);
    const response = api.get("showByUser/" + userData.value.user, {
      headers: { Authorization: `Bearer ${token}` },
    });
    user.value = (await response).data;
    parsedUser.value = JSON.stringify(user.value);
    geterUser.value = JSON.parse(parsedUser.value);
    phone.value = geterUser.value.data.phone;
    nik.value = geterUser.value.data.nik;
    description.value = geterUser.value.data.description;
    department_name.value = geterUser.value.data.department_name;
    user.value = geterUser.value.data.user;
    showToast("✅ Data pengguna:" + geterUser.value.data.user, "success");
  } catch (error) {
    console.error(
      "❌ Gagal mengambil data pengguna:",
      error.response?.data || error
    );
    if (error.response?.status === 401) logout();
  }
};

const isAlertOpen = ref(false);
const logout = async () => {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("master_user");
    localStorage.clear();
    await showToast("Logout Berhasil. Sampai Bertemu Lagi!", "primary");
    router.replace("/login");
  } catch (error) {
    console.error("Logout gagal:", error);
    await showToast("Terjadi Kesalahan Sistem", "danger");
  }
};
const showLogoutConfirm = () => {
  isAlertOpen.value = true;
};
const alertButtons = [
  { text: "Batal", role: "cancel" },
  {
    text: "Logout",
    handler: async () => {
      await logout();
    },
  },
];
const refreshData = async (event) => {
  await fetchUserProfile();
  event.target.complete();
};
onMounted(fetchUserProfile);

const showModal = ref(false);
const showModalProfile = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const closeModal = () => {
  showModal.value = false;
};
const closeModalProfile = () => {
  showModalProfile.value = false;
};

const changePassword = async () => {
  await showLoading();

  if (!newPassword.value || !confirmPassword.value) {
    await hideLoading();
    await showToast("Password baru dan konfirmasi wajib diisi!", "warning");
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    await hideLoading();
    await showToast("Password baru dan konfirmasi tidak cocok!", "danger");
    return;
  }

  if (newPassword.value.length < 6) {
    await hideLoading();
    await showToast("Password minimal harus 6 karakter!", "warning");
    return;
  }

  try {
    await api.put("/update/" + userData.value.id, {
      password: newPassword.value,
    });
    await hideLoading();
    await showToast("Berhasil Ganti Password", "success");
  } catch (error) {
    await hideLoading();
    await showToast(error.response.data.message, "danger");
  } finally {
    await hideLoading();
  }
  closeModal();
};

const saveProfile = async () => {
  await showLoading();
  try {
    await api.put("/update/" + userData.value.id, {
      phone: phone.value,
      description: description.value,
    });
    await fetchUserProfile();
    await hideLoading();
    await showToast("Profile has been updated!", "success");
  } catch (error) {
    await hideLoading();
    await showToast(error.response.data.message, "danger");
  } finally {
    await hideLoading();
  }
  closeModalProfile();
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const togglePasswordConf = () => {
  showPasswordConf.value = !showPasswordConf.value;
};

const fileInput = ref(null);
const changeAvatar = () => {
  fileInput.value.click();
};
const onFileChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const response = await api.post(
        "/upload-avatar/" + userData.value.id,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.data.success)
        geterUser.value.data.avatar = response.data.avatarUrl;
    } catch (error) {
      await showToast(error.response.data.message, "danger");
    }
  }
};
</script>

<style scoped>
ion-content {
  --background: #f0f4f8;
  background: #1e3a8a 0%, #2563eb 100%;
}
.profile-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 0 40px;
}

/* Hero */
.hero-section {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  padding: 52px 20px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-radius: 0 0 32px 32px;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
}
.avatar-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 4px;
}
.avatar {
  width: 100px !important;
  height: 100px !important;
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  overflow: hidden;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-btn {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.camera-btn ion-icon {
  font-size: 16px;
  color: #2563eb;
}
.hero-name {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  text-align: center;
}
.hero-dept {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.12);
  padding: 4px 14px;
  border-radius: 20px;
}

/* Section Label */
.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 0 4px 4px;
}

/* Info Card */
.info-card {
  background: #fff;
  border-radius: 20px;
  margin: 0 16px;
  padding: 16px 16px 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}
.info-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
}
.info-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-icon-wrap ion-icon {
  font-size: 18px;
  color: #fff;
}
.blue-bg {
  background: linear-gradient(135deg, #4a90e2, #2563eb);
}
.purple-bg {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}
.teal-bg {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
}
.green-bg {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.orange-bg {
  background: linear-gradient(135deg, #f97316, #ea580c);
}
.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.info-key {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.info-val {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info-divider {
  height: 1px;
  background: #f1f5f9;
  margin-left: 52px;
}

/* Action Buttons */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 18px;
  border-radius: 16px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.action-btn:active {
  transform: scale(0.97);
}
.action-btn ion-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.btn-edit {
  background: #eff6ff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}
.btn-edit ion-icon {
  color: #2563eb;
}
.btn-password {
  background: #f0fdf4;
  color: #16a34a;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.1);
}
.btn-password ion-icon {
  color: #16a34a;
}
.btn-logout {
  background: #fff1f2;
  color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}
.btn-logout ion-icon {
  color: #ef4444;
}

/* Modal Header */
.modal-toolbar {
  --background: #fff;
  --border-color: transparent;
  padding: 0;
  padding-top: 1%;
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
  color: #2563eb;
  background: #eff6ff;
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

/* Modal Content */
.modal-content {
  --background: #f0f4f8;
}
.modal-body {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Custom Fields */
.custom-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.custom-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  padding-left: 2px;
}
.field-icon {
  font-size: 15px;
  color: #2563eb;
}
.custom-input-wrap {
  /* background: #fff;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05); */

  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.custom-input-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.custom-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  background: transparent;
  border: none;
  outline: none;
  box-sizing: border-box;
}
.custom-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

/* Readonly variants */
.readonly-label {
  color: #94a3b8;
}
.field-icon-muted {
  color: #94a3b8 !important;
}
.input-wrap-readonly {
  background: #f8fafc;
  border-color: #e2e8f0;
}
.input-wrap-readonly:focus-within {
  border-color: #e2e8f0;
  box-shadow: none;
}
.input-readonly-text {
  color: #94a3b8 !important;
  cursor: not-allowed;
}
.readonly-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
}

/* Save Button */
.modal-save-btn {
  margin-top: 8px;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  -webkit-tap-highlight-color: transparent;
}
.modal-save-btn:active {
  transform: scale(0.97);
}
.modal-save-btn ion-icon {
  font-size: 18px;
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
</style>

<!-- Style global untuk alertController — tidak bisa scoped -->
<style>
.custom-alert .alert-wrapper {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;
}

.custom-alert .alert-head {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%) !important;
  padding: 18px 20px 14px !important;
}

.custom-alert .alert-title {
  color: #ffffff !important;
  font-size: 17px !important;
  font-weight: 800 !important;
  letter-spacing: -0.2px;
}

.custom-alert .alert-message {
  color: #334155 !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 1.6 !important;
  padding: 16px 20px !important;
}

.custom-alert .alert-button-group {
  padding: 4px 12px 12px !important;
}

.custom-alert .alert-button {
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  color: #2563eb !important;
}

.custom-alert .alert-button:last-child {
  background: linear-gradient(135deg, #1e3a8a, #2563eb) !important;
  color: #ffffff !important;
  border-radius: 12px !important;
}

.custom-alert .alert-button:last-child .alert-button-inner {
  color: #ffffff !important;
  justify-content: center;
}
</style>