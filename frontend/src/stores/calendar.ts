import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateMonthDays } from '../utils/dateUtils';
import type { CalendarDay } from '@/types';

export const useCalendarStore = defineStore('calendar', () => {
  // State
  const currentDate = ref<Date>(new Date(2025, 10, 15)); // 15 ноября 2025
  const currentView = ref<'month' | 'week' | 'day'>('month');
  const selectedDate = ref<Date | null>(null);

  // Getters
  const currentYear = computed(() => currentDate.value.getFullYear());
  const currentMonth = computed(() => currentDate.value.getMonth());
  
  const currentMonthData = computed((): CalendarDay[] => {
    return generateMonthDays(currentYear.value, currentMonth.value);
  });

  const currentMonthName = computed(() => {
    return currentDate.value.toLocaleDateString('ru-RU', { 
      month: 'long', 
      year: 'numeric' 
    });
  });

  const today = computed(() => new Date());

  // computed свойство для отображения периода
  const currentPeriodDisplay = computed(() => {
    if (currentView.value === 'month') {
      return currentDate.value.toLocaleDateString('ru-RU', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (currentView.value === 'week') {
      // Логика для недели
      const startOfWeek = new Date(currentDate.value);
      startOfWeek.setDate(currentDate.value.getDate() - currentDate.value.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleDateString('ru-RU', { month: 'short' });
      const endMonth = endOfWeek.toLocaleDateString('ru-RU', { month: 'short' });
      
      if (startMonth === endMonth) {
        return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startMonth}`;
      } else {
        return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth}`;
      }
    } else {
      // Логика для дня
      return currentDate.value.toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  });

  // Actions
  const setView = (view: 'month' | 'week' | 'day'): void => {
    currentView.value = view;
  };

  const navigateToDate = (date: Date): void => {
    currentDate.value = new Date(date);
    selectedDate.value = new Date(date);
  };

  const nextPeriod = (): void => {
    const newDate = new Date(currentDate.value);
    
    if (currentView.value === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView.value === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    currentDate.value = newDate;
  };

  const prevPeriod = (): void => {
    const newDate = new Date(currentDate.value);
    
    if (currentView.value === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView.value === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    
    currentDate.value = newDate;
  };

  const goToToday = (): void => {
    currentDate.value = new Date();
    selectedDate.value = new Date();
  };

  const selectDate = (date: Date): void => {
    selectedDate.value = new Date(date);
  };

  return {
    // State
    currentDate,
    currentView,
    selectedDate,
    
    // Getters
    currentYear,
    currentMonth,
    currentMonthData,
    currentMonthName,
    today,
    currentPeriodDisplay, 
    
    // Actions
    setView,
    navigateToDate,
    nextPeriod,
    prevPeriod,
    goToToday,
    selectDate
  };
});