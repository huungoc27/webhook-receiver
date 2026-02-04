import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Login from './views/Login.vue';
import Dashboard from './views/Dashboard.vue';
import './style.css';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Auth check with both cookie and localStorage
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const hasAuth = document.cookie.includes('token=') || localStorage.getItem('isAuthenticated') === 'true';
    if (!hasAuth) {
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

const app = createApp(App);
app.use(router);
app.mount('#app');