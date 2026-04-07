import { reatomComponent } from '@reatom/react';
import { wrap } from '@reatom/core';
import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  Box,
  Avatar,
  Container,
  Badge,
  SimpleGrid,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { navigate } from '@app/router';
import { Layout, LoadingSpinner, ErrorMessage } from '@shared/ui';
import type { EventType } from '@entities/event-type';

// ============================================
// PROPS INTERFACE
// ============================================

interface BookCatalogPageProps {
  eventTypes: EventType[];
  isLoading: boolean;
  error?: string | null;
}

// ============================================
// COMPONENT
// ============================================

export const BookCatalogPage = reatomComponent(({ eventTypes, isLoading, error }: BookCatalogPageProps) => {
  const handleEventTypeClick = wrap((eventTypeId: string) => {
    navigate.eventType(eventTypeId);
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container size="md" py="xl">
          <ErrorMessage message={error} />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box bg="#f8fafc" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <Container size="md" py={40}>
          {/* Карточка профиля хоста и заголовок */}
          <Card
            withBorder
            mb="xl"
            padding="xl"
            radius="lg"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Профиль хоста */}
            <Group gap="sm" mb="lg">
              <Avatar
                size="md"
                radius="xl"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Tota"
                style={{
                  backgroundColor: '#f3f4f6',
                }}
              >
                <IconUser size={20} color="#6b7280" />
              </Avatar>
              <Stack gap={0}>
                <Text fw={600} size="sm" c="#111827">Tota</Text>
                <Text size="xs" c="dimmed">Host</Text>
              </Stack>
            </Group>

            {/* Заголовок и подзаголовок */}
            <Title
              order={1}
              mb="xs"
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              Выберите тип события
            </Title>
            <Text size="sm" c="#6b7280">
              Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.
            </Text>
          </Card>

          {/* Сетка карточек типов событий */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {eventTypes.map((eventType) => (
              <Card
                key={eventType.id}
                withBorder
                padding="lg"
                radius="md"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onClick={() => handleEventTypeClick(eventType.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Text fw={600} size="md" c="#111827" style={{ lineHeight: 1.4 }}>
                    {eventType.name}
                  </Text>
                  <Badge
                    variant="light"
                    color="gray"
                    size="sm"
                    styles={{
                      root: {
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        fontWeight: 500,
                        textTransform: 'none',
                      },
                    }}
                  >
                    {eventType.durationMinutes} мин
                  </Badge>
                </Group>
                {eventType.description && (
                  <Text size="sm" c="#6b7280" style={{ lineHeight: 1.5 }}>
                    {eventType.description}
                  </Text>
                )}
              </Card>
            ))}
          </SimpleGrid>

          {eventTypes.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              Нет доступных типов событий
            </Text>
          )}
        </Container>
      </Box>
    </Layout>
  );
}, 'BookCatalogPage');
