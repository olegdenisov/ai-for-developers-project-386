import { reatomComponent } from '@reatom/react';
import { Calendar } from '@mantine/dates';
import { Box, Text, Group, Badge } from '@mantine/core';
import { Slot } from '../entities/slot/types';
import { useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CalendarSlotPickerProps {
  slots: Slot[];
  onSlotSelect?: (slot: Slot) => void;
  selectedSlotId?: string;
}

export const CalendarSlotPicker = reatomComponent((props: CalendarSlotPickerProps) => {
  const { slots, onSlotSelect, selectedSlotId } = props;
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Группируем слоты по дням
  const slotsByDay = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const day = format(parseISO(slot.startTime), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  // Отмечаем дни, в которых есть доступные слоты
  const hasSlotsDays = Object.keys(slotsByDay).map((day) => new Date(day));

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };

  const slotsForSelectedDay = selectedDate
    ? slotsByDay[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <Box>
      <Calendar
        value={selectedDate}
        onChange={handleDateSelect}
        locale={ru}
        renderDay={(date) => {
          const day = format(date, 'yyyy-MM-dd');
          const hasSlots = slotsByDay[day]?.length > 0;
          return (
            <div style={{ position: 'relative' }}>
              {date.getDate()}
              {hasSlots && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'var(--mantine-color-blue-6)',
                  }}
                />
              )}
            </div>
          );
        }}
      />
      {selectedDate && (
        <Box mt="md">
          <Text fw={500} mb="sm">
            Доступные слоты на {format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
          </Text>
          <Group gap="sm">
            {slotsForSelectedDay.length > 0 ? (
              slotsForSelectedDay.map((slot) => (
                <Badge
                  key={slot.id}
                  variant={selectedSlotId === slot.id ? 'filled' : 'outline'}
                  color={slot.isAvailable ? 'green' : 'red'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSlotSelect?.(slot)}
                >
                  {format(parseISO(slot.startTime), 'HH:mm')} -{' '}
                  {format(parseISO(slot.endTime), 'HH:mm')}
                </Badge>
              ))
            ) : (
              <Text c="dimmed">Нет доступных слотов</Text>
            )}
          </Group>
        </Box>
      )}
    </Box>
  );
}, 'CalendarSlotPicker');