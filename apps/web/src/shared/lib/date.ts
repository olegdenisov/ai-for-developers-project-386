import dayjs from 'dayjs';
import 'dayjs/locale/ru';

// Configure dayjs
dayjs.locale('ru');

// Date formatting utilities
export const formatDate = (date: string | Date, format: string = 'DD MMMM YYYY') => {
  return dayjs(date).format(format);
};

export const formatTime = (date: string | Date) => {
  return dayjs(date).format('HH:mm');
};

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('DD MMMM YYYY, HH:mm');
};

export const isSameDay = (date1: string | Date, date2: string | Date) => {
  return dayjs(date1).isSame(date2, 'day');
};

export const addDays = (date: string | Date, days: number) => {
  return dayjs(date).add(days, 'day').toDate();
};

export const startOfWeek = (date: string | Date) => {
  return dayjs(date).startOf('week').toDate();
};

export const endOfWeek = (date: string | Date) => {
  return dayjs(date).endOf('week').toDate();
};
