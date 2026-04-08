import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  isSameDay,
  addDays,
  startOfWeek,
  endOfWeek,
} from './date';

describe('shared/lib/date', () => {
  describe('formatDate', () => {
    it('должен форматировать дату с дефолтным форматом', () => {
      const date = '2024-01-15';
      const result = formatDate(date);

      // Русская локаль dayjs: "15 января 2024"
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('должен форматировать дату с кастомным форматом', () => {
      const date = '2024-01-15';
      const result = formatDate(date, 'DD.MM.YYYY');

      expect(result).toBe('15.01.2024');
    });

    it('должен принимать Date объект', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, 'YYYY-MM-DD');

      expect(result).toBe('2024-01-15');
    });

    it('должен форматировать с русской локалью', () => {
      const date = '2024-01-15';
      const result = formatDate(date, 'MMMM');

      // В русской локали январь
      expect(result.toLowerCase()).toContain('янв');
    });
  });

  describe('formatTime', () => {
    it('должен форматировать время в HH:mm', () => {
      const date = '2024-01-15T14:30:00';
      const result = formatTime(date);

      expect(result).toBe('14:30');
    });

    it('должен форматировать полночь', () => {
      const date = '2024-01-15T00:00:00';
      const result = formatTime(date);

      expect(result).toBe('00:00');
    });

    it('должен форматировать полдень', () => {
      const date = '2024-01-15T12:00:00';
      const result = formatTime(date);

      expect(result).toBe('12:00');
    });
  });

  describe('formatDateTime', () => {
    it('должен форматировать дату и время', () => {
      const date = '2024-01-15T14:30:00';
      const result = formatDateTime(date);

      expect(result).toContain('15');
      expect(result).toContain('2024');
      expect(result).toContain('14:30');
    });
  });

  describe('isSameDay', () => {
    it('должен возвращать true для одинаковых дат', () => {
      const date1 = '2024-01-15';
      const date2 = '2024-01-15';

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('должен возвращать false для разных дат', () => {
      const date1 = '2024-01-15';
      const date2 = '2024-01-16';

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('должен работать с разными форматами одной даты', () => {
      const date1 = '2024-01-15';
      const date2 = new Date('2024-01-15');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('должен возвращать false для разных месяцев', () => {
      const date1 = '2024-01-15';
      const date2 = '2024-02-15';

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('должен добавлять дни к дате', () => {
      const date = '2024-01-15';
      const result = addDays(date, 5);

      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2024);
    });

    it('должен вычитать дни при отрицательном значении', () => {
      const date = '2024-01-15';
      const result = addDays(date, -5);

      expect(result.getDate()).toBe(10);
    });

    it('должен корректно переходить между месяцами', () => {
      const date = '2024-01-30';
      const result = addDays(date, 5);

      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1); // February
    });

    it('должен корректно работать с Date объектом', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 1);

      expect(result.getDate()).toBe(16);
    });
  });

  describe('startOfWeek', () => {
    it('должен возвращать начало недели', () => {
      // Среда 17 января 2024
      const date = '2024-01-17';
      const result = startOfWeek(date);

      // В русской локали неделя начинается с понедельника
      // 15 января - понедельник
      expect(result.getDay()).toBe(1); // Monday
    });

    it('должен работать если дата уже начало недели', () => {
      // Понедельник 15 января 2024
      const date = '2024-01-15';
      const result = startOfWeek(date);

      expect(result.getDate()).toBe(15);
      expect(result.getDay()).toBe(1);
    });
  });

  describe('endOfWeek', () => {
    it('должен возвращать конец недели', () => {
      // Среда 17 января 2024
      const date = '2024-01-17';
      const result = endOfWeek(date);

      // В русской локали неделя заканчивается воскресеньем
      expect(result.getDay()).toBe(0); // Sunday
    });

    it('должен работать если дата уже конец недели', () => {
      // Воскресенье 21 января 2024
      const date = '2024-01-21';
      const result = endOfWeek(date);

      expect(result.getDay()).toBe(0);
    });
  });
});
