import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import AbsenMasuk from '../views/AbsenMasuk.vue';
import AbsenPulang from '../views/AbsenPulang.vue';
import RekapAbsen from '../views/RekapAbsensi.vue';
import TabsPage from '../views/TabsPage.vue';
import { constructOutline } from 'ionicons/icons';


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
    meta: {
      title: "Login",
    },
    // redirect: '/TabsPage'
  },
  {
    path: '/home',
    name : 'home',
    component: Home
  },
  {
    path: '/login',
    name: "login",
    component: Login
  },
  {
    path: '/',
    component: TabsPage,
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

const token = localStorage.getItem("access_token");
console.log(token,'');
router.beforeEach((to, from, next) => {

  if (!token && to.path !== "/login") {
    next({ name: "login" }); // nama route benar
  } else {
    next();
  }
});
export default router
