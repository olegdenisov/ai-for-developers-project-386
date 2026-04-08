import { reatomComponent } from '@reatom/react';
import { Card, Title, Text, Button, Group, Stack } from '@mantine/core';
import { eventTypesRoute } from '../../../shared/routing';
import { EventType } from '../../../entities/event-type/types';

export const EventTypesList = reatomComponent(() => {
  const { data, isPending } = eventTypesRoute.status();

  if (isPending) {
    return <Text>Загрузка типов событий...</Text>;
  }

  const eventTypes = data as EventType[] | undefined;

  if (!eventTypes || eventTypes.length === 0) {
    return <Text>Нет доступных типов событий</Text>;
  }

  const handleSelect = (eventTypeId: string) => {
    eventTypesRoute.reatomRoute(':eventTypeId').go({ eventTypeId });
  };

  return (
    <Stack gap="md">
      <Title order={2}>Выберите тип встречи</Title>
      <Text c="dimmed">Выберите тип встречи, чтобы увидеть доступные слоты</Text>
      {eventTypes.map((eventType) => (
        <Card key={eventType.id} shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>{eventType.name}</Title>
              <Text c="dimmed">Длительность: {eventType.durationMinutes} минут</Text>
            </div>
            <Button onClick={() => handleSelect(eventType.id)}>
              Выбрать
            </Button>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}, 'EventTypesList');