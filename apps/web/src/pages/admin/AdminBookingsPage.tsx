import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { IconRefresh, IconTrash } from '@tabler/icons-react';
import { reatomComponent } from '@reatom/react';
import type { Booking } from '@entities/booking';
import { formatDate, formatTime } from '@shared/lib';
import {
  bookingsTab,
  cancelAdminBooking,
  pastBookings,
  upcomingBookings,
} from '@features/owner-bookings';

/**
 * Строка таблицы бронирований
 */
function BookingRow({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
}) {
  const startTime = booking.slot?.startTime ?? '';
  const endTime = booking.slot?.endTime ?? '';

  return (
    <Table.Tr>
      <Table.Td>
        <Text size="sm">{startTime ? formatDate(startTime, 'DD.MM.YYYY') : '—'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {startTime && endTime
            ? `${formatTime(startTime)} – ${formatTime(endTime)}`
            : '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        {booking.slot?.startTime ? (
          <Badge variant="outline" color="orange" size="sm">
            {booking.eventType?.durationMinutes} мин •{' '}
            {booking.eventType?.name ?? '—'}
          </Badge>
        ) : (
          <Text size="sm" component="span">
            {booking.eventType?.name ?? '—'}
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>
          {booking.guestName}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {booking.guestEmail}
        </Text>
      </Table.Td>
      <Table.Td>
        {booking.status === 'CONFIRMED' && (
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={() => onCancel(booking.id)}
            aria-label="Отменить бронирование"
          >
            <IconTrash size={16} />
          </ActionIcon>
        )}
      </Table.Td>
    </Table.Tr>
  );
}

/**
 * Таблица бронирований
 */
function BookingsTable({
  bookings,
  isPending,
  error,
  onCancel,
}: {
  bookings: Booking[];
  isPending: boolean;
  error: Error | undefined;
  onCancel: (id: string) => void;
}) {
  if (isPending) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  if (error) {
    return (
      <Text c="red" ta="center" py="xl">
        Не удалось загрузить бронирования
      </Text>
    );
  }

  return (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Дата</Table.Th>
          <Table.Th>Время</Table.Th>
          <Table.Th>Тип события</Table.Th>
          <Table.Th>Гость</Table.Th>
          <Table.Th>Email</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {bookings.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={6}>
              <Text ta="center" c="dimmed" py="xl">
                Нет бронирований
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onCancel={onCancel} />
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}

/**
 * Страница управления бронированиями для администратора.
 * Вкладки: «Предстоящие» и «Прошедшие».
 */
export const AdminBookingsPage = reatomComponent(() => {
  const tab = bookingsTab();

  const upcomingData = upcomingBookings.data();
  const upcomingPending = upcomingBookings.pending();
  const upcomingError = upcomingBookings.error();

  const pastData = pastBookings.data();
  const pastPending = pastBookings.pending();
  const pastError = pastBookings.error();

  const handleRefresh = () => {
    if (tab === 'upcoming') {
      upcomingBookings.retry();
    } else {
      pastBookings.retry();
    }
  };

  const handleCancel = (id: string) => {
    cancelAdminBooking(id, () => {
      upcomingBookings.retry();
      pastBookings.retry();
    });
  };

  return (
    <Box p="md">
      {/* Кнопка обновления */}
      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="outline"
          color="gray"
          onClick={handleRefresh}
        >
          Обновить
        </Button>
      </Group>

      {/* Вкладки */}
      <Tabs
        value={tab}
        onChange={(value) => bookingsTab.set((value as typeof tab) ?? 'upcoming')}
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="upcoming">Предстоящие</Tabs.Tab>
          <Tabs.Tab value="past">Прошедшие</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="upcoming">
          <BookingsTable
            bookings={upcomingData}
            isPending={upcomingPending}
            error={upcomingError ?? undefined}
            onCancel={handleCancel}
          />
        </Tabs.Panel>

        <Tabs.Panel value="past">
          <BookingsTable
            bookings={pastData}
            isPending={pastPending}
            error={pastError ?? undefined}
            onCancel={handleCancel}
          />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}, 'AdminBookingsPage');
