import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Shift } from '../types';
import { api } from '@/services/api'

export const useScheduleStore = defineStore('schedule', () => {
  const shifts = ref<Shift[]>([]);
  const coverageRules = ref<any>(null);

  const loadCoverageRules = async (): Promise<void> => {
    try {
      const rules = await api.getCoverageRules();
      coverageRules.value = rules; 
    } catch (error) {
      coverageRules.value = null;
    }
  };

  // Загружаем смены из API
  const loadShifts = async (startDate?: string, endDate?: string): Promise<void> => {
    try {
      // Если передана одна дата - загружаем смены за эту дату
      if (startDate && !endDate) {
        shifts.value = await api.getShiftsByDate(startDate);
      }
      // Если передан период - загружаем смены за период
      else if (startDate && endDate) {
        // TODO: Реализовать загрузку по периоду когда бэкенд поддержит
        // Пока загружаем все и фильтруем локально
        const allShifts = await api.getShifts();
        shifts.value = allShifts.filter(shift => 
          shift.date >= startDate && shift.date <= endDate
        );
      } else {
        // Загружаем все смены (для MonthView)
        shifts.value = await api.getShifts();
      }
    } catch (error) {
      console.error('Failed to load shifts:', error);
      shifts.value = [];
    }
  };

  const getShiftsByDate = (date: string): Shift[] => {
    return shifts.value.filter(shift => shift.date === date);
  };

  const createShift = async (shift: Omit<Shift, 'id'>): Promise<void> => {
    try {
      const newShift = await api.createShift(shift);
      shifts.value.push(newShift);
    } catch (error) {
      console.error('Failed to create shift:', error);
      throw error;
    }
  };

  const updateShift = async (updatedShift: Shift): Promise<void> => {
    try {
      const result = await api.updateShift(updatedShift.id, updatedShift);
      const index = shifts.value.findIndex(s => s.id === updatedShift.id);
      if (index !== -1) {
        shifts.value[index] = result;
      }
    } catch (error) {
      console.error('Failed to update shift:', error);
      throw error;
    }
  };

  const deleteShift = async (shiftId: number): Promise<void> => {
    try {
      await api.deleteShift(shiftId);
      shifts.value = shifts.value.filter(s => s.id !== shiftId);
    } catch (error) {
      console.error('Failed to delete shift:', error);
      throw error;
    }
  };

  const generateOptimalShifts = async (date: string): Promise<Shift[]> => {
    try {
      const response = await api.generateOptimalShifts(date);
      return response.shifts || [];
    } catch (error) {
      console.error('Failed to generate shifts:', error);
      throw error;
    }
  };

  return {
    shifts,
    coverageRules,
    loadCoverageRules,
    loadShifts,
    getShiftsByDate,
    createShift,
    updateShift,
    deleteShift,
    generateOptimalShifts
  };
});