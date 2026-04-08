import { reatomComponent } from '@reatom/react';
import { Title, Text, Card, Button, Group, Stack, Table, ActionIcon, Modal, TextInput, NumberInput } from '@mantine/core';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';
import { EventType } from '../../../entities/event-type/types';
import { Booking } from '../../../entities/booking/types';

export const OwnerManagement = reatomComponent(() => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState({ name: '', durationMinutes: 30 });

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventTypesData, bookingsData] = await Promise.all([
        apiClient.get<EventType[]>('/event-types'),
        apiClient.get<Booking[]>('/owner/bookings'),
      ]);
      setEventTypes(eventTypesData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEventType = async () => {
    if (!formData.name.trim()) return;
    try {
      if (editingEventType) {
        await apiClient.put(`/event-types/${editingEventType.id}`, formData);
      } else {
        await apiClient.post('/event-types', formData);
      }
      setModalOpen(false);
      setEditingEventType(null);
      setFormData({ name: '', durationMinutes: 30 });
      loadData();
    } catch (error) {
      console.error('Ошибка сохранения типа события:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteEventType = async (id: string) => {
    if (!confirm('Удалить тип события?')) return;
    try {
      await apiClient.delete(`/event-types/${id}`);
      loadData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleEdit = (eventType: EventType) => {
    setEditingEventType(eventType);
    setFormData({ name: eventType.name, durationMinutes: eventType.durationMinutes });
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEventType(null);
    setFormData({ name: '', durationMinutes: 30 });
    setModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Text>Загрузка...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={2}>Управление календарём</Title>

      {/* Типы событий */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Типы событий</Title>
          <Button onClick={handleCreate}>
            Добавить тип
          </Button>
        </Group>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Длительность (мин)</Table.Th>
              <Table.Th>Создан</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {eventTypes.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} align="center">
                  <Text c="dimmed">Нет типов событий</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              eventTypes.map((eventType) => (
                <Table.Tr key={eventType.id}>
                  <Table.Td>{eventType.name}</Table.Td>
                  <Table.Td>{eventType.durationMinutes}</Table.Td>
                  <Table.Td>{formatDate(eventType.createdAt)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(eventType)}>
                        ✏️
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteEventType(eventType.id)}>
                        🗑️
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Предстоящие встречи */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="md">Предстоящие встречи</Title>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Гость</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Время начала</Table.Th>
              <Table.Th>Время окончания</Table.Th>
              <Table.Th>Статус</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bookings.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} align="center">
                  <Text c="dimmed">Нет предстоящих встреч</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              bookings.map((booking) => (
                <Table.Tr key={booking.id}>
                  <Table.Td>{booking.guestName}</Table.Td>
                  <Table.Td>{booking.guestEmail}</Table.Td>
                  <Table.Td>{formatDate(booking.startTime)}</Table.Td>
                  <Table.Td>{formatDate(booking.endTime)}</Table.Td>
                  <Table.Td>
                    <Text c={booking.status === 'confirmed' ? 'green' : booking.status === 'cancelled' ? 'red' : 'orange'}>
                      {booking.status === 'confirmed' ? 'Подтверждено' : booking.status === 'cancelled' ? 'Отменено' : 'Ожидание'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Модальное окно создания/редактирования */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEventType ? 'Редактировать тип события' : 'Создать тип события'}
      >
        <Stack gap="md">
          <TextInput
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <NumberInput
            label="Длительность (минуты)"
            value={formData.durationMinutes}
            onChange={(value) => setFormData({ ...formData, durationMinutes: Number(value) || 30 })}
            min={1}
            max={480}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEventType}>
              {editingEventType ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}, 'OwnerManagement');