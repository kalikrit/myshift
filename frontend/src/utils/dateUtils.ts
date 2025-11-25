import type { CalendarDay } from '../types';

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const generateMonthDays = (year: number, month: number): CalendarDay[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
  
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  
  const days: CalendarDay[] = [];
  const currentDate = new Date(startDate);
  const today = new Date();
  const todayFormatted = formatDate(today);
  
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    
    days.push({
      date: dateStr,
      day: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: dateStr === todayFormatted,
      isWeekend: isWeekend(currentDate),
      shifts: []
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};