<template>
  <div class="service-unavailable">
    <div class="modern-error-container">
      <!-- Анимированная иконка -->
      <div class="animated-icon">
        <div class="pulse-dot"></div>
        <div class="wifi-icon">📶</div>
      </div>
      
      <h1 class="error-title">Сервис временно недоступен</h1>
      
      <p class="error-description">
        Мы не можем подключиться к серверу. Возможно, проблемы с интернет-соединением 
        или сервер находится на техническом обслуживании.
      </p>

      <!-- Статус информация -->
      <div class="status-info">
        <div class="status-item">
          <span class="status-label">Последняя проверка:</span>
          <span class="status-value">{{ lastCheckTime }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Статус:</span>
          <span class="status-badge offline">Не подключено</span>
        </div>
      </div>

      <!-- Действия -->
      <div class="action-buttons">
        <button @click="retryConnection" class="retry-btn modern-btn">
          <span class="btn-icon">🔄</span>
          Попробовать снова
        </button>
        <button @click="refreshPage" class="refresh-btn modern-btn secondary">
          <span class="btn-icon">🌐</span>
          Обновить страницу
        </button>
      </div>

      <!-- Советы по устранению -->
      <div class="troubleshooting-tips">
        <h3>Что можно сделать:</h3>
        <ul>
          <li>✅ Проверить интернет-соединение</li>
          <li>✅ Обновить страницу</li>
          <li>✅ Попробовать позже</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ServiceUnavailable',
  emits: ['retry'],
  data() {
    return {
      lastCheckTime: ''
    }
  },
  mounted() {
    this.updateLastCheckTime()
  },
  methods: {
    retryConnection() {
      this.updateLastCheckTime()
      this.$emit('retry')
    },
    refreshPage() {
      window.location.reload()
    },
    updateLastCheckTime() {
      const now = new Date()
      this.lastCheckTime = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.service-unavailable {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.modern-error-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Анимированная иконка */
.animated-icon {
  position: relative;
  margin-bottom: 30px;
}

.wifi-icon {
  font-size: 4rem;
  opacity: 0.7;
}

.pulse-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 2px solid #ff6b6b;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.pulse-dot::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 2px solid #ff6b6b;
  border-radius: 50%;
  animation: pulse 2s infinite 0.5s;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

.error-title {
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.3;
}

.error-description {
  color: #4a5568;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 30px;
}

/* Статус информация */
.status-info {
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  color: #718096;
  font-weight: 500;
}

.status-value {
  color: #2d3748;
  font-weight: 600;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.offline {
  background: #fed7d7;
  color: #c53030;
}

/* Кнопки */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.modern-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.retry-btn {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  box-shadow: 0 4px 15px rgba(66, 153, 225, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 153, 225, 0.4);
}

.refresh-btn.secondary {
  background: transparent;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.refresh-btn.secondary:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Советы */
.troubleshooting-tips {
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
}

.troubleshooting-tips h3 {
  color: #2f855a;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.troubleshooting-tips ul {
  color: #38a169;
  list-style: none;
  padding: 0;
  margin: 0;
}

.troubleshooting-tips li {
  padding: 4px 0;
  font-size: 0.95rem;
}

/* Адаптивность */
@media (max-width: 600px) {
  .modern-error-container {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modern-btn {
    justify-content: center;
  }
}
</style>