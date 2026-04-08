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
  Modal,
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
import type { createCancelForm } from './model/route';

/**
 * Props для компонента страницы деталей бронирования
 */
interface BookingDetailPageProps {
  booking?: Booking;
  cancelForm?: ReturnType<typeof createCancelForm>;
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

    // Получаем состояние формы отмены (если есть)
    const isCancelling = cancelForm ? cancelForm.submit.pending() : false;

    // Обработчики
    const goHome = () => {
      window.location.href = '/';
    };

    const handleCancel = () => {
      if (cancelForm) {
        cancelForm.fields.reason.set('');
      }
    };

    const handleConfirmCancel = (e: React.FormEvent) => {
      e.preventDefault();
      if (cancelForm) {
        cancelForm.submit();
      }
    };

    const handleCloseCancel = () => {
      if (cancelForm) {
        cancelForm.fields.reason.reset();
        // Сбрасываем ошибку отправки формы чтобы модальное окно закрывалось
        if (cancelForm.submit.errorAtom) {
          cancelForm.submit.errorAtom.set(null);
        }
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

            {/* Действия */}
            <Text ta="center">
              Хотите внести изменения?{' '}
              <Anchor component="button" type="button">
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
        {cancelForm && (
          <Modal
            opened={cancelForm.fields.reason() !== '' || !!cancelForm.submit.error()}
            onClose={handleCloseCancel}
            title="Отменить бронирование"
            centered
          >
            <form onSubmit={handleConfirmCancel}>
              <Stack gap="md">
                <Text>
                  Вы уверены, что хотите отменить бронирование? Это действие
                  нельзя отменить.
                </Text>
                {cancelForm.fields.reason && (
                  <div>
                    {/* Поле причины отмены - пока заглушка */}
                  </div>
                )}
                {cancelForm.submit.error() && (
                  <Text c="red" size="sm">
                    {cancelForm.submit.error()?.message}
                  </Text>
                )}
                <Group justify="flex-end">
                  <Button variant="subtle" onClick={handleCloseCancel}>
                    Закрыть
                  </Button>
                  <Button
                    color="red"
                    type="submit"
                    loading={isCancelling}
                  >
                    Отменить бронирование
                  </Button>
                </Group>
              </Stack>
            </form>
          </Modal>
        )}
      </Layout>
    );
  },
  'BookingDetailPage'
);
