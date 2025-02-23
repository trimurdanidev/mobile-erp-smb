import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import AbsenMasuk from '../views/AbsenMasuk.vue';
import AbsenPulang from '../views/AbsenPulang.vue';
import RekapAbsen from '../views/RekapAbsensi.vue';
import TabsPage from '../views/TabsPage.vue';


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs'
    // redirect: '/TabsPage'
  },
  {
    path: '/home',
    component: Home
  },
  {
    path: '/login',
    component: Login
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
    path: '/',
    component: TabsPage,
    children: [
      {
        path: '/',
        redirect: '/tabs/home'
      },
      {
        path: '/home',
        component: () => import('../views/Home.vue')
      },
      {
        path: '/profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: '/logout',
        component: () => import('../views/Login.vue')
      }
    ]
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
