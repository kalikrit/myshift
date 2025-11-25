export interface CoverageRule {
  role: string;
  displayName: string;
  totalRequired: number;
  minPerInterval: number;
  intervals: Array<{
    start: string;
    end: string;
    description: string;
  }>;
}

export interface CoverageInterval {
  start: string;
  end: string;
  description: string;
}

export interface CoverageRule {
  role: string;
  displayName: string;
  totalRequired: number;
  minPerInterval: number;
  intervals: CoverageInterval[];
}

// Единый источник правды для правил покрытия
export const coverageRules: CoverageRule[] = [
  {
    role: 'cashier',
    displayName: 'Кассиры',
    totalRequired: 2,
    minPerInterval: 1,
    intervals: [
      { start: '07:00', end: '12:00', description: 'Утренняя смена' },
      { start: '12:00', end: '20:00', description: 'Вечерняя смена' }
    ]
  },
  {
    role: 'manager', 
    displayName: 'Менеджеры зала',
    totalRequired: 2,
    minPerInterval: 1,
    intervals: [
      { start: '09:00', end: '20:00', description: 'Рабочий день' }
    ]
  },
  {
    role: 'technician',
    displayName: 'Техники',
    totalRequired: 1, 
    minPerInterval: 1,
    intervals: [
      { start: '09:00', end: '18:00', description: 'Дежурный техник' }
    ]
  }
];