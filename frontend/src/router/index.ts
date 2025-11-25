import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Month',
    component: () => import('@/components/MonthView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/week',
    name: 'Week', 
    component: () => import('@/components/WeekView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/day',
    name: 'Day',
    component: () => import('@/components/DayView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/components/LoginView.vue'),
    meta: { requiresGuest: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Навигационный guard для проверки авторизации
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // Если маршрут требует авторизации и пользователь не авторизован
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } 
  // Если маршрут требует гостя (например, логин) и пользователь уже авторизован
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/');
  } 
  // Во всех остальных случаях разрешаем переход
  else {
    next();
  }
});

export default router;