import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.starter",
  appName: "ERP SMB",
  webDir: "dist",
  server: {
    cleartext: true, // Mengizinkan HTTP (tanpa HTTPS)
    allowNavigation: ["http://202.10.42.150:8080","http://erpsmb.cloud:8080"],
    androidScheme: 'http',
  },
};

export default config;
