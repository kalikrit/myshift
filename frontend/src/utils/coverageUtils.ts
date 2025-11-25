import type { Shift, CoverageRule } from '../types';

// Проверяет пересекается ли смена с временным интервалом
const doesShiftOverlap = (shift: Shift, intervalStart: string, intervalEnd: string): boolean => {
  const shiftStart = shift.start_time;
  const shiftEnd = shift.end_time;
  
  return shiftStart < intervalEnd && shiftEnd > intervalStart;
};

// Проверяет покрытие в КАЖДОМ часу интервала
const checkIntervalCoverage = (shifts: Shift[], rule: CoverageRule): string[] => {
  const issues: string[] = [];
  
  rule.intervals.forEach(interval => {
    // Разбиваем интервал на часы (7:00-10:00 → 7, 8, 9)
    const startHour = parseInt(interval.start.split(':')[0]);
    const endHour = parseInt(interval.end.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Проверяем покрытие в этом часу
      const hourStart = `${hour.toString().padStart(2, '0')}:00`;
      const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Находим сотрудников работающих в этот час
      const employeesInHour = shifts.filter(shift => 
        shift.role === rule.role && doesShiftOverlap(shift, hourStart, hourEnd)
      );
      
      const uniqueEmployees = new Set(employeesInHour.map(s => s.employee));
      
      // Если в этом часу меньше минимального количества
      if (uniqueEmployees.size < rule.minPerInterval) {
        issues.push(`${rule.displayName} ${hourStart}-${hourEnd}: минимум ${rule.minPerInterval}, есть ${uniqueEmployees.size}`);
      }
    }
  });
  
  return issues;
};

// Проверяет общее количество сотрудников за день
const checkTotalCoverage = (shifts: Shift[], rule: CoverageRule): string[] => {
  const issues: string[] = [];
  
  const roleShifts = shifts.filter(shift => shift.role === rule.role);
  const uniqueEmployees = new Set(roleShifts.map(s => s.employee));
  
  if (uniqueEmployees.size < rule.totalRequired) {
    issues.push(`${rule.displayName}: нужно всего ${rule.totalRequired}, есть ${uniqueEmployees.size}`);
  }
  
  return issues;
};

// Анализирует покрытие для конкретной даты
export const analyzeCoverage = (shifts: Shift[], date: string, rules: CoverageRule[]) => {
  const dateShifts = shifts.filter(shift => shift.date === date);
  
  if (dateShifts.length === 0) {
    return { status: 'critical', message: '❌ Нет смен' };
  }

  const issues: string[] = [];

  // Проверяем каждое правило (используем переданные rules)
  rules.forEach(rule => {
    const intervalIssues = checkIntervalCoverage(dateShifts, rule);
    const totalIssues = checkTotalCoverage(dateShifts, rule);
    
    issues.push(...intervalIssues, ...totalIssues);
  });

  if (issues.length === 0) {
    return { status: 'good', message: '✅ Покрытие оптимальное' };
  } else {
    return { 
      status: 'critical', 
      message: `❌ Нарушены правила (${issues.length})`,
      issues: issues
    };
  }
};