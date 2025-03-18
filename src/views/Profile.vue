<template>
  <ion-page>
    <!-- Header -->

    <!-- Konten Profil -->
    <ion-content color="full">
      <div class="content-container">
        <ion-header>
          <ion-toolbar>
            <ion-title>Profil Pengguna</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-refresher slot="fixed" @ionRefresh="refreshData">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <ion-card v-if="user">
          <ion-card-header>
            <ion-card-title class="ion-text-center"
              >Halo, {{ geterUser.data.user }} 👋</ion-card-title
            >
          </ion-card-header>

          <ion-card-content class="ion-text-center">
            <ion-avatar class="avatar">
              <img
                v-if="geterUser.data.avatar"
                :src="geterUser.data.avatar"
                alt="Foto Profil"
              />
              <img
                v-else
                style="background-color: white;"
                src="/public/user.png"
                alt="Default Avatar"
              />
              <!-- Icon Kamera -->
              <ion-icon
                :icon="camera"
                class="camera-icon"
                @click="changeAvatar"
              ></ion-icon>
            </ion-avatar>
            <!-- File Input untuk Mengubah Avatar -->
            <input
              type="file"
              ref="fileInput"
              style="display: none"
              accept=".jpg, .jpeg, .png"
              @change="onFileChange"
            />

            <ion-grid>
              <ion-row>
                <ion-col size="5" class="text-align-left">Nama Lengkap</ion-col>
                <ion-col size="2" class="text-align-center">:</ion-col>
                <ion-col size="5" class="text-align-right">
                  <strong>{{ geterUser.data.description || "Belum tersedia" }}</strong>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="5" class="text-align-left">NIK</ion-col>
                <ion-col size="2" class="text-align-center">:</ion-col>
                <ion-col size="5" class="text-align-right">
                  <strong>{{ geterUser.data.nik || "Belum tersedia" }}</strong>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="5" class="text-align-left">Username</ion-col>
                <ion-col size="2" class="text-align-center">:</ion-col>
                <ion-col size="5" class="text-align-right">
                  <strong>{{ geterUser.data.user || "Belum tersedia" }}</strong>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="5" class="text-align-left">Nomor HP</ion-col>
                <ion-col size="2" class="text-align-center">:</ion-col>
                <ion-col size="5" class="text-align-right">
                  <strong>{{ geterUser.data.phone  || "Belum tersedia" }}</strong>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="5" class="text-align-left">Departemen</ion-col>
                <ion-col size="2" class="text-align-center">:</ion-col>
                <ion-col size="5" class="text-align-right">
                  <strong>{{ geterUser.data.department_name || "Belum tersedia" }}</strong>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
          <div class="edit-profile-button">
            <ion-button expand="block" color="success" @click="showModalProfile = true">Edit Profile</ion-button>
          </div>
        </ion-card>
          
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-button expand="block" color="primary" @click="showModal = true">Change Password</ion-button>
            </ion-col>
            <ion-col size="6">
              <ion-button expand="block" color="danger" @click="logout">Logout</ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-alert
          :is-open="isAlertOpen"
          header="Konfirmasi Logout"
          message="Apakah Anda yakin ingin logout?"
          :buttons="alertButtons"
          @didDismiss="isAlertOpen = false"
        />
      </div>

      <!-- Modal untuk Change Password -->
      <ion-modal :is-open="showModal" @did-dismiss="closeModal">
        <ion-header>
          <ion-toolbar style="padding-top: 20px;">
            <ion-title>Change Password</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <!-- Form untuk input password -->
          <ion-item>
            <ion-label position="floating">New Password</ion-label>
            <ion-input v-model="newPassword" type="password" required></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Confirm New Password</ion-label>
            <ion-input v-model="confirmPassword" type="password" required></ion-input>
          </ion-item>
          <ion-button expand="block" @click="changePassword">Change Password</ion-button>
        </ion-content>
      </ion-modal>

      <!-- Modal untuk Edit Profile -->
      <ion-modal :is-open="showModalProfile" @did-dismiss="closeModalProfile">
        <ion-header>
          <ion-toolbar style="padding-top: 20px;">
            <ion-title>Change Password</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModalProfile">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <!-- Form untuk input password -->
          <!-- <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input v-model="email" type="text"></ion-input>
          </ion-item> -->
          <ion-item>
            <ion-input label="Nama Lengkap" v-model="description" label-placement="floating" placeholder="Enter text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="NIK" v-model="nik" label-placement="floating" placeholder="Enter text" readonly></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="Username" v-model="user" label-placement="floating" placeholder="Enter text" readonly></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="No. Handphone" v-model="phone" label-placement="floating" placeholder="Enter text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="Departemen" v-model="department_name" label-placement="floating" placeholder="Enter text" readonly></ion-input>
          </ion-item>
          <ion-button expand="block" @click="saveProfile">Save</ion-button>
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
  loadingController
} from "@ionic/vue";
import { camera } from "ionicons/icons";

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

const showLoading = async () => {
  loading = await loadingController.create({
    message: "Tunggu sebentar...",
    spinner: "dots",
  });
  await loading.present();
};

const hideLoading = async () => {
  if (loading) {
    await loading.dismiss();
  }
};

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("access_token"); // Ambil token dari localStorage
    if (!token) {
      console.warn("⚠️ Token tidak ditemukan! Mengarahkan ke login...");
      router.push("/login");
      return;
    }

    userData.value = JSON.parse(getUser);
    const response = api.get("showByUser/" + userData.value.user, {
      headers: { Authorization: `Bearer ${token}` },
    });

    user.value = (await response).data; // Pastikan struktur API benar
    parsedUser.value = JSON.stringify(user.value)
    geterUser.value = JSON.parse(parsedUser.value)
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
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expired! Mengarahkan ke login...");
      logout();
    }
  }
};
const isAlertOpen = ref(false);

const logout = async () => {
  try {
    // Hapus token & data user dari localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("master_user");
    localStorage.clear();

    // Redirect ke halaman login
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

// Tombol di dalam dialog
const alertButtons = [
  {
    text: "Batal",
    role: "cancel",
  },
  {
    text: "Logout",
    handler: async () => {
      await logout(); // Panggil fungsi logout jika user menekan "Logout"
    },
  },
];

// ** Refresh Data Saat Ditarik ke Bawah **
const refreshData = async (event) => {
  await fetchUserProfile();
  event.target.complete(); // Hentikan efek refresh
};

// Panggil fetchUserProfile saat halaman dimuat
onMounted(fetchUserProfile);

// change password
// Variabel untuk mengontrol modal
const showModal = ref(false);
const showModalProfile = ref(false);

// Variabel untuk input form
const newPassword = ref('');
const confirmPassword = ref('');

// Fungsi untuk menutup modal
const closeModal = () => {
  showModal.value = false;
};

const closeModalProfile = () => {
  showModalProfile.value = false;
};

// Fungsi untuk menangani submit
const changePassword = async () => {
  await showLoading();
  
  if (newPassword.value !== confirmPassword.value) {
    await hideLoading();
    alert('New password and confirm password do not match!');
    return;
  }

  // Logika untuk update password (misalnya API call)
  try {
    const response = await api.put("/update/" + userData.value.id, {
      password: newPassword.value,
    });
    await hideLoading();
    await showToast("Password changed successfully!", "success");
  } catch (error) {
    await hideLoading();
    await showToast(error.response.data.message, "danger");
  } finally {
    await hideLoading();
  }

  // Tutup modal setelah submit
  closeModal();
};


// edit profile

// Fungsi untuk menangani submit
const saveProfile = async () => {
  await showLoading();
  // Logika untuk update password (misalnya API call)
  try {
    const response = await api.put("/update/" + userData.value.id, {
      phone: phone.value,
      description: description.value
      // username: username.value,
      // nik: nik.value,
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

  // Tutup modal setelah submit
  closeModalProfile();
};




// change profile avatar
const fileInput = ref(null);

// Fungsi untuk memicu file input
const changeAvatar = () => {
  fileInput.value.click();  // Trigger file input
};

// Fungsi untuk menangani perubahan file
const onFileChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const response = await api.post('/upload-avatar/' + userData.value.id, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Sertakan token jika Anda menggunakan otentikasi
          // 'Authorization': `Bearer ${authToken}`
        },
      });

      // Setelah gambar berhasil diupload, perbarui avatar pengguna
      if (response.data.success) {
        console.log(response.data)
        geterUser.value.data.avatar = response.data.avatarUrl; // URL gambar baru
      }
    } catch (error) {
      await showToast(error.response.data.message, "danger");
      console.error('Error uploading avatar:', error);
    }
  }
};
</script>

<style scoped>
.content-container {
  display: block;
  gap: 0px;
  justify-content: center;
  align-items: center;
  height: 90vh;
  background-color: darkgray;
}
ion-button {
  font-size: 12px;
}

.edit-profile-button {
  width: 150px;
  margin: auto;
}

.avatar {
  margin: 20px auto;
  width: 200px;
  height: 200px;
  position: relative;
}

.camera-icon {
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 30px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 8px;
  cursor: pointer;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>
