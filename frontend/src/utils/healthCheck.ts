// src/utils/healthCheck.ts
import { ref } from 'vue'

export const isBackendOnline = ref(true)

const API_BASE_URL = 'https://kalikrit.pythonanywhere.com'

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 секунд таймаут
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    return data.status === 'healthy'
  } catch (error) {
    console.error('Backend health check failed:', error)
    return false
  }
}

export const startHealthMonitoring = () => {
  setInterval(async () => {
    const isHealthy = await checkBackendHealth()
    if (isBackendOnline.value !== isHealthy) {
      isBackendOnline.value = isHealthy
    }
  }, 30000)
}