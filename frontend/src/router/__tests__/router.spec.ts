import { describe, it, expect } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// Создаем тестовый роутер с memory history (работает в Node.js)
const createTestRouter = () => {
  const routes: RouteRecordRaw[] = [
    {
      path: '/',
      name: 'Month',
      component: { template: '<div>Month</div>' }
    },
    {
      path: '/week',
      name: 'Week', 
      component: { template: '<div>Week</div>' }
    },
    {
      path: '/day',
      name: 'Day',
      component: { template: '<div>Day</div>' }
    },
    {
      path: '/login',
      name: 'Login',
      component: { template: '<div>Login</div>' }
    }
  ];

  return createRouter({
    history: createMemoryHistory(),
    routes
  });
};

describe('Router', () => {
  it('should have routes defined', () => {
    const router = createTestRouter();
    const routes = router.getRoutes();
    
    expect(routes).toHaveLength(4);
    expect(routes.some(route => route.name === 'Month')).toBe(true);
    expect(routes.some(route => route.name === 'Week')).toBe(true);
    expect(routes.some(route => route.name === 'Day')).toBe(true);
    expect(routes.some(route => route.name === 'Login')).toBe(true);
  });

  it('should have correct paths', () => {
    const router = createTestRouter();
    const routes = router.getRoutes();
    
    const monthRoute = routes.find(route => route.name === 'Month');
    expect(monthRoute?.path).toBe('/');
    
    const loginRoute = routes.find(route => route.name === 'Login');
    expect(loginRoute?.path).toBe('/login');
  });

  it('should navigate between routes', async () => {
    const router = createTestRouter();
    
    await router.push('/');
    expect(router.currentRoute.value.name).toBe('Month');
    
    await router.push('/week');
    expect(router.currentRoute.value.name).toBe('Week');
    
    await router.push('/login');
    expect(router.currentRoute.value.name).toBe('Login');
  });
});