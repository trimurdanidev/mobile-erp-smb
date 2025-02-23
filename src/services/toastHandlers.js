import { toastController } from "@ionic/vue";

export const showToast = async (message, color) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: "top",
  });
  return toast.present();
};
