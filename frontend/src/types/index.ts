// Правила покрытия
export interface CoverageRule {
  role: 'cashier' | 'manager' | 'technician';
  displayName: string;
  totalRequired: number;
  minPerInterval: number;
  intervals: Array<{
    start: string;
    end: string;
  }>;
}

// Типы для смен
export interface Shift {
  id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  employee: string;
  role: 'cashier' | 'manager' | 'technician';
  required?: boolean;
}

// Типы для пользователей
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  employee_name: string | null;
}

// Типы для аутентификации
export interface LoginData {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Типы для календаря
export interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  shifts: Shift[];
}