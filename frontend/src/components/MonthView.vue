<template>
  <div class="month-view">
    <div class="month-header">
      <h2>{{ calendarStore.currentMonthName }}</h2>
    </div>

    <div class="calendar-grid">
      <!-- Заголовки дней недели -->
      <div 
        v-for="day in weekdays" 
        :key="day"
        class="weekday-header"
      >
        {{ day }}
      </div>

      <!-- Дни календаря -->
      <div
        v-for="day in calendarDaysWithShifts"
        :key="day.date"
        :class="[
          'calendar-day',
          {
            'current-month': day.isCurrentMonth,
            'today': day.isToday,
            'weekend': day.isWeekend,
            'selected': isSelected(day.date)
          }
        ]"
        @click="handleDayClick(day)"
      >
        <div class="day-number">{{ day.day }}</div>
        
        <!-- Мини-индикатор смен -->
        <div class="day-shifts-preview">
          <template v-if="day.shifts.length > 0">
            <div class="shift-indicators">
              <span 
                v-for="role in getRoleCounts(day.shifts)" 
                :key="role.name"
                class="role-indicator"
                :class="role.name"
                :title="`${role.name}: ${role.count}`"
              >
                {{ role.count }}
              </span>
            </div>
          </template>
          <div v-else class="no-shifts">—</div>
        </div>

        <!-- Статус покрытия С ПОДСКАЗКОЙ -->
        <div 
          class="coverage-status" 
          :class="getCoverageStatus(day)"
          :title="getCoverageTooltip(day)"
        >
          {{ getCoverageIcon(day) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCalendarStore } from '../stores/calendar';
import { useScheduleStore } from '../stores/schedule';
import { analyzeCoverage } from '../utils/coverageUtils';
import type { CalendarDay, Shift } from '../types';
import './MonthView.css'; 

const calendarStore = useCalendarStore();
const scheduleStore = useScheduleStore();
const router = useRouter();

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Объединяем данные календаря со сменами
const calendarDaysWithShifts = computed((): CalendarDay[] => {
  const days = calendarStore.currentMonthData.map(day => ({
    ...day,
    shifts: scheduleStore.getShiftsByDate(day.date)
  }));
  
  return days;
});

const isSelected = (date: string): boolean => {
  if (!calendarStore.selectedDate) return false;
  return date === formatDate(calendarStore.selectedDate);
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const handleDayClick = (day: CalendarDay): void => {
  const selectedDate = new Date(day.date + 'T00:00:00');
  calendarStore.selectDate(selectedDate);
  router.push('/day');
};

const getRoleCounts = (shifts: Shift[]) => {
  const counts = {
    cashier: { name: 'cashier', count: 0, icon: '🟦' },
    manager: { name: 'manager', count: 0, icon: '🟥' },
    technician: { name: 'technician', count: 0, icon: '🟩' }
  };

  shifts.forEach(shift => {
    if (counts[shift.role]) {
      counts[shift.role].count++;
    }
  });

  return Object.values(counts).filter(role => role.count > 0);
};

// ВМЕСТО computed используем прямое обращение к store
const getCoverageStatus = (day: CalendarDay) => {
  const rules = scheduleStore.coverageRules;

  if (!day.isCurrentMonth || !rules) return 'neutral';

  const coverage = analyzeCoverage(scheduleStore.shifts, day.date, rules);
  
  return coverage.status;
};

const getCoverageIcon = (day: CalendarDay) => {
  const rules = scheduleStore.coverageRules; // ← прямо из store
  if (!day.isCurrentMonth || !rules) return '⏳';
  const coverage = analyzeCoverage(scheduleStore.shifts, day.date, rules);
  return coverage.status === 'good' ? '✅' : '❌';
};

const getCoverageTooltip = (day: CalendarDay): string => {
  const rules = scheduleStore.coverageRules; // ← прямо из store
  if (!day.isCurrentMonth) return '';
  if (!rules) return 'Загрузка правил...';
  const coverage = analyzeCoverage(scheduleStore.shifts, day.date, rules);
  return coverage.message;
};

// Загружаем смены при монтировании компонента
onMounted(async () => {
  const firstDay = calendarStore.currentMonthData[0]?.date;
  const lastDay = calendarStore.currentMonthData[calendarStore.currentMonthData.length - 1]?.date;
  
  if (firstDay && lastDay) {
    await scheduleStore.loadShifts(firstDay, lastDay);
  }
});

</script>
<style scoped>
.coverage-status.loading {
  opacity: 0.6;
}
</style>