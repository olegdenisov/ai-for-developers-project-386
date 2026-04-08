import { reatomComponent } from '@reatom/react';
import { useEffect } from 'react';
import {
  Title,
  Text,
  Button,
  Stack,
  Group,
  Card,
  Badge,
  Avatar,
  Grid,
  Box,
  Divider,
  UnstyledButton,
  Center,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { Layout, LoadingSpinner, ErrorMessage } from '@shared/ui';
import { formatTime, formatDate } from '@shared/lib';
import {
  fetchSlotsForDate,
  fetchSlotsForCalendar,
  isSlotsLoading,
  currentCalendarMonthAtom,
  selectedDateForRoute,
  slotsAtom,
} from './model/route';
import {
  selectedSlotAtom,
  calendarDaysAtom,
  slotsForSelectedDateAtom,
  goToPrevMonth,
  goToNextMonth,
  selectDate,
  selectSlot,
  proceedToBooking,
  goBack,
} from './model/model';
import { formatDuration, countAvailableSlotsForDate } from './helpers';
import type { EventType } from '@entities/event-type';
import type { Owner } from '@entities/owner';
import type { Slot } from '@entities/slot';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

// ============================================
// PROPS INTERFACE
// ============================================

interface EventTypePageProps {
  eventType?: EventType;
  owner?: Owner;
  isLoading: boolean;
  error?: string | null;
}

// ============================================
// COMPONENT
// ============================================

export const EventTypePage = reatomComponent(({ eventType, owner, isLoading, error }: EventTypePageProps) => {
  // Получаем состояние из atoms
  const selectedDate = selectedDateForRoute();
  const currentMonth = currentCalendarMonthAtom();
  const slotsLoading = isSlotsLoading();
  const slots = slotsAtom();
  const selectedSlot = selectedSlotAtom();
  const calendarDays = calendarDaysAtom();
  const slotsForSelectedDate = slotsForSelectedDateAtom();

  // Загружаем слоты при изменении выбранной даты
  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate();
    }
  }, [selectedDate]);

  // Загружаем слоты для календаря при монтировании
  useEffect(() => {
    // Небольшая задержка для гарантии что компонент полностью смонтирован
    const timeoutId = setTimeout(() => {
      fetchSlotsForCalendar();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Загружаем слоты при изменении месяца
  useEffect(() => {
    fetchSlotsForCalendar();
  }, [currentMonth]);

  // Отображение состояния загрузки
  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <Layout>
        <ErrorMessage message={error} />
        <Button onClick={goBack} mt="md">На главную</Button>
      </Layout>
    );
  }

  // Отображение если тип события не найден
  if (!eventType) {
    return (
      <Layout>
        <ErrorMessage message="Тип события не найден" />
        <Button onClick={goBack} mt="md">На главную</Button>
      </Layout>
    );
  }

  // Дни недели
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <Layout>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        onClick={goBack}
      >
        Назад
      </Button>

      <Grid style={{ gap: '24px' }}>
        {/* Левая панель - Информация о владельце и типе события */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Stack gap="lg">
            {/* Информация о владельце */}
            <Group gap="sm">
              <Avatar size="lg" radius="xl" color="blue">
                {owner?.name === 'Host' ? 'H' : owner?.name?.charAt(0).toUpperCase() || 'H'}
              </Avatar>
              <Box>
                <Text fw={600}>{owner?.name || 'Host'}</Text>
                <Text size="sm" c="dimmed">Host</Text>
              </Box>
            </Group>

            <Divider />

            {/* Название и длительность события */}
            <Box>
              <Group gap="xs" mb="xs">
                <Title order={4}>{eventType.name}</Title>
                <Badge leftSection={<IconClock size={12} />}>
                  {formatDuration(eventType.durationMinutes)}
                </Badge>
              </Group>
              {eventType.description && (
                <Text size="sm" c="dimmed">
                  {eventType.description}
                </Text>
              )}
            </Box>

            <Divider />

            {/* Выбранная дата и время */}
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Выбранная дата</Text>
              <Text>
                {selectedDate
                  ? formatDate(selectedDate, 'dddd, D MMMM')
                  : 'Дата не выбрана'}
              </Text>

              <Text size="sm" fw={500} c="dimmed" mt="sm">Выбранное время</Text>
              <Text>
                {selectedSlot
                  ? `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`
                  : 'Время не выбрано'}
              </Text>
            </Stack>
          </Stack>
        </Grid.Col>

        {/* Центральная панель - Календарь */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder shadow="sm">
            {/* Заголовок календаря с навигацией */}
            <Group justify="space-between" mb="md">
              <Title order={5}>Календарь</Title>
              <Group gap="xs">
                <Button variant="subtle" size="compact-sm" onClick={goToPrevMonth}>
                  <IconChevronLeft size={16} />
                </Button>
                <Button variant="subtle" size="compact-sm" onClick={goToNextMonth}>
                  <IconChevronRight size={16} />
                </Button>
              </Group>
            </Group>

            {/* Месяц и год */}
            <Text ta="center" fw={600} mb="md" size="lg">
              {dayjs(currentMonth).format('MMMM YYYY')}
            </Text>

            {/* Заголовки дней недели */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '4px',
              }}
            >
              {weekDays.map((day) => (
                <Text ta="center" size="sm" fw={500} c="dimmed" key={day}>
                  {day}
                </Text>
              ))}
            </div>

            {/* Сетка дат */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
              }}
            >
              {calendarDays.map((date: Date, index: number) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = selectedDate &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();
                const isToday = dayjs(date).isSame(dayjs(), 'day');
                const availableCount = countAvailableSlotsForDate(slots, date);
                const hasSlots = availableCount > 0;

                return (
                  <UnstyledButton
                    key={index}
                    onClick={() => isCurrentMonth && selectDate(date)}
                    disabled={!isCurrentMonth}
                    style={{
                      width: '100%',
                      padding: '8px 4px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid #228be6' : isToday ? '1px solid #ced4da' : 'none',
                      backgroundColor: isSelected ? '#e7f5ff' : 'transparent',
                      opacity: isCurrentMonth ? 1 : 0.3,
                      cursor: isCurrentMonth ? 'pointer' : 'default',
                    }}
                  >
                    <Stack gap={2} align="center">
                      <Text
                        size="sm"
                        fw={isSelected ? 700 : 400}
                        c={isCurrentMonth ? 'dark' : 'dimmed'}
                      >
                        {date.getDate()}
                      </Text>
                      {hasSlots && isCurrentMonth && (
                        <Text size="xs" c="green" fw={500}>
                          {availableCount} св.
                        </Text>
                      )}
                      {!hasSlots && isCurrentMonth && (
                        <Text size="xs" c="dimmed">
                          -
                        </Text>
                      )}
                    </Stack>
                  </UnstyledButton>
                );
              })}
            </div>
          </Card>
        </Grid.Col>

        {/* Правая панель - Статус слотов */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="sm" h="100%">
            <Title order={5} mb="md">Статус слотов</Title>

            {slotsLoading ? (
              <Center py="xl">
                <LoadingSpinner size="sm" />
              </Center>
            ) : !selectedDate ? (
              <Text c="dimmed" ta="center" py="xl">
                Выберите дату для просмотра доступных слотов
              </Text>
            ) : slotsForSelectedDate.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Нет доступных слотов на выбранную дату
              </Text>
            ) : (
              <Stack gap="xs" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {slotsForSelectedDate.map((slot: Slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const isAvailable = slot.isAvailable;

                  return (
                    <UnstyledButton
                      key={slot.id}
                      onClick={() => selectSlot(slot)}
                      disabled={!isAvailable}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #228be6' : '1px solid #e9ecef',
                        backgroundColor: isSelected ? '#e7f5ff' : isAvailable ? '#f8f9fa' : '#f1f3f5',
                        opacity: isAvailable ? 1 : 0.6,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <Text fw={isSelected ? 600 : 400}>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </Text>
                        <Badge
                          color={isAvailable ? 'green' : 'gray'}
                          variant={isAvailable ? 'light' : 'filled'}
                          size="sm"
                        >
                          {isAvailable ? 'Свободно' : 'Занято'}
                        </Badge>
                      </Group>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            )}

            <Divider my="md" />

            {/* Кнопки навигации */}
            <Group justify="space-between" mt="auto">
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={goBack}
              >
                Назад
              </Button>
              <Button
                rightSection={<IconArrowRight size={16} />}
                onClick={() => proceedToBooking(eventType)}
                disabled={!selectedSlot}
              >
                Продолжить
              </Button>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Layout>
  );
}, 'EventTypePage');
