<template>
  <div class="week-view">
    <!-- Навигация по неделям -->
    <div class="week-navigation">
      <button @click="previousWeek" class="nav-btn">← Пред</button>
      <h2>Неделя {{ weekRange }}</h2>
      <button @click="nextWeek" class="nav-btn">След →</button>
    </div>

    <!-- Уведомление -->
    <div v-if="showNotification" class="notification" :class="notificationType">
      {{ notificationMessage }}
    </div>

    <!-- Сетка недели -->
    <div class="week-grid">
      <!-- Временные метки -->
      <div class="time-column">
        <div class="time-header">Время</div>
        <div 
          v-for="hour in hours" 
          :key="hour"
          class="time-slot"
        >
          {{ hour }}:00
        </div>
      </div>

      <!-- Дни недели -->
      <div 
        v-for="day in weekDays" 
        :key="day.date"
        class="day-column"
        :class="{ today: day.isToday, weekend: day.isWeekend }"
      >
        <!-- Заголовок дня - КЛИКАБЕЛЬНЫЙ -->
        <div 
          class="day-header clickable"
          @click="goToDay(day.date)"
          :title="`Перейти к расписанию на ${day.date}`"
        >
          <div class="day-name">{{ day.shortName }}, {{ day.dayNumber }}</div>
          <div class="shifts-count">{{ getShiftsForDay(day.date).length }} смен</div>
        </div>

        <!-- Контейнер для индикаторов смен -->
        <div class="day-shifts-container">
          <!-- Индикаторы количества смен по часам -->
          <div
            v-for="hour in hours"
            :key="hour"
            class="hour-indicator"
            :style="{ top: `${(hour - 7) * 60}px` }"
            :class="{ 'has-shifts': getShiftsInHour(day.date, hour).length > 0 }"
            :title="getHourShiftsTooltip(day.date, hour)"
          >
            <span v-if="getShiftsInHour(day.date, hour).length > 0" class="shift-count">
              {{ getShiftsInHour(day.date, hour).length }} смен
            </span>
          </div>

          <!-- Сообщение если смен нет -->
          <div 
            v-if="getShiftsForDay(day.date).length === 0" 
            class="no-shifts-message"
            @click="goToDay(day.date)"
          >
            <span>➕ Создать смены</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useCalendarStore } from '../stores/calendar';
import { useScheduleStore } from '../stores/schedule';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import type { Shift } from '../types';

const calendarStore = useCalendarStore();
const scheduleStore = useScheduleStore();
const authStore = useAuthStore();
const router = useRouter();

// Часы отображения (7:00 - 20:00)
const hours = Array.from({ length: 14 }, (_, i) => i + 7);

// Текущая неделя (начинается с понедельника)
const currentWeekStart = ref<Date>(new Date());

// Вычисляем дни недели
const weekDays = computed(() => {
  const start = new Date(currentWeekStart.value);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    const dateStr = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    days.push({
      date: dateStr,
      name: date.toLocaleDateString('ru-RU', { weekday: 'long' }),
      shortName: date.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase(),
      dayNumber: date.getDate(),
      month: date.getMonth() + 1,
      isToday: date.toDateString() === today.toDateString(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }
  
  return days;
});

// Диапазон недели для отображения
const weekRange = computed(() => {
  const start = weekDays.value[0];
  const end = weekDays.value[6];
  const startMonth = start.month.toString().padStart(2, '0');
  const endMonth = end.month.toString().padStart(2, '0');
  
  if (start.month === end.month) {
    return `${start.dayNumber}-${end.dayNumber}.${startMonth}`;
  } else {
    return `${start.dayNumber}.${startMonth}-${end.dayNumber}.${endMonth}`;
  }
});

// Навигация по неделям
const previousWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeekStart.value = newDate;
};

const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
};

// Переход к дню
const goToDay = (date: string) => {
  const dayDate = new Date(date);
  calendarStore.selectDate(dayDate);
  router.push('/day');
};

// Получаем смены для дня
const getShiftsForDay = (date: string): Shift[] => {
  return scheduleStore.getShiftsByDate(date);
};

// Получаем смены в конкретном часу
const getShiftsInHour = (date: string, hour: number): Shift[] => {
  const shifts = getShiftsForDay(date);
  const hourStart = `${hour.toString().padStart(2, '0')}:00`;
  const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
  
  return shifts.filter(shift => {
    const shiftStart = shift.start_time;
    const shiftEnd = shift.end_time;
    return shiftStart < hourEnd && shiftEnd > hourStart;
  });
};

// Подсказка для часа
const getHourShiftsTooltip = (date: string, hour: number): string => {
  const shifts = getShiftsInHour(date, hour);
  if (shifts.length === 0) return `Нет смен в ${hour}:00-${hour+1}:00`;
  
  const shiftList = shifts.map(shift => 
    `${getEmployeeShortName(shift.employee)} (${shift.start_time}-${shift.end_time})`
  ).join('\n');
  
  return `${shifts.length} смен в ${hour}:00-${hour+1}:00:\n${shiftList}`;
};

// Форматирование даты
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Сокращение имени сотрудника
const getEmployeeShortName = (employee: string): string => {
  const shortNames: Record<string, string> = {
    'кассир1': 'К1', 'кассир2': 'К2', 'кассир3': 'К3', 'кассир4': 'К4', 'кассир5': 'К5',
    'менеджер зала 1': 'М1', 'менеджер зала 2': 'М2', 
    'техник1': 'Т1', 'техник2': 'Т2'
  };
  return shortNames[employee] || employee;
};

// Загрузка смен за неделю
const loadWeekShifts = async () => {
  if (weekDays.value.length === 0) return;
  
  const startDate = weekDays.value[0].date;
  const endDate = weekDays.value[6].date;
  
  try {
    await scheduleStore.loadShifts(startDate, endDate);
  } catch (error) {
    console.error('Failed to load week shifts:', error);
  }
};

// Уведомления
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');

const showNotificationMessage = (message: string, type: string) => {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  setTimeout(() => { showNotification.value = false; }, 3000);
};

// Наблюдаем за изменением недели
watch(currentWeekStart, loadWeekShifts);

// Загрузка при монтировании
onMounted(() => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  currentWeekStart.value = monday;
  
  loadWeekShifts();
});
</script>

<style scoped>
.week-view {
  padding: 20px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
  flex-shrink: 0;
}

.week-navigation h2 {
  color: #333;
  margin: 0;
  font-size: 1.2rem;
}

.nav-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.nav-btn:hover {
  background: #2980b9;
}

.week-grid {
  display: grid;
  grid-template-columns: 70px repeat(7, 1fr);
  grid-template-rows: 35px 780px;
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: auto;
  background: white;
  min-height: 0;
}

/* Временная колонка */
.time-column {
  grid-column: 1;
  grid-row: 1 / -1;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
}

.time-header {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.75rem;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 5;
}

.time-slot {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

/* Колонки дней */
.day-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* КОМПАКТНЫЙ кликабельный заголовок дня */
.day-header {
  height: 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  background: #f8f9fa;
  font-size: 0.65rem;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 5;
  transition: all 0.2s ease;
  line-height: 1.1;
}

.day-header.clickable {
  cursor: pointer;
}

.day-header.clickable:hover {
  background: #e3f2fd;
}

.day-header.today {
  background: #e3f2fd;
  font-weight: bold;
}

.day-header.weekend {
  background: #fff3e0;
}

.day-name {
  font-weight: bold;
  margin-bottom: 1px;
}

.shifts-count {
  font-size: 0.55rem;
  color: #666;
}

/* Контейнер для индикаторов смен */
.day-shifts-container {
  position: relative;
  height: 780px;
  border-right: 1px solid #f0f0f0;
  background: 
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 59px,
      #f0f0f0 59px,
      #f0f0f0 60px
    );
}

/* Индикатор часа со сменами */
.hour-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.hour-indicator.has-shifts {
  background: rgba(52, 152, 219, 0.1);
}

.hour-indicator.has-shifts:hover {
  background: rgba(52, 152, 219, 0.2);
}

.shift-count {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
  padding: 3px 8px;
}

/* Сообщение когда смен нет */
.no-shifts-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 0.7rem;
  text-align: center;
  padding: 6px 10px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.no-shifts-message:hover {
  background: #e3f2fd;
  border-color: #3498db;
  color: #3498db;
}

/* Уведомления */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: var(--color-success, #27ae60);
}

.notification.error {
  background: var(--color-danger, #e74c3c);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .week-view {
    padding: 10px;
    height: calc(100vh - 100px);
  }
  
  .week-grid {
    grid-template-columns: 50px repeat(7, 1fr);
    grid-template-rows: 30px 700px;
  }
  
  .time-header {
    height: 30px;
    font-size: 0.65rem;
  }
  
  .time-slot {
    font-size: 0.6rem;
    height: 50px;
  }
  
  .day-header {
    height: 30px;
    font-size: 0.55rem;
    padding: 1px;
  }
  
  .shift-count {
    font-size: 1rem;
    padding: 2px 6px;
  }
  
  .day-shifts-container {
    height: 700px;
  }
}
</style>