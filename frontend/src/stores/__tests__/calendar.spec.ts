import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCalendarStore } from '../calendar';

describe('Calendar Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with November 2025', () => {
    const calendarStore = useCalendarStore();
    
    expect(calendarStore.currentYear).toBe(2025);
    expect(calendarStore.currentMonth).toBe(10); // Ноябрь (0-based)
    expect(calendarStore.currentView).toBe('month');
  });

  it('should navigate to next month', () => {
    const calendarStore = useCalendarStore();
    
    calendarStore.nextPeriod();
    
    expect(calendarStore.currentYear).toBe(2025);
    expect(calendarStore.currentMonth).toBe(11); // Декабрь
  });

  it('should navigate to previous month', () => {
    const calendarStore = useCalendarStore();
    
    calendarStore.prevPeriod();
    
    expect(calendarStore.currentYear).toBe(2025);
    expect(calendarStore.currentMonth).toBe(9); // Октябрь
  });

  it('should change view', () => {
    const calendarStore = useCalendarStore();
    
    calendarStore.setView('week');
    expect(calendarStore.currentView).toBe('week');
    
    calendarStore.setView('day');
    expect(calendarStore.currentView).toBe('day');
  });

  it('should select date without changing view', () => { // ИЗМЕНИЛИ название теста
    const calendarStore = useCalendarStore();
    const testDate = new Date(2025, 10, 20);
    
    calendarStore.selectDate(testDate);
    
    expect(calendarStore.selectedDate).toEqual(testDate);
    // Больше не проверяем автоматическое изменение вида
    // Вид меняется через роутер, а не через store
    expect(calendarStore.currentView).toBe('month'); // Остается текущий вид
  });

  // ДОБАВЛЯЕМ новый тест для комбинированного выбора даты и смены вида
  it('should select date and change view when using setView', () => {
    const calendarStore = useCalendarStore();
    const testDate = new Date(2025, 10, 20);
    
    calendarStore.selectDate(testDate);
    calendarStore.setView('day');
    
    expect(calendarStore.selectedDate).toEqual(testDate);
    expect(calendarStore.currentView).toBe('day');
  });
});