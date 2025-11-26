import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import { useRouter } from 'vue-router'

interface User {
  id: number
  username: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role)

  // Установка токена
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // Удаление токена
  const clearToken = () => {
    token.value = null
    localStorage.removeItem('token')
  }

  // Логин
  const login = async (username: string, password: string) => {
    isLoading.value = true
    try {
      const response = await api.login({
        username,
        password
      })
      
      const { token: newToken, user: userData } = response
      setToken(newToken)
      user.value = userData
      
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      return { 
        success: false, 
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  // Логаут
  const logout = () => {
    const router = useRouter() 
    user.value = null
    clearToken()
    router.push('/login')
  }

  // Получение текущего пользователя
  const fetchCurrentUser = async () => {
    if (!token.value) return
    
    try {
      const response = await api.getCurrentUser()
      user.value = response.user
    } catch (error) {
      clearToken()
      throw error
    }
  }

  // Инициализация при загрузке приложения
  const initialize = async () => {
    if (token.value) {
      try {
        await fetchCurrentUser();
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearToken();
      }
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    userRole,
    login,
    logout,
    fetchCurrentUser,
    initialize
  }
})