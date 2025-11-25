<template>
  <div class="day-view">
    <!-- Уведомление о создании смены -->
    <div v-if="showNotification" class="notification" :class="notificationType">
      {{ notificationMessage }}
    </div>

    <div class="day-header">
      <h2>⏰ {{ selectedDateFormatted }}</h2>
      <div class="day-info">
        <span class="shifts-count">Смен: {{ shifts.length }}</span>
        <span class="coverage-status" :class="coverageStatus.status" :title="getCoverageDetails()">
          {{ coverageStatus.message }}
        </span>
        <button
          v-if="canGenerateShifts" 
          @click="generateOptimalShifts"
          class="generate-btn"
        >
          🎯 Оптимальное покрытие
        </button>
      </div>
    </div>

    <!-- Панель правил покрытия КОМПАКТНАЯ -->
    <div class="coverage-rules-panel compact">
      <div class="rules-toggle" @click="toggleRules">
        📊 Правила покрытия 
        <span class="toggle-icon">{{ showRules ? '▲' : '▼' }}</span>
      </div>
      
      <div v-if="showRules" class="rules-content">
        <div class="rules-grid">
          <div class="rule-category" v-for="rule in coverageRulesList" :key="rule.role">
            <div class="rule-header" :class="rule.role">{{ rule.displayName }} ({{ rule.totalRequired }} всего)</div>
            <div class="rule-intervals">
              <div v-for="interval in rule.intervals" :key="interval.start">
                {{ interval.start }}-{{ interval.end }}: мин {{ rule.minPerInterval }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="timeline-container">
      <!-- Левая колонка с часами -->
      <div class="time-labels">
        <div 
          v-for="hour in hours" 
          :key="hour"
          class="time-label"
          :style="{ top: `${(hour - 7) * 60}px` }"
        >
          {{ hour }}:00
        </div>
      </div>

      <!-- Таймлайн -->
      <div 
        class="timeline"
        :class="{ 
          'drag-active': shiftDrag.active,
          'selection-active': dragSelection.active 
        }"
      >
        <!-- Слоты часов как фон -->
        <div 
          v-for="hour in hours" 
          :key="hour"
          class="hour-slot"
          :style="{ top: `${(hour - 7) * 60}px` }"
          @mousedown="startDragSelection($event, hour)"
          @mousemove="handleDragSelection($event, hour)"
          @mouseup="endDragSelection"
        >
          <!-- Подсказка времени при выделении -->
          <div 
            v-if="dragSelection.active && dragSelection.startHour === hour" 
            class="selection-time-tooltip start"
          >
            {{ getSelectionStartTime() }}
          </div>
          <div 
            v-if="dragSelection.active && dragSelection.currentHour === hour" 
            class="selection-time-tooltip end"
          >
            {{ getSelectionEndTime() }}
          </div>
        </div>

        <!-- Предпросмотр позиции при перетаскивании -->
        <div
          v-if="shiftDrag.active && shiftDrag.shift"
          class="shift-preview"
          :style="getShiftPreviewStyle()"
        ></div>

        <!-- Смены - абсолютно позиционированы в timeline -->
        <div
          v-for="{shift, index} in getAllShifts()"
          :key="shift.id"
          class="shift-block"
          :style="getShiftStyle(shift, index)"
          :class="[
            shift.role,
            { 
              dragging: shiftDrag.active && shiftDrag.shift?.id === shift.id,
              'drag-preview': shiftDrag.active && shiftDrag.shift?.id !== shift.id
            }
          ]"
          @mousedown="startShiftDrag($event, shift)"
          @contextmenu="showContextMenu($event, shift)"
        >
          <div class="shift-info">
            <span class="shift-employee">{{ getEmployeeShortName(shift.employee) }}</span>
            <span class="shift-time">{{ shift.start_time }} - {{ shift.end_time }}</span>
          </div>
          
          <!-- Индикатор перетаскивания -->
          <div v-if="shiftDrag.active && shiftDrag.shift?.id === shift.id" class="drag-indicator">
            ↕
          </div>
        </div>

        <!-- Область выделения с временем -->
        <div
          v-if="dragSelection.active"
          class="selection-area"
          :style="getSelectionAreaStyle()"
        >
          <!-- Время выделения в центре области -->
          <div class="selection-time-display">
            <div class="selection-time-range">
              {{ getSelectionStartTime() }} - {{ getSelectionEndTime() }}
            </div>
            <div class="selection-duration">
              {{ getSelectionDuration() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Контекстное меню для смен -->
    <div 
      v-if="contextMenu.visible" 
      class="context-menu"
      :style="contextMenu.style"
    >
      <div class="context-item" @click="contextMenu.shift && editShift(contextMenu.shift)">
        ✏️ Редактировать
      </div>
      <div class="context-item" @click="contextMenu.shift && deleteShift(contextMenu.shift)">
        🗑️ Удалить
      </div>
    </div>

    <!-- Модальное окно создания смены -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <h3>Создать смену</h3>
        <div class="modal-time">
          📅 {{ selectedDateFormatted }}
          <br>
          ⏰ {{ createShiftData.startTime }} - {{ createShiftData.endTime }}
        </div>
        <div class="info-message">
          ⓘ Нельзя создать пересекающиеся смены для одного сотрудника
        </div>
        <div class="form-group">
          <label>Роль:</label>
          <select v-model="createShiftData.role" @change="updateAvailableEmployees">
            <option value="cashier">Кассир</option>
            <option value="manager">Менеджер зала</option>
            <option value="technician">Техник</option>
          </select>
        </div>

        <div class="form-group">
          <label>Сотрудник:</label>
          <select v-model="createShiftData.employee">
            <option 
              v-for="employee in availableEmployees" 
              :key="employee"
              :value="employee"
            >
              {{ employee }}
            </option>
          </select>
        </div>

        <div class="modal-actions">
          <button @click="createShift" class="btn-primary">Создать</button>
          <button @click="closeCreateModal" class="btn-secondary">Отмена</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования смены -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h3>Редактировать смену</h3>
        <div class="modal-time">
          📅 {{ selectedDateFormatted }}
        </div>

        <div class="info-message">
          ⓘ Нельзя создать пересекающиеся смены для одного сотрудника
        </div>
        
        <div class="form-group">
          <label>Начало:</label>
          <input 
            v-model="editShiftData.startTime" 
            type="time"
            :class="{ 'error': editShiftData.startTime && editShiftData.endTime && editShiftData.startTime >= editShiftData.endTime }"
          >
        </div>

        <div class="form-group">
          <label>Конец:</label>
          <input 
            v-model="editShiftData.endTime" 
            type="time"
            :class="{ 'error': editShiftData.startTime && editShiftData.endTime && editShiftData.startTime >= editShiftData.endTime }"
          >
        </div>

        <div class="form-group">
          <label>Роль:</label>
          <select v-model="editShiftData.role" @change="updateAvailableEmployeesForEdit">
            <option value="cashier">Кассир</option>
            <option value="manager">Менеджер зала</option>
            <option value="technician">Техник</option>
          </select>
        </div>

        <div class="form-group">
          <label>Сотрудник:</label>
          <select v-model="editShiftData.employee">
            <option 
              v-for="employee in availableEmployees" 
              :key="employee"
              :value="employee"
            >
              {{ employee }}
            </option>
          </select>
        </div>

        <div v-if="editShiftData.startTime && editShiftData.endTime && editShiftData.startTime >= editShiftData.endTime" 
            class="error-message">
          ⚠️ Время окончания должно быть позже времени начала
        </div>

        <div class="modal-actions">
          <button 
            @click="updateShift" 
            class="btn-primary"
            :disabled="!isEditFormValid"
          >
            Сохранить
          </button>
          <button @click="closeEditModal" class="btn-secondary">Отмена</button>
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
import { hasEmployeeShiftOverlap } from '../utils/timeUtils';
import { analyzeCoverage } from '../utils/coverageUtils';
import type { Shift } from '../types';
import './DayView.css';

const coverageRulesList = computed(() => scheduleStore.coverageRules || []);
const calendarStore = useCalendarStore();
const scheduleStore = useScheduleStore();

// Часы таймлайна (7:00 - 20:00)
const hours = Array.from({ length: 14 }, (_, i) => i + 7);

const showRules = ref(false); // По умолчанию свернуто

const toggleRules = () => {
  showRules.value = !showRules.value;
};

// Состояние drag & drop для создания смен
const dragSelection = ref({
  active: false,
  startHour: 0,
  currentHour: 0,
  startY: 0
});

// Состояние drag & drop для перемещения смен
const shiftDrag = ref({
  active: false,
  shift: null as Shift | null,
  originalStartTime: '',
  originalEndTime: '',
  startY: 0,
  currentY: 0,
  hourOffset: 0
});

const showCreateModal = ref(false);
const showEditModal = ref(false);
const createShiftData = ref({
  role: 'cashier' as 'cashier' | 'manager' | 'technician',
  employee: '',
  startTime: '',
  endTime: ''
});

const editShiftData = ref({
  id: 0,
  startTime: '',
  endTime: '',
  role: 'cashier' as 'cashier' | 'manager' | 'technician',
  employee: ''
});

// Уведомления
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');

// Контекстное меню
const contextMenu = ref({
  visible: false,
  shift: null as Shift | null,
  style: { top: '0px', left: '0px' }
});


// Проверяем можно ли показывать кнопку генерации

const hasShiftsForSelectedDate = computed(() => {
  if (!calendarStore.selectedDate) return false;
  const dateStr = formatDate(calendarStore.selectedDate);
  const shiftsForDate = scheduleStore.getShiftsByDate(dateStr);
  return shiftsForDate.length > 0;
});

const canGenerateShifts = computed(() => {
  const authStore = useAuthStore();
  
  // Проверяем роль (только manager и admin)
  const hasPermission = authStore.userRole === 'manager' || authStore.userRole === 'admin';
  
  // Проверяем что дата не прошедшая
  if (!calendarStore.selectedDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(calendarStore.selectedDate);
  selectedDate.setHours(0, 0, 0, 0);
  
  const isFutureOrToday = selectedDate >= today;
  
  // Добавляем проверку что смен еще нет
  return hasPermission && isFutureOrToday && !hasShiftsForSelectedDate.value;
});

const generateOptimalShifts = async () => {
  if (!calendarStore.selectedDate) return;
  
  try {
    console.log('🔄 Generating optimal shifts...');
    const dateStr = formatDate(calendarStore.selectedDate);
    
    const generatedShifts = await scheduleStore.generateOptimalShifts(dateStr);
    console.log('✅ Generated shifts:', generatedShifts);
    
    // Добавляем сгенерированные смены в store
    generatedShifts.forEach(shift => {
      scheduleStore.shifts.push(shift);
    });
    
    // Показываем уведомление об успехе
    showNotification.value = true;
    notificationMessage.value = `✅ Сгенерировано ${generatedShifts.length} смен`;
    notificationType.value = 'success';
    
  } catch (error: any) {
    console.error('❌ Failed to generate shifts:', error);
    
    // Показываем уведомление об ошибке
    showNotification.value = true;
    notificationMessage.value = `❌ Ошибка: ${error.message || 'Не удалось сгенерировать смены'}`;
    notificationType.value = 'error';
  }
};

// Доступные сотрудники
const availableEmployees = ref<string[]>([]);

const selectedDateFormatted = computed(() => {
  if (!calendarStore.selectedDate) return 'Выберите дату';
  return calendarStore.selectedDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const shifts = computed(() => {
  if (!calendarStore.selectedDate) return [];
  const dateStr = formatDate(calendarStore.selectedDate);
  const filteredShifts = scheduleStore.getShiftsByDate(dateStr);
  
  return filteredShifts;
});

const coverageStatus = computed(() => {
  if (!calendarStore.selectedDate) {
    return { status: 'neutral', message: 'Выберите дату' };
  }
  
  const dateStr = formatDate(calendarStore.selectedDate);
  const analysis = analyzeCoverage(scheduleStore.shifts, dateStr, coverageRulesList.value);
  
  // Приводим к единому формату
  return {
    status: analysis.status || 'neutral',
    message: analysis.message || 'Нет данных'
  };
});

const getCoverageDetails = (): string => {
  if (!calendarStore.selectedDate) return '';
  
  const dateStr = formatDate(calendarStore.selectedDate);
  const analysis = analyzeCoverage(scheduleStore.shifts, dateStr, coverageRulesList.value);
  
  if (analysis.status === 'good') {
    return 'Все правила покрытия соблюдены!';
  }
  
  if (analysis.issues && analysis.issues.length > 0) {
    return analysis.issues.join('\n');
  }
  
  return 'Есть проблемы с покрытием';
};

// Добавим computed свойство для проверки валидности времени
const isEditFormValid = computed(() => {
  if (!editShiftData.value.startTime || !editShiftData.value.endTime) {
    return false;
  }
  return editShiftData.value.startTime < editShiftData.value.endTime;
});

// Форматирование даты
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

// Функция для сокращения имен сотрудников
const getEmployeeShortName = (employee: string): string => {
  const shortNames: Record<string, string> = {
    'кассир1': 'К1',
    'кассир2': 'К2',
    'кассир3': 'К3',
    'кассир4': 'К4',
    'кассир5': 'К5',
    'менеджер зала 1': 'М1',
    'менеджер зала 2': 'М2',
    'техник1': 'Т1',
    'техник2': 'Т2'
  };
  return shortNames[employee] || employee;
};

// Метод для получения всех смен
const getAllShifts = () => {
  return shifts.value.map((shift, index) => ({
    shift,
    index
  }));
};

// Стили для блока смены
const getShiftStyle = (shift: Shift, index: number) => {
  const startParts = (shift.start_time || '07:00').split(':');
  const endParts = (shift.end_time || '18:00').split(':');
  
  const startHour = parseInt(startParts[0] ?? '7') || 7;
  const startMinutes = parseInt(startParts[1] ?? '0') || 0;
  const endHour = parseInt(endParts[0] ?? '18') || 18;
  const endMinutes = parseInt(endParts[1] ?? '0') || 0;
  
  // Вычисляем позицию начала в пикселях (каждый час = 60px)
  const startPosition = ((startHour - 7) * 60 + startMinutes);
  
  // Вычисляем высоту в пикселях
  const durationInMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes);
  const height = durationInMinutes;
  
  // Горизонтальная позиция (каждая следующая смена смещается на 54px)
  const leftPosition = 60 + (index * 54);
  
  return {
    top: `${startPosition}px`,
    height: `${height}px`,
    left: `${leftPosition}px`,
    width: '50px'
  };
};

// Стиль для предпросмотра при перетаскивании
const getShiftPreviewStyle = () => {
  if (!shiftDrag.value.active || !shiftDrag.value.shift) return {};
  
  const originalStartParts = (shiftDrag.value.originalStartTime || '07:00').split(':');
  const originalEndParts = (shiftDrag.value.originalEndTime || '18:00').split(':');

  const originalStartHour = parseInt(originalStartParts[0] ?? '7') || 7;
  const originalStartMinutes = parseInt(originalStartParts[1] ?? '0') || 0;
  const originalEndHour = parseInt(originalEndParts[0] ?? '18') || 18;
  const originalEndMinutes = parseInt(originalEndParts[1] ?? '0') || 0;
  
  const newStartHour = Math.max(7, Math.min(20, originalStartHour + shiftDrag.value.hourOffset));
  const newEndHour = Math.max(7, Math.min(20, originalEndHour + shiftDrag.value.hourOffset));
  
  const startPosition = ((newStartHour - 7) * 60 + originalStartMinutes);
  const durationInMinutes = (newEndHour - newStartHour) * 60 + (originalEndMinutes - originalStartMinutes);
  const height = durationInMinutes;
  
  // Находим индекс текущей смены для горизонтального позиционирования
  const currentIndex = shifts.value.findIndex(s => s.id === shiftDrag.value.shift?.id);
  const leftPosition = 60 + (currentIndex * 54);
  
  return {
    top: `${startPosition}px`,
    height: `${height}px`,
    left: `${leftPosition}px`,
    width: '50px'
  };
};

// Методы для отображения времени выделения
const getSelectionStartTime = (): string => {
  if (!dragSelection.value.active) return '';
  const startHour = Math.min(dragSelection.value.startHour, dragSelection.value.currentHour);
  return formatTime(startHour);
};

const getSelectionEndTime = (): string => {
  if (!dragSelection.value.active) return '';
  const endHour = Math.max(dragSelection.value.startHour, dragSelection.value.currentHour) + 1;
  return formatTime(endHour);
};

const getSelectionDuration = (): string => {
  if (!dragSelection.value.active) return '';
  const startHour = Math.min(dragSelection.value.startHour, dragSelection.value.currentHour);
  const endHour = Math.max(dragSelection.value.startHour, dragSelection.value.currentHour) + 1;
  const duration = endHour - startHour;
  return `${duration} час${duration > 1 ? 'а' : ''}`;
};

// Drag & Drop для создания смены
const startDragSelection = (event: MouseEvent, hour: number) => {
  dragSelection.value = {
    active: true,
    startHour: hour,
    currentHour: hour,
    startY: event.clientY
  };
};

const handleDragSelection = (event: MouseEvent, hour: number) => {
  if (!dragSelection.value.active) return;
  
  const previousHour = dragSelection.value.currentHour;
  dragSelection.value.currentHour = hour;
  
  // Обновляем визуальные подсказки только если час изменился
  if (previousHour !== hour) {
    console.log(`Выделение: ${getSelectionStartTime()} - ${getSelectionEndTime()}`);
  }
};

const endDragSelection = () => {
  if (!dragSelection.value.active) return;
  
  const startHour = Math.min(dragSelection.value.startHour, dragSelection.value.currentHour);
  const endHour = Math.max(dragSelection.value.startHour, dragSelection.value.currentHour) + 1;
  
  // Проверяем что выделение имеет достаточную длительность
  if (endHour - startHour < 1) {
    // Слишком короткое выделение - игнорируем
    dragSelection.value.active = false;
    return;
  }
  
  // Открываем модальное окно для создания смены
  createShiftData.value.startTime = formatTime(startHour);
  createShiftData.value.endTime = formatTime(endHour);
  updateAvailableEmployees();
  showCreateModal.value = true;
  
  dragSelection.value.active = false;
};

// Стиль для области выделения
const getSelectionAreaStyle = () => {
  if (!dragSelection.value.active) return {};
  
  const startHour = Math.min(dragSelection.value.startHour, dragSelection.value.currentHour);
  const endHour = Math.max(dragSelection.value.startHour, dragSelection.value.currentHour);
  
  const top = (startHour - 7) * 60;
  const height = (endHour - startHour + 1) * 60;
  
  return {
    top: `${top}px`,
    height: `${height}px`
  };
};

// Drag & Drop для перемещения смен
const startShiftDrag = (event: MouseEvent, shift: Shift) => {

  const authStore = useAuthStore();
  
  // ПРОВЕРКА ПРАВ - только manager и admin могут перемещать смены
  if (authStore.userRole !== 'admin' && authStore.userRole !== 'manager') {
    console.log('Недостаточно прав для перемещения смен');
    return;
  }
  
  // Только левая кнопка мыши
  if (event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();
  
  shiftDrag.value = {
    active: true,
    shift,
    originalStartTime: shift.start_time,
    originalEndTime: shift.end_time,
    startY: event.clientY,
    currentY: event.clientY,
    hourOffset: 0
  };

  // Добавляем обработчики для всего документа
  document.addEventListener('mousemove', handleShiftDragMove);
  document.addEventListener('mouseup', stopShiftDrag);
};

// Обработчик перемещения мыши при перетаскивании
const handleShiftDragMove = (event: MouseEvent) => {
  if (!shiftDrag.value.active) return;
  
  shiftDrag.value.currentY = event.clientY;
  
  // Вычисляем смещение в часах (каждые 30px = 1 час)
  const deltaY = shiftDrag.value.currentY - shiftDrag.value.startY;
  const hourOffset = Math.round(deltaY / 30); // 30px на полчаса для точности
  
  if (hourOffset !== shiftDrag.value.hourOffset) {
    shiftDrag.value.hourOffset = hourOffset;
    updateShiftPosition();
  }
};

// Обновление позиции смены при перетаскивании
const updateShiftPosition = () => {
  if (!shiftDrag.value.active || !shiftDrag.value.shift) return;
  
  const originalStartParts = (shiftDrag.value.originalStartTime || '07:00').split(':');
  const originalEndParts = (shiftDrag.value.originalEndTime || '18:00').split(':');

  const originalStartHour = parseInt(originalStartParts[0] ?? '7') || 7;
  const originalStartMinutes = parseInt(originalStartParts[1] ?? '0') || 0;
  const originalEndHour = parseInt(originalEndParts[0] ?? '18') || 18;
  const originalEndMinutes = parseInt(originalEndParts[1] ?? '0') || 0;
  
  // Вычисляем новое время
  const newStartHour = Math.max(7, Math.min(20, originalStartHour + shiftDrag.value.hourOffset));
  const newEndHour = Math.max(7, Math.min(20, originalEndHour + shiftDrag.value.hourOffset));
  
  // Обновляем время смены
  if (shiftDrag.value.shift) {
    shiftDrag.value.shift.start_time = `${newStartHour.toString().padStart(2, '0')}:${originalStartMinutes.toString().padStart(2, '0')}`;
    shiftDrag.value.shift.end_time = `${newEndHour.toString().padStart(2, '0')}:${originalEndMinutes.toString().padStart(2, '0')}`;
  }
};

// Завершение перетаскивания
const stopShiftDrag = async () => {
  if (!shiftDrag.value.active || !shiftDrag.value.shift) return;
  
  // ПРОВЕРЯЕМ БЫЛ ЛИ РЕАЛЬНЫЙ DRAG (перемещение)
  const dragDistance = Math.abs(shiftDrag.value.currentY - shiftDrag.value.startY);
  const minDragDistance = 10; // минимальное перемещение в пикселях
  
  if (dragDistance < minDragDistance) {
    // Это был простой клик, а не drag - НЕ показываем уведомление
    shiftDrag.value.active = false;
    return;
  }
  
  try {
    await scheduleStore.updateShift(shiftDrag.value.shift);
    
    // ПОКАЗЫВАЕМ УВЕДОМЛЕНИЕ ТОЛЬКО ПРИ РЕАЛЬНОМ DRAG
    showNotification.value = true;
    notificationMessage.value = `Смена перемещена: ${shiftDrag.value.shift.start_time} - ${shiftDrag.value.shift.end_time}`;
    notificationType.value = 'success';
    
    setTimeout(() => {
      showNotification.value = false;
    }, 2000);
    
  } catch (error) {
    console.error('❌ Save failed:', error);
  }
  
  shiftDrag.value.active = false;
};

// Контекстное меню
const showContextMenu = (event: MouseEvent, shift: Shift) => {
  event.preventDefault();
  event.stopPropagation();
  
  contextMenu.value = {
    visible: true,
    shift,
    style: {
      top: `${event.clientY}px`,
      left: `${event.clientX}px`
    }
  };
};

const hideContextMenu = () => {
  contextMenu.value.visible = false;
};


// Удаление смены
const deleteShift = (shift: Shift) => {
  if (!shift) return;
  
  const authStore = useAuthStore(); 
  
  // ПРОВЕРКА ПРАВ 
  if (authStore.userRole !== 'admin' && authStore.userRole !== 'manager') {
    showNotification.value = true;
    notificationMessage.value = '❌ Недостаточно прав для удаления смен';
    notificationType.value = 'error';
    setTimeout(() => { showNotification.value = false; }, 3000);
    hideContextMenu();
    return;
  }

  // Подтверждение удаления
  if (confirm(`Вы уверены, что хотите удалить смену сотрудника ${shift.employee} (${shift.start_time}-${shift.end_time})?`)) {
    try {
      // Проверяем, что метод существует
      if (typeof scheduleStore.deleteShift === 'function') {
        scheduleStore.deleteShift(shift.id);
        
        // Показываем уведомление об успехе
        showNotification.value = true;
        notificationMessage.value = `Смена удалена: ${shift.employee} (${shift.start_time}-${shift.end_time})`;
        notificationType.value = 'success';
        
        setTimeout(() => {
          showNotification.value = false;
        }, 3000);
        
        console.log('Смена успешно удалена:', shift);
      } else {
        throw new Error('Метод deleteShift не найден в store');
      }
    } catch (error) {
      // Показываем уведомление об ошибке
      showNotification.value = true;
      notificationMessage.value = 'Ошибка при удалении смены';
      notificationType.value = 'error';
      
      setTimeout(() => {
        showNotification.value = false;
      }, 3000);
      
      console.error('Ошибка при удалении смены:', error);
    }
  }
  hideContextMenu();
};

// Редактирование смены
const editShift = (shift: Shift) => {
  const authStore = useAuthStore();

  if (authStore.userRole !== 'admin' && authStore.userRole !== 'manager') {
    showNotification.value = true;
    notificationMessage.value = '❌ Недостаточно прав для редактирования смен';
    notificationType.value = 'error';
    setTimeout(() => { showNotification.value = false; }, 3000);
    hideContextMenu();
    return;
  }

  editShiftData.value = {
    id: shift.id,
    startTime: shift.start_time,
    endTime: shift.end_time,
    role: shift.role,
    employee: shift.employee
  };
  
  // Обновляем список доступных сотрудников для выбранной роли
  updateAvailableEmployeesForEdit();
  showEditModal.value = true;
  hideContextMenu();
};

// Обновление списка сотрудников для редактирования
const updateAvailableEmployeesForEdit = () => {
  const employees = {
    cashier: ['кассир1', 'кассир2', 'кассир3', 'кассир4', 'кассир5'],
    manager: ['менеджер зала 1', 'менеджер зала 2'],
    technician: ['техник1', 'техник2']
  };
  
  availableEmployees.value = employees[editShiftData.value.role] || [];
};

// Редактирование смены
const updateShift = () => {
  if (!editShiftData.value) return;
  
  try {
    const startTime = editShiftData.value.startTime;
    const endTime = editShiftData.value.endTime;
    
    if (!startTime || !endTime) {
      alert('Пожалуйста, укажите время начала и окончания смены');
      return;
    }
    
    if (startTime >= endTime) {
      alert('Время окончания смены должно быть позже времени начала');
      return;
    }
    
    const updatedShift: Shift = {
      id: editShiftData.value.id,
      date: formatDate(calendarStore.selectedDate!),
      start_time: startTime,
      end_time: endTime,
      employee: editShiftData.value.employee,
      role: editShiftData.value.role
    };
    
    // Проверяем пересечение смен (исключая текущую редактируемую смену)
    if (hasEmployeeShiftOverlap(
      scheduleStore.shifts,
      updatedShift.employee,
      updatedShift.date,
      updatedShift.start_time,
      updatedShift.end_time,
      updatedShift.id // Исключаем текущую смену из проверки
    )) {
      // Показываем ошибку
      showNotification.value = true;
      notificationMessage.value = `❌ Ошибка: у сотрудника ${updatedShift.employee} уже есть смена в это время`;
      notificationType.value = 'error';
      
      setTimeout(() => {
        showNotification.value = false;
      }, 4000);
      return;
    }
    
    // Проверяем, что метод существует в store
    if (typeof scheduleStore.updateShift === 'function') {
      scheduleStore.updateShift(updatedShift);
      
      showNotification.value = true;
      notificationMessage.value = `✅ Смена обновлена: ${updatedShift.employee} (${updatedShift.start_time}-${updatedShift.end_time})`;
      notificationType.value = 'success';
      
      setTimeout(() => {
        showNotification.value = false;
      }, 3000);
    } else {
      // Временное решение если метод в store не работает
      const shiftIndex = scheduleStore.shifts.findIndex(s => s.id === updatedShift.id);
      if (shiftIndex !== -1) {
        scheduleStore.shifts[shiftIndex] = updatedShift;
        
        showNotification.value = true;
        notificationMessage.value = `✅ Смена обновлена: ${updatedShift.employee} (${updatedShift.start_time}-${updatedShift.end_time})`;
        notificationType.value = 'success';
        
        setTimeout(() => {
          showNotification.value = false;
        }, 3000);
      }
    }
    
    closeEditModal();
  } catch (error) {
    showNotification.value = true;
    notificationMessage.value = '❌ Ошибка при обновлении смены';
    notificationType.value = 'error';
    
    setTimeout(() => {
      showNotification.value = false;
    }, 3000);
    
    console.error('Ошибка при обновлении смены:', error);
  }
};

// Обновление списка доступных сотрудников
const updateAvailableEmployees = () => {
  const employees = {
    cashier: ['кассир1', 'кассир2', 'кассир3', 'кассир4', 'кассир5'],
    manager: ['менеджер зала 1', 'менеджер зала 2'],
    technician: ['техник1', 'техник2']
  };
  
  availableEmployees.value = employees[createShiftData.value.role] || [];
  createShiftData.value.employee = availableEmployees.value[0] || '';
};

// Создание смены
const createShift = () => {
  if (!calendarStore.selectedDate) return;
  
  const newShift: Omit<Shift, 'id'> = {
    date: formatDate(calendarStore.selectedDate),
    start_time: createShiftData.value.startTime,
    end_time: createShiftData.value.endTime,
    employee: createShiftData.value.employee,
    role: createShiftData.value.role
  };
  
  // Проверяем пересечение смен
  if (hasEmployeeShiftOverlap(
    scheduleStore.shifts,
    newShift.employee,
    newShift.date,
    newShift.start_time,
    newShift.end_time
  )) {
    // Показываем ошибку
    showNotification.value = true;
    notificationMessage.value = `❌ Ошибка: у сотрудника ${newShift.employee} уже есть смена в это время`;
    notificationType.value = 'error';
    
    setTimeout(() => {
      showNotification.value = false;
    }, 4000);
    return;
  }
  
  // Используем метод store для создания смены
  scheduleStore.createShift(newShift);
  
  // Показываем уведомление
  showNotification.value = true;
  notificationMessage.value = `✅ Смена создана: ${newShift.employee} (${newShift.start_time}-${newShift.end_time})`;
  notificationType.value = 'success';
  
  setTimeout(() => {
    showNotification.value = false;
  }, 3000);
  
  closeCreateModal();
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  dragSelection.value.active = false;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

// Наблюдаем за изменением выбранной даты
watch(
  () => calendarStore.selectedDate,
  (newDate) => {
    if (newDate) {
      loadShiftsForDate(newDate);
    }
  }
);

// Загрузка смен для даты
const loadShiftsForDate = async (date: Date) => {
  const dateStr = formatDate(date);
  try {
    // Загружаем смены с сервера
    await scheduleStore.loadShifts(dateStr);
  } catch (error) {
    console.error('Failed to load shifts:', error);
  }
};

// Загрузка при монтировании
onMounted(async () => {
  const authStore = useAuthStore(); // ← создаем экземпляр здесь
  // Ждем инициализации авторизации
  await authStore.initialize();

  if (calendarStore.selectedDate) {
    loadShiftsForDate(calendarStore.selectedDate);
  } else {
    calendarStore.selectDate(new Date());
    loadShiftsForDate(new Date());
  }
  
  // Закрываем контекстное меню при клике вне его
  document.addEventListener('click', hideContextMenu);
});

import { onUnmounted } from 'vue';

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu);
});
</script>