import { reatomComponent } from '@reatom/react';
import {
  Container,
  Title,
  Text,
  Button,
  Badge,
  Card,
  Stack,
  Box,
  SimpleGrid,
  List,
  Flex,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { navigate } from '@app/router';
import { Layout } from '@shared/ui';
import type { EventType } from '@entities/event-type';

// ============================================
// PROPS INTERFACE
// ============================================

interface HomePageProps {
  eventTypes: EventType[];
  isLoading: boolean;
  error?: string | null;
}

// ============================================
// COMPONENT
// ============================================

export const HomePage = reatomComponent(({ error }: HomePageProps) => {
  const handleBookClick = () => {
    // Переходим к выбору типа события
    navigate.booking();
  };

  if (error) {
    return (
      <Layout title="Ошибка">
        <Text c="red">{error}</Text>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Контейнер с градиентным фоном */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #dbeafe 40%, #fef3e2 60%, #fff7ed 100%)',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Container size="xl" py={80}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60}>
            {/* Левая часть - Hero секция */}
            <Stack gap="xl" align="flex-start">
              {/* Badge - белая пилюля с текстом */}
              <Badge
                size="lg"
                variant="filled"
                color="gray"
                radius="xl"
                tt="uppercase"
                px="lg"
                py="xs"
                styles={{
                  root: {
                    backgroundColor: '#ffffff',
                    color: '#6b7280',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    border: 'none',
                    height: 'auto',
                    lineHeight: 1.5,
                  },
                }}
              >
                Быстрая запись на звонок
              </Badge>

              <Title
                order={1}
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1.1,
                }}
              >
                Calendar
              </Title>

              <Text size="lg" c="#6b7280" maw={480} style={{ lineHeight: 1.6 }}>
                Забронируйте встречу за минуту: выберите тип события и удобное время.
              </Text>

              <Button
                size="lg"
                color="orange"
                radius="md"
                rightSection={<IconArrowRight size={20} />}
                onClick={handleBookClick}
                styles={{
                  root: {
                    backgroundColor: '#f97316',
                    borderColor: '#f97316',
                    padding: '0 28px',
                    height: 48,
                    fontWeight: 500,
                  },
                }}
              >
                Записаться
              </Button>
            </Stack>

            {/* Правая часть - Карточка с возможностями */}
            <Flex justify="flex-end" align="flex-start">
              <Card
                shadow="sm"
                padding="xl"
                radius="md"
                withBorder
                style={{
                  backgroundColor: '#ffffff',
                  maxWidth: 420,
                  width: '100%',
                  border: '1px solid #e5e7eb',
                }}
              >
                <Stack gap="lg">
                  <Title order={3} size="h4" c="#111827" fw={600}>
                    Возможности
                  </Title>

                  <List 
                    spacing="md" 
                    size="sm" 
                    c="#6b7280"
                    icon={<Text component="span" c="#f97316" fz="sm">●</Text>}
                  >
                    <List.Item style={{ lineHeight: 1.5 }}>
                      Выбор типа события и удобного времени для встречи.
                    </List.Item>
                    <List.Item style={{ lineHeight: 1.5 }}>
                      Быстрое бронирование с подтверждением и дополнительными заметками.
                    </List.Item>
                    <List.Item style={{ lineHeight: 1.5 }}>
                      Управление типами встреч и просмотр предстоящих записей в админке.
                    </List.Item>
                  </List>
                </Stack>
              </Card>
            </Flex>
          </SimpleGrid>
        </Container>
      </Box>
    </Layout>
  );
}, 'HomePage');
