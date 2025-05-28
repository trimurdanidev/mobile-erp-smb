<template>
    <ion-page>
      <ion-content class="ion-padding">
        <div class="content-container">
          <ion-header>
            <ion-toolbar>
              <ion-title>Absen Pulang</ion-title>
            </ion-toolbar>
          </ion-header>
          <!-- Kamera Selfie -->
          <!-- <div class="selfie-container"> -->
          <video ref="videoElement" autoplay></video>
          <canvas ref="canvasElement" style="display: none"></canvas>
  
          <div class="form-container">
            <ion-button expand="block" @click="takeSelfie"
              >📷 Ambil Selfie</ion-button
            >
            <!-- </div> -->
  
            <!-- Lokasi -->
            <!-- <div class="content-container"> -->
            <ion-item>
              <!-- <ion-spinner v-if="loading"></ion-spinner> -->
              <ion-label position="stacked"
                >📍 Lokasi: {{ dataPosition }}</ion-label
              >
            </ion-item>
            <!-- Tombol Pulang -->
            <ion-button
              expand="block"
              :disabled="!selfieTaken"
              @click="submitAbsen"
            >
              <ion-spinner v-if="loading"></ion-spinner>
              <span v-else>Pulang</span>
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-page>
  </template>
    
    <script setup>
  import { ref, onMounted } from "vue";
  import api from "@/services/api";
  import { showToast } from "@/services/toastHandlers";
  import { IonSpinner } from "@ionic/vue";
  import router from "@/router";
  // State
  const tanggalHariIni = ref("");
  const dateAbsen = ref("");
  const absenTime = ref(null);
  const latitude = ref(null);
  const longitude = ref(null);
  const keterangan = ref("");
  const selfieTaken = ref(false);
  const videoElement = ref(null);
  const canvasElement = ref(null);
  const selfieImage = ref(null);
  const loading = ref(false);
  const getUser = localStorage.getItem("master_user");
  const userData = ref([]);
  const imageLocation = ref(null);
  const printRes = ref(null);
  const printRes2 = ref(null);
  const dataPosition = ref(null);
  const prinLok = ref(null);
  
  // 📌 1. Ambil Waktu & Tanggal Saat Ini
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
  
    tanggalHariIni.value = `${day}-${month}-${year}`;
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  const dateNow = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  };
  
  const time = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
  
    return `${hours}:${minutes}:${seconds}`;
  };
  
  // 📌 2. Ambil Lokasi GPS
  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude.value = position.coords.latitude;
          longitude.value = position.coords.longitude;
        },
        (error) => {
          console.error("Gagal mengambil lokasi:", error.message);
        }
      );
    } else {
      console.error("Geolocation tidak didukung oleh browser ini.");
    }
  };
  
  const fetchData = async () => {
    loading.value = true;
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            latitude.value = position.coords.latitude;
            longitude.value = position.coords.longitude;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude.value}&lon=${longitude.value}`
            );
            const data = await response.json();
            dataPosition.value = data.display_name;
            //   await showToast(dataPosition.value, "success");
          },
          (error) => {
            console.error("Gagal mengambil lokasi:", error.message);
          }
        );
      }
    } catch (error) {
      console.error("Error Menampilkan Lokasi:", error);
    } finally {
      loading.value = false;
    }
  };
  
  // 📌 3. Ambil Selfie
  const takeSelfie = () => {
    const video = videoElement.value;
    const canvas = canvasElement.value;
    const context = canvas.getContext("2d");
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    selfieImage.value = canvas.toDataURL("image/png");
    selfieTaken.value = true;
  };
  
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
  
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
  
    return new Blob([uint8Array], { type: mimeString });
  };
  
  // 📌 4. Kirim Data Absen ke API
  const submitAbsen = async () => {
    loading.value = true;
    try {
      userData.value = JSON.parse(getUser);
      const token = localStorage.getItem("access_token");
      const absenData = new FormData();
      const timestamp = new Date().getTime(); // Ambil waktu sekarang
      const fileName = `IN_photo.png`; // Nama file unik
  
      absenData.append("user_id", userData.value.user);
      absenData.append("date", dateNow());
      absenData.append("time_in", time()),
        absenData.append("latitude_in", latitude.value);
      absenData.append("longitude_in", longitude.value);
      absenData.append("keterangan", keterangan.value);
      const blob = dataURItoBlob(selfieImage.value);
  
      if (!blob || blob.size === 0) {
        //   console.error("File gambar tidak valid!");
        await showToast("File gambar tidak valid!", "danger");
        return;
      }
  
      absenData.append("images_in", blob, fileName);
  
      const response = api.post("/addAbsen", absenData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // "Content-Type": "application/json",
          "Content-Type": "multipart/form-data",
        },
      });
  
      const resultAbsen = (await response).data;
      printRes.value = JSON.stringify(resultAbsen);
      printRes2.value = JSON.parse(printRes.value);
      await showToast(printRes2.value.message, "success");
  
      router.replace("/");
      // absenTime.value = response.data.time_in; // Perbarui UI dengan waktu absen
    } catch (error) {
      console.error("Gagal absen:", error.response?.data || error.message);
      await showToast(error.response.data.message, "danger");
      router.replace("/");
    } finally {
      loading.value = false;
    }
  };
  
  // 📌 5. Jalankan Fungsi Saat Halaman Dibuka
  onMounted(() => {
    getCurrentDateTime();
    getLocation();
    fetchData();
  
    // Aktifkan Kamera
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        videoElement.value.srcObject = stream;
      })
      .catch((error) => {
        console.error("Gagal mengakses kamera:", error.message);
      });
  });
  </script>
    
    <style scoped>
  .absen-card {
    margin: 16px;
    text-align: center;
  }
  .selfie-container {
    text-align: center;
    margin: 16px 0;
  }
  video {
    width: 90%;
    margin: 16px 21px;
    border-radius: 8px;
    text-align: center;
  }
  .form-containe {
    width: 90%;
    margin: 16px 21px;
    border-radius: 8px;
    text-align: center;
  }
  ion-item {
    border-radius: 8px;
    margin: 2%;
    margin-bottom: 8%;
    height:120%;
    width: 96%;
  }
  
  ion-button {
    border-radius: 8px;
    margin: 2%;
    color: maroon ;
  }
  .content-container {
    display: block;
    gap: 0px;
    justify-content: center;
    align-items: center;
    height: 90vh;
    background-color: darkgray;
  }
  </style>
    