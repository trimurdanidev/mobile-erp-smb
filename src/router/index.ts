import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import AbsenMasuk from '../views/AbsenMasuk.vue';
import AbsenPulang from '../views/AbsenPulang.vue';
import RekapAbsen from '../views/RekapAbsensi.vue';
import TabsPage from '../views/TabsPage.vue';
import JadwalKerja from '../views/JadwalKerja.vue';
import { constructOutline } from 'ionicons/icons';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/tabs',
        redirect: '/home'
      },
      {
        path: '/home',
        name: 'home',
        component: () => import('../views/Home.vue')
      },
      {
        path: '/profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: '/in',
        component: AbsenMasuk
      },
      {
        path: '/out',
        component: AbsenPulang
      },
      {
        path: '/rekap',
        component: RekapAbsen
      },
      {
        path: '/jadwal',
        component: JadwalKerja
      },
      {
        path: '/logout',
        component: () => import('../views/Login.vue')
      }
    ]
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Route Guard
router.beforeEach((to, from, next) => {
  const token     = localStorage.getItem("access_token");
  const expiredAt = localStorage.getItem("token_expires_at");

  const isTokenExpired = !token || !expiredAt 
                         || new Date().getTime() >= parseInt(expiredAt);

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && isTokenExpired) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("master_user");

    console.warn("⛔ Session expired, redirect ke login");
    next({ name: "login" });

  } else if (to.name === "login" && token && !isTokenExpired) {
    next({ name: "home" });

  } else {
    next();
  }
});

export default router;
