import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.erpsmb.app",
  appName: "ERP SMB",
  webDir: "dist",
  android: {
    allowMixedContent: true, // ← izinkan HTTP + HTTPS
  },
  server: {
    cleartext: true, // Mengizinkan HTTP (tanpa HTTPS)
    allowNavigation: ["http://202.10.42.150:8080", "http://erpsmb.cloud:8080"],
    androidScheme: "http",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
