import { reatomComponent } from '@reatom/react';
import {
  Title,
  Text,
  Button,
  Stack,
  Group,
  Card,
  Badge,
  Anchor,
  Divider,
  Container,
  ThemeIcon,
  ActionIcon,
} from '@mantine/core';
import {
  IconCheck,
  IconExternalLink,
  IconCalendar,
  IconBrandGoogle,
  IconBrandApple,
  IconMail,
} from '@tabler/icons-react';
import { Layout, LoadingSpinner, ErrorMessage } from '@shared/ui';
import { formatDate, formatTime } from '@shared/lib';
import type { Booking } from '@entities/booking';
import { CancelBookingModal } from '@features/cancel-booking';
import type { createCancelForm } from '@features/cancel-booking';
import { RescheduleModal } from '@features/reschedule-booking';
import type { createRescheduleForm } from '@features/reschedule-booking';

/**
 * Props для компонента страницы деталей бронирования
 */
interface BookingDetailPageProps {
  booking?: Booking;
  cancelForm?: ReturnType<typeof createCancelForm>;
  rescheduleForm?: ReturnType<typeof createRescheduleForm>;
  isLoading: boolean;
  error?: string | null;
}

/**
 * Страница деталей бронирования
 * Отображает подтверждение успешного бронирования и детали встречи
 */
export const BookingDetailPage = reatomComponent(
  ({
    booking,
    cancelForm,
    rescheduleForm,
    isLoading,
    error,
  }: BookingDetailPageProps) => {
    // Отображение состояния загрузки
    if (isLoading) {
      return (
        <Layout>
          <LoadingSpinner />
        </Layout>
      );
    }

    // Отображение ошибки
    if (error || !booking) {
      return (
        <Layout>
          <ErrorMessage message={error || 'Бронирование не найдено'} />
          <Button onClick={() => window.history.back()} mt="md">
            Назад
          </Button>
        </Layout>
      );
    }

    // Проверка наличия вложенных данных
    if (!booking.eventType || !booking.slot) {
      return (
        <Layout>
          <ErrorMessage message="Детали бронирования недоступны. Не удалось загрузить информацию о типе события или слоте." />
          <Button onClick={() => window.history.back()} mt="md">
            Назад
          </Button>
        </Layout>
      );
    }

    // Обработчики
    const goHome = () => {
      window.location.href = '/';
    };

    const handleCancel = () => {
      if (cancelForm) {
        // Открываем модальное окно, устанавливая reason в специальное значение
        cancelForm.fields.reason.set('cancel_requested');
      }
    };

    const handleReschedule = () => {
      if (rescheduleForm) {
        rescheduleForm.isOpen.set(true);
      }
    };

    return (
      <Layout>
        <Container size="sm" py="xl">
          {/* Заголовок успеха */}
          <Stack align="center" mb="xl">
            <ThemeIcon size={60} radius="xl" color="green" variant="light">
              <IconCheck size={30} />
            </ThemeIcon>
            <Title order={2} ta="center">
              Встреча запланирована
            </Title>
            <Text ta="center" c="dimmed">
              Мы отправили всем участникам email с приглашением в календарь и
              деталями встречи.
            </Text>
          </Stack>

          <Card withBorder shadow="sm" p="xl">
            {/* Детали встречи */}
            <Stack gap="lg">
              {/* Что */}
              <Group align="flex-start" wrap="nowrap">
                <Text w={150} c="dimmed">
                  Что
                </Text>
                <Text>
                  Встреча на {booking.eventType.durationMinutes} минут между{' '}
                  {booking.guestName} и {booking.eventType.name}
                </Text>
              </Group>

              {/* Когда */}
              <Group align="flex-start" wrap="nowrap">
                <Text w={150} c="dimmed">
                  Когда
                </Text>
                <Stack gap={0}>
                  <Text>
                    {formatDate(booking.slot.startTime, 'dddd, D MMMM YYYY')}
                  </Text>
                  <Text>
                    {formatTime(booking.slot.startTime)} -{' '}
                    {formatTime(booking.slot.endTime)} (Москва, стандартное
                    время)
                  </Text>
                </Stack>
              </Group>

              {/* Кто */}
              <Group align="flex-start" wrap="nowrap">
                <Text w={150} c="dimmed">
                  Кто
                </Text>
                <Stack gap="xs">
                  {/* Хост */}
                  <Group gap="xs">
                    <Text>Host</Text>
                    <Badge size="sm">Host</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    host@example.com
                  </Text>

                  {/* Гость */}
                  <Text>{booking.guestName}</Text>
                  <Text size="sm" c="dimmed">
                    {booking.guestEmail}
                  </Text>
                </Stack>
              </Group>

              {/* Где */}
              <Group align="flex-start" wrap="nowrap">
                <Text w={150} c="dimmed">
                  Где
                </Text>
                <Group gap="xs">
                  <Text>Cal Video</Text>
                  <ActionIcon size="sm" variant="subtle">
                    <IconExternalLink size={16} />
                  </ActionIcon>
                </Group>
              </Group>

              {/* Дополнительная информация */}
              {booking.guestNotes && (
                <Group align="flex-start" wrap="nowrap">
                  <Text w={150} c="dimmed">
                    Дополнительная информация
                  </Text>
                  <Text>{booking.guestNotes}</Text>
                </Group>
              )}
            </Stack>

            <Divider my="xl" />

            {/* Действия — только для активных бронирований */}
            {booking.status === 'confirmed' && (
              <Text ta="center">
                Хотите внести изменения?{' '}
                <Anchor component="button" type="button" onClick={handleReschedule}>
                  Перенести
                </Anchor>{' '}
                или{' '}
                <Anchor
                  component="button"
                  type="button"
                  c="red"
                  onClick={handleCancel}
                >
                  Отмена
                </Anchor>
              </Text>
            )}

            <Divider my="xl" />

            {/* Добавить в календарь */}
            <Group justify="center" gap="sm">
              <Text size="sm">Добавить в календарь</Text>
              <Button variant="default" size="compact-sm">
                <IconBrandGoogle size={16} />
              </Button>
              <Button variant="default" size="compact-sm">
                <IconCalendar size={16} />
              </Button>
              <Button variant="default" size="compact-sm">
                <IconMail size={16} />
              </Button>
              <Button variant="default" size="compact-sm">
                <IconBrandApple size={16} />
              </Button>
            </Group>
          </Card>

          {/* Кнопка на главную */}
          <Button onClick={goHome} fullWidth mt="xl">
            На главную
          </Button>
        </Container>

        {/* Модальное окно отмены бронирования */}
        {cancelForm && <CancelBookingModal cancelForm={cancelForm} />}

        {/* Модальное окно переноса бронирования */}
        {rescheduleForm && <RescheduleModal rescheduleForm={rescheduleForm} />}
      </Layout>
    );
  },
  'BookingDetailPage'
);
