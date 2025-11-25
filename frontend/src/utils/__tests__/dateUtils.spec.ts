import { describe, it, expect } from 'vitest';
import { formatDate } from '../dateUtils';


describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD without timezone issues', () => {
      const date = new Date(2025, 10, 17); // 17 ноября 2025
      expect(formatDate(date)).toBe('2025-11-17');
    });
  });
});