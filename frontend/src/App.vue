<template>
  <div id="app">
    <!-- Показываем страницу недоступности если бэкенд оффлайн -->
    <ServiceUnavailable 
      v-if="!isBackendOnline"
      @retry="handleRetry"
    />
    
    <!-- Иначе показываем обычный интерфейс -->
    <div v-else>
      <!-- Навигация показывается только для авторизованных пользователей -->
      <nav v-if="authStore.isAuthenticated" class="main-nav">
        <div class="nav-section">
          <router-link to="/" class="nav-link" @click="calendarStore.setView('month')">
            📅 Месяц
          </router-link>
          <router-link to="/week" class="nav-link" @click="calendarStore.setView('week')">
            📋 Неделя
          </router-link>
          <router-link to="/day" class="nav-link" @click="calendarStore.setView('day')">
            ⏰ День
          </router-link>
        </div>

        <div class="date-navigation">
          <button @click="calendarStore.prevPeriod" class="nav-btn">◀</button>
          <span class="current-period">{{ currentPeriodDisplay }}</span>
          <button @click="calendarStore.nextPeriod" class="nav-btn">▶</button>
          <button @click="calendarStore.goToToday" class="today-btn">Сегодня</button>
        </div>

        <div class="user-section">
          <span>
            👤 {{ authStore.user?.username }}
            <button @click="authStore.logout" class="logout-btn">Выйти</button>
          </span>
        </div>
      </nav>

      <main class="main-content" :class="{ 'unauthorized': !authStore.isAuthenticated }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useCalendarStore } from './stores/calendar'
import { useScheduleStore } from './stores/schedule'
import ServiceUnavailable from './components/ServiceUnavailable.vue'
import { isBackendOnline, startHealthMonitoring, checkBackendHealth } from './utils/healthCheck'

const authStore = useAuthStore()
const calendarStore = useCalendarStore()
const scheduleStore = useScheduleStore()

let healthMonitoringStarted = false

const currentPeriodDisplay = computed(() => {
  return calendarStore.currentPeriodDisplay
})

onMounted(async () => {  
  // Сразу проверяем доступность бэкенда
  const isHealthy = await checkBackendHealth()
  isBackendOnline.value = isHealthy
  
  if (isHealthy && !healthMonitoringStarted) {
    startHealthMonitoring()
    healthMonitoringStarted = true

    await scheduleStore.loadCoverageRules()
  }
})

const handleRetry = async () => {
  const isHealthy = await checkBackendHealth()
  isBackendOnline.value = isHealthy
  
  if (isHealthy && !healthMonitoringStarted) {
    startHealthMonitoring()
    healthMonitoringStarted = true
    await scheduleStore.loadCoverageRules()
  }
}
</script>

<style scoped>
.main-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #2c3e50;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-period {
  font-weight: bold;
  min-width: 200px;
  text-align: center;
  color: white;
}

.nav-btn, .today-btn {
  background: #34495e;
  border: 1px solid #4a6572;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  color: white;
}

.nav-btn:hover, .today-btn:hover {
  background: #4a6572;
}

.today-btn {
  background: #3498db;
  border-color: #3498db;
}

.today-btn:hover {
  background: #2980b9;
}

.nav-section {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link:hover, .nav-link.router-link-active {
  background: #34495e;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1rem;
}

.logout-btn:hover {
  background: #c0392b;
}

/* Стиль для main-content когда пользователь не авторизован */
.main-content.unauthorized {
  padding: 0;
  margin: 0;
}
</style>