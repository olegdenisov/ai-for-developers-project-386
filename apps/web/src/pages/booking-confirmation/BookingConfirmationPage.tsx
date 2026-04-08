import { reatomComponent, bindField } from '@reatom/react';
import {
  Title,
  Text,
  Button,
  Stack,
  Group,
  Box,
  Avatar,
  Grid,
  TextInput,
  Textarea,
  Divider,
  Card,
} from '@mantine/core';
import {
  IconCalendar,
  IconClock,
  IconVideo,
  IconUserPlus,
} from '@tabler/icons-react';
import { Layout, LoadingSpinner, ErrorMessage } from '@shared/ui';
import { formatDate, formatTime } from '@shared/lib';
import type { EventType } from '@entities/event-type';
import type { Owner } from '@entities/owner';
import type { Slot } from '@entities/slot';
import type { createBookingForm } from './model/route';

/**
 * Props для компонента страницы подтверждения бронирования
 */
interface BookingConfirmationPageProps {
  eventType?: EventType;
  slot?: Slot;
  owner?: Owner;
  form?: ReturnType<typeof createBookingForm>;
  isLoading: boolean;
  error?: string | null;
}

/**
 * Форматирование длительности в человекочитаемый вид
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} минут`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'час' : 'часа'}`;
  }
  return `${hours} ч ${remainingMinutes} мин`;
}

/**
 * Страница подтверждения бронирования
 * Отображает форму для ввода данных гостя и сводку о встрече
 */
export const BookingConfirmationPage = reatomComponent(
  ({
    eventType,
    slot,
    owner,
    form,
    isLoading,
    error,
  }: BookingConfirmationPageProps) => {
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
          <Button onClick={() => window.history.back()} mt="md">
            Назад
          </Button>
        </Layout>
      );
    }

    // Проверка наличия необходимых данных
    if (!form || !eventType || !slot) {
      return (
        <Layout>
          <ErrorMessage message="Данные бронирования не найдены" />
          <Button onClick={() => window.history.back()} mt="md">
            Назад
          </Button>
        </Layout>
      );
    }

    // Получаем состояние формы
    const { fields, submit } = form;
    const isSubmitting = submit.pending();
    const isReady = submit.ready();

    // Обработчик отправки формы
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Отправляем форму и ловим ошибки валидации
      submit().catch(() => {
        // Ошибки валидации или сабмита обрабатываются через submit.error() и поля формы
        // Не нужно ничего делать здесь, т.к. ошибки отображаются в UI
      });
    };

    // Навигация назад
    const goBack = () => window.history.back();

    return (
      <Layout>
        <Box style={{ maxWidth: 900, margin: '0 auto' }}>
          <Card withBorder shadow="sm" p="xl">
            <Grid gap="xl">
              {/* Левая колонка — сводка о встрече */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="lg">
                  {/* Информация о владельце */}
                  <Group gap="sm">
                    <Avatar size="md" radius="xl" color="blue">
                      {owner?.name?.charAt(0).toUpperCase() || 'H'}
                    </Avatar>
                    <Box>
                      <Text fw={600}>{owner?.name || 'Host'}</Text>
                      <Text size="xs" c="dimmed">Host</Text>
                    </Box>
                  </Group>

                  <Divider />

                  {/* Название события */}
                  <Title order={3}>{eventType.name}</Title>

                  {/* Дата */}
                  <Group gap="xs">
                    <IconCalendar size={20} />
                    <Text>
                      {formatDate(slot.startTime, 'dddd, D MMMM YYYY')}
                    </Text>
                  </Group>

                  {/* Время */}
                  <Text pl={28}>
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </Text>

                  {/* Длительность */}
                  <Group gap="xs">
                    <IconClock size={20} />
                    <Text>{formatDuration(eventType.durationMinutes)}</Text>
                  </Group>

                  {/* Тип встречи */}
                  <Group gap="xs">
                    <IconVideo size={20} />
                    <Text>Cal Video</Text>
                  </Group>
                </Stack>
              </Grid.Col>

              {/* Правая колонка — форма */}
              <Grid.Col span={{ base: 12, md: 7 }}>
                <form onSubmit={handleSubmit}>
                  <Stack gap="md">
                    {/* Имя гостя */}
                    <TextInput
                      {...bindField(fields.guestName)}
                      label="Ваше имя *"
                      placeholder="Введите ваше имя"
                      error={fields.guestName.validation().error}
                    />

                    {/* Email гостя */}
                    <TextInput
                      {...bindField(fields.guestEmail)}
                      label="Адрес электронной почты *"
                      placeholder="email@example.com"
                      type="email"
                      error={fields.guestEmail.validation().error}
                    />

                    {/* Дополнительная информация */}
                    <Textarea
                      {...bindField(fields.guestNotes)}
                      label="Дополнительная информация"
                      placeholder="Дополнительная информация, которая может помочь подготовиться к нашей встрече."
                      minRows={3}
                      error={fields.guestNotes.validation().error}
                    />

                    {/* Добавить гостей */}
                    <Button
                      variant="subtle"
                      leftSection={<IconUserPlus size={16} />}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      Добавить гостей
                    </Button>

                    {/* Кнопки */}
                    <Group justify="flex-end">
                      <Button variant="subtle" onClick={goBack}>
                        Назад
                      </Button>
                      <Button type="submit" loading={isSubmitting} disabled={!isReady}>
                        Подтвердить
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Grid.Col>
            </Grid>
          </Card>
        </Box>
      </Layout>
    );
  },
  'BookingConfirmationPage'
);
