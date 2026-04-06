import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtom } from '@reatom/jsx';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Stack,
  Card,
  Textarea,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { selectedEventTypeAtom } from '@entities/event-type';
import { selectedSlotAtom } from '@entities/slot';
import {
  createBooking,
  currentBookingAtom,
  bookingErrorAtom,
} from '@entities/booking';
import { bookingFormSchema, BookingFormData } from '@features/create-booking';
import { Layout, ErrorMessage, LoadingSpinner } from '@shared/ui';
import { formatDateTime } from '@shared/lib';

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const eventType = useAtom(selectedEventTypeAtom);
  const slot = useAtom(selectedSlotAtom);
  const booking = useAtom(currentBookingAtom);
  const error = useAtom(bookingErrorAtom);
  const isSubmitting = useAtom(createBooking.pendingAtom);

  const form = useForm<BookingFormData>({
    initialValues: {
      guestName: '',
      guestEmail: '',
      guestNotes: '',
    },
    validate: zodResolver(bookingFormSchema),
  });

  const handleSubmit = async (values: BookingFormData) => {
    if (!eventType || !slot) return;

    try {
      await createBooking(
        {},
        {
          eventTypeId: eventType.id,
          slotId: slot.id,
          ...values,
        }
      );
      setIsSuccess(true);
    } catch (err) {
      // Error is handled by the atom
    }
  };

  if (!eventType || !slot) {
    return (
      <Layout>
        <ErrorMessage message="Информация о бронировании не найдена. Пожалуйста, начните сначала." />
        <Button onClick={() => (window.location.href = '/')}>На главную</Button>
      </Layout>
    );
  }

  if (isSuccess && booking) {
    return (
      <Layout>
        <Card withBorder padding="xl">
          <Title order={2} c="green" mb="md">
            Бронирование подтверждено!
          </Title>
          
          <Stack gap="sm" mb="lg">
            <Text>
              <strong>Тип встречи:</strong> {eventType.name}
            </Text>
            <Text>
              <strong>Дата и время:</strong> {formatDateTime(slot.startTime)}
            </Text>
            <Text>
              <strong>Ваше имя:</strong> {booking.guestName}
            </Text>
            <Text>
              <strong>Email:</strong> {booking.guestEmail}
            </Text>
          </Stack>

          <Text c="dimmed" size="sm">
            ID бронирования: {booking.id}
          </Text>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Подтверждение бронирования">
      <Card withBorder mb="lg">
        <Text fw={500} mb="xs">
          {eventType.name}
        </Text>
        <Text c="dimmed">
          {formatDateTime(slot.startTime)}
        </Text>
      </Card>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Ваше имя"
            placeholder="Иван Иванов"
            required
            {...form.getInputProps('guestName')}
          />

          <TextInput
            label="Email"
            placeholder="ivan@example.com"
            required
            type="email"
            {...form.getInputProps('guestEmail')}
          />

          <Textarea
            label="Заметки (опционально)"
            placeholder="Дополнительная информация..."
            rows={3}
            {...form.getInputProps('guestNotes')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
            >
              Подтвердить бронирование
            </Button>
          </Group>
        </Stack>
      </form>
    </Layout>
  );
}
