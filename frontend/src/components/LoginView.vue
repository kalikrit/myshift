<template>
  <div class="login-container">
    <!-- Уведомление об ошибке -->
    <div v-if="showNotification" class="login-notification" :class="notificationType">
      {{ notificationMessage }}
      <button @click="closeNotification" class="notification-close">×</button>
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <h2>Вход в систему</h2>
      
      <div class="form-group">
        <label for="username">Логин:</label>
        <input
          id="username"
          v-model="username"
          type="text"
          required
          :disabled="authStore.isLoading"
        >
      </div>

      <div class="form-group">
        <label for="password">Пароль:</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          :disabled="authStore.isLoading"
        >
      </div>

      <button 
        type="submit" 
        :disabled="authStore.isLoading"
        class="login-btn"
      >
        {{ authStore.isLoading ? 'Вход...' : 'Войти' }}
      </button>

      <div class="test-users">
        <h4>Тестовые пользователи:</h4>
        <p><strong>admin</strong> / admin123 (полный доступ)</p>
        <p><strong>manager1</strong> / manager123 (управление сменами)</p>
        <p><strong>viewer1</strong> / viewer123 (только просмотр)</p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error'>('error')

const closeNotification = () => {
  showNotification.value = false
}

const handleLogin = async () => {
  const result = await authStore.login(username.value, password.value)
  
  if (result.success) {
    router.push('/')
  } else {
    showNotification.value = true
    notificationMessage.value = 'Неверный логин или пароль'
    notificationType.value = 'error'
  }
  
  username.value = ''
  password.value = ''
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url('@/assets/images/auth-background.png') no-repeat fixed;
  background-size: cover;
}

.login-form {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.login-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.test-users {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.test-users h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}
</style>