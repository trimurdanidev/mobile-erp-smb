<template>
  <ion-page>
    <ion-content :fullscreen="true" color="full">
      <div class="login-container">
        <ion-card>
          <img src="/public/smb_logo_new.png" alt="logo-smb" class="" />
          <ion-card-header>
            <ion-card-title class="ion-text-center">Login</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Username</ion-label>
              <ion-input
                v-model="username"
                type="text"
                required
                class="block"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Password</ion-label>
              <ion-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="block"
              ></ion-input>
              <ion-icon
                :icon="showPassword ? eyeOff : eye"
                slot="end"
                class="password-toggle"
                @click="togglePassword"
              ></ion-icon>
            </ion-item>
            <br />
            <ion-button expand="block" @click="login" :disabled="loading">
              <ion-spinner v-if="loading"></ion-spinner>
              <span v-else>Login</span>
            </ion-button>
            <br />
            <!-- <ion-item> -->
            <ion-label position="stacked">Lupa Password ?</ion-label>
            <ion-button
              id="reset-pass"
              color="danger"
              expand="block"
              @click="isAlertOpen"
              :disabled="true"
              >Reset Password</ion-button
            >
            <ion-alert
              trigger="reset-pass"
              header="Mohon Input Username ERP Anda"
              :buttons="alertButtons"
              :inputs="alertInputs"
            ></ion-alert>
            <!-- </ion-item> -->
            <br /><br />
            <p
              class="mt-10 text-center align-text-bottom text-xs font-normal text-gray-900"
            >
              <center>
                © FAH Software 2025. All rights reserved.<br />Versi 0.2.1
              </center>
            </p>
          </ion-card-content>
        </ion-card>
      </div>
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonAlert,
} from "@ionic/vue";
import { eye, eyeOff } from "ionicons/icons";
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonSpinner,
    IonAlert,
  },
  setup() {
    const username = ref("");
    const password = ref("");
    const showPassword = ref(false);
    const loading = ref(false);
    const router = useRouter();

    const togglePassword = () => {
      showPassword.value = !showPassword.value;
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

        // router.push("/"); // Redirect ke halaman utama

        //clearForm
        username.value = "";
        password.value = "";
        router.push("/");
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

    const alertButtons = ref([
      {
        text: "Tidak",
        role: "cancel",
      },
      {
        text: "Ya",
        handler: async () => {
          resetPass();
        },
      },
    ]);

    const resetPass = async () => {
      loading.value = true;
      try {
      } catch (error) {
      } finally {
        loading.value = false;
      }
    };

    // const alertButtons = ['OK'];
    const alertInputs = ref([
      {
        placeholder: "Username",
      },
      {
        placeholder: "Nickname (max 8 characters)",
        attributes: {
          maxlength: 8,
        },
      },
      {
        type: "number",
        placeholder: "Age",
        min: 1,
        max: 100,
      },
      {
        type: "textarea",
        placeholder: "A little about yourself",
      },
    ]);

    const showLogoutConfirm = () => {
      isAlertOpen.value = true;
    };

    // Tombol di dalam dialog

    return {
      username,
      password,
      showPassword,
      togglePassword,
      login,
      loading,
      eye,
      eyeOff,
    };
  },
};
</script>
  
  <style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: darkgray;
}

.password-toggle {
  cursor: pointer;
  font-size: 20px;
}
.login-title {
  text-align: center; /* Pusatkan teks */
  font-size: 30px;
  font-weight: bolder;
  margin-bottom: 30px;
  /* background-color: darkgray; */
}

.inner-scroll {
  background-color: darkgray;
}

.btn-reset {
  background-color: red;
  color: whitesmoke;
  flood-color: red;
}
</style>
  