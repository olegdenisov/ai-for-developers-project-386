import { useAtom } from '@reatom/jsx';
import { Container, Title, Text, SimpleGrid, Card, Badge, Stack, Button } from '@mantine/core';
import { IconClock } from '@mantine/icons';
import { eventTypesAtom, fetchEventTypes, selectedEventTypeAtom } from '@entities/event-type';
import { Layout } from '@shared/ui';
import { formatDuration } from '@shared/lib';

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
}

export function HomePage() {
  const eventTypes = useAtom(eventTypesAtom);
  const isLoading = useAtom(fetchEventTypes.pendingAtom);

  const handleSelectEventType = (id: string) => {
    // Navigation will be implemented with router
    window.location.href = `/event-types/${id}`;
  };

  return (
    <Layout title="Забронируйте встречу">
      <Text c="dimmed" mb="xl">
        Выберите тип встречи, чтобы посмотреть доступное время
      </Text>

      {isLoading ? (
        <Text>Загрузка...</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {eventTypes.map((eventType) => (
            <Card
              key={eventType.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectEventType(eventType.id)}
            >
              <Stack gap="sm">
                <Title order={3} size="h4">
                  {eventType.name}
                </Title>
                
                {eventType.description && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {eventType.description}
                  </Text>
                )}

                <Badge leftSection={<IconClock size={12} />} variant="light">
                  {formatDuration(eventType.durationMinutes)}
                </Badge>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Layout>
  );
}
