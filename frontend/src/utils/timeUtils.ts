import type { Shift } from '../types';

// Проверяет пересекается ли новая смена с существующими сменами сотрудника
export const hasEmployeeShiftOverlap = (
  shifts: Shift[],
  employee: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeShiftId?: number
): boolean => {
  const employeeShifts = shifts.filter(shift => 
    shift.employee === employee && 
    shift.date === date &&
    shift.id !== excludeShiftId
  );
  
  return employeeShifts.some(existingShift => {
    // Безопасный парсинг с значениями по умолчанию
    const start1Parts = (existingShift.start_time || '00:00').split(':');
    const end1Parts = (existingShift.end_time || '23:59').split(':');
    const start2Parts = (startTime || '00:00').split(':');
    const end2Parts = (endTime || '23:59').split(':');
    
    const start1Hour = parseInt(start1Parts[0]) || 0;
    const start1Min = parseInt(start1Parts[1]) || 0;
    const end1Hour = parseInt(end1Parts[0]) || 23;
    const end1Min = parseInt(end1Parts[1]) || 59;
    
    const start2Hour = parseInt(start2Parts[0]) || 0;
    const start2Min = parseInt(start2Parts[1]) || 0;
    const end2Hour = parseInt(end2Parts[0]) || 23;
    const end2Min = parseInt(end2Parts[1]) || 59;
    
    const start1Total = start1Hour * 60 + start1Min;
    const end1Total = end1Hour * 60 + end1Min;
    const start2Total = start2Hour * 60 + start2Min;
    const end2Total = end2Hour * 60 + end2Min;
    
    return start1Total < end2Total && end1Total > start2Total;
  });
};