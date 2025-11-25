// src/services/api.ts
import type { Shift } from '../types';
import { isBackendOnline } from '@/utils/healthCheck';

const API_BASE_URL = 'https://kalikrit.pythonanywhere.com';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

interface User {
  id: number;
  username: string;
  role: string;
}

class ApiClient {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      // Если получили ответ, бэкенд онлайн
      isBackendOnline.value = true;

      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // Помечаем оффлайн ТОЛЬКО при сетевых ошибках, не при HTTP ошибках
      if (error instanceof TypeError) {
        // Сетевая ошибка (Failed to fetch, timeout и т.д.)
        //isBackendOnline.value = false;
        throw error;
      }
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  async getCoverageRules(): Promise<any> {
    return this.request('/coverage-rules');
  }

  async getShifts(): Promise<Shift[]> {
    return this.request('/shifts');
  }

  async getShiftsByDate(date: string): Promise<Shift[]> {    
    const shifts = await this.request(`/shifts/${date}`);
    return shifts;
  }

  async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    return this.request('/shifts', {
      method: 'POST',
      body: JSON.stringify(shift),
    });
  }

  async updateShift(shiftId: number, shift: Partial<Shift>): Promise<Shift> {
    return this.request(`/shifts/${shiftId}`, {
      method: 'PUT',
      body: JSON.stringify(shift),
    });
  }

  async deleteShift(shiftId: number): Promise<void> {
    await this.request(`/shifts/${shiftId}`, {
      method: 'DELETE',
    });
  }

  async generateOptimalShifts(date: string): Promise<any> {
    return this.request(`/shifts/generate/${date}`, {
      method: 'POST'
    });
  }

  // Добавляем метод для проверки здоровья
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

export const api = new ApiClient();