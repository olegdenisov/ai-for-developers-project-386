import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Table,
  Text,
} from '@mantine/core';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { computed, withAsyncData, wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { eventTypesApiClient } from '@shared/api';
import type { EventType } from '@entities/event-type';
import { CreateEventTypeModal, isCreateEventTypeModalOpen } from '@features/create-event-type';
import { EditEventTypeModal, openEditEventType } from '@features/edit-event-type';
import { DeleteEventTypeModal, openDeleteEventType } from '@features/delete-event-type';

// ============================================
// СПИСОК ТИПОВ СОБЫТИЙ ДЛЯ СТРАНИЦЫ ADMIN
// ============================================

/**
 * Реактивный список всех типов событий.
 * Вызов .retry() обновляет список с сервера.
 */
const adminEventTypes = computed(async () => {
  const response = await wrap(eventTypesApiClient.listEventTypes());
  return response.data as EventType[];
}, 'adminEventTypes').extend(withAsyncData({ initState: [] as EventType[] }));

// ============================================
// КОМПОНЕНТ СТРАНИЦЫ
// ============================================

/**
 * Страница управления типами событий для администратора.
 * Отображает таблицу с возможностью создания, редактирования и удаления.
 */
export const AdminEventTypesPage = reatomComponent(() => {
  const eventTypes = adminEventTypes.data();
  const isReady = adminEventTypes.ready();
  const error = adminEventTypes.error();

  const handleRefresh = () => adminEventTypes.retry();

  const rows = eventTypes.map((et: EventType) => (
    <Table.Tr key={et.id}>
      <Table.Td>
        <Badge variant="outline" color="orange" size="md">
          {et.durationMinutes} мин
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text fw={500}>{et.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text c="dimmed" size="sm">
          {et.description ?? '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => openEditEventType(et)}
            aria-label="Редактировать"
          >
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={() => openDeleteEventType(et)}
            aria-label="Удалить"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box p="md">
      {/* Заголовок и кнопка создания */}
      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          color="orange"
          onClick={() => isCreateEventTypeModalOpen.setTrue()}
        >
          Создать
        </Button>
      </Group>

      {/* Таблица */}
      {!isReady && (
        <Center py="xl">
          <Loader color="orange" />
        </Center>
      )}

      {error && isReady && (
        <Text c="red" ta="center" py="xl">
          Не удалось загрузить типы событий
        </Text>
      )}

      {isReady && !error && (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Длительность</Table.Th>
              <Table.Th>Название</Table.Th>
              <Table.Th>Описание</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="xl">
                    Нет типов событий
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
      )}

      {/* Модалки */}
      <CreateEventTypeModal onSuccess={handleRefresh} />
      <EditEventTypeModal onSuccess={handleRefresh} />
      <DeleteEventTypeModal onSuccess={handleRefresh} />
    </Box>
  );
}, 'AdminEventTypesPage');
