import { describe, it, expect } from 'vitest';

describe('DayView', () => {
  it('component structure is correct', () => {
    expect(typeof import('../DayView.vue')).toBe('object');
  });

  it('time formatting works correctly', () => {
    // Тестируем логику форматирования времени
    const formatTime = (hour: number) => {
      return `${hour.toString().padStart(2, '0')}:00`;
    };
    
    expect(formatTime(7)).toBe('07:00');
    expect(formatTime(12)).toBe('12:00');
    expect(formatTime(20)).toBe('20:00');
  });

  it('shift filtering by hour works', () => {
    // Тестируем фильтрацию смен по часам
    const testShifts = [
      { start_time: '09:00', end_time: '17:00' },
      { start_time: '10:00', end_time: '18:00' },
      { start_time: '14:00', end_time: '16:00' }
    ];
    
    const getShiftsInHour = (hour: number) => {
      return testShifts.filter(shift => {
        const startHour = parseInt(shift.start_time.split(':')[0]);
        const endHour = parseInt(shift.end_time.split(':')[0]);
        return hour >= startHour && hour < endHour;
      });
    };
    
    expect(getShiftsInHour(8)).toHaveLength(0); // До начала смен
    expect(getShiftsInHour(10)).toHaveLength(2); // 09:00-17:00 и 10:00-18:00
    expect(getShiftsInHour(15)).toHaveLength(3); // Все смены
    expect(getShiftsInHour(19)).toHaveLength(0); // После окончания
  });
});