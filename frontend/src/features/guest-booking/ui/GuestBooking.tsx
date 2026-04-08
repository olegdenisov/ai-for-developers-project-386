import { reatomComponent } from '@reatom/react';
import { Title, Text, Card, Button, Group, Stack, Loader } from '@mantine/core';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';
import { EventType } from '../../../entities/event-type/types';
import { CalendarSlotPicker } from '../../../shared/ui/CalendarSlotPicker';
import { Slot } from '../../../entities/slot/types';
import { bookingForm } from '../forms/booking-form';

export const GuestBooking = reatomComponent(() => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'eventTypes' | 'slots' | 'booking'>('eventTypes');

  // Загрузка типов событий
  useEffect(() => {
    const loadEventTypes = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<EventType[]>('/public/event-types');
        setEventTypes(data);
      } catch (error) {
        console.error('Ошибка загрузки типов событий:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEventTypes();
  }, []);

  // Загрузка слотов при выборе типа события
  useEffect(() => {
    if (!selectedEventType) return;
    const loadSlots = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<Slot[]>(`/public/event-types/${selectedEventType.id}/slots`, {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setSlots(data);
        setStep('slots');
      } catch (error) {
        console.error('Ошибка загрузки слотов:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [selectedEventType]);

  const handleSelectEventType = (eventType: EventType) => {
    setSelectedEventType(eventType);
  };

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep('booking');
  };

  const handleBack = () => {
    if (step === 'slots') {
      setSelectedEventType(null);
      setSlots([]);
      setStep('eventTypes');
    } else if (step === 'booking') {
      setSelectedSlot(null);
      setStep('slots');
    }
  };

  const handleBookingSubmit = async (values: { guestName: string; guestEmail: string }) => {
    if (!selectedSlot) return;
    try {
      await apiClient.post('/public/bookings', {
        slotId: selectedSlot.id,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
      });
      // Успех - можно показать уведомление и сбросить
      alert('Бронирование успешно создано!');
      setStep('eventTypes');
      setSelectedEventType(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Ошибка создания бронирования:', error);
      alert('Ошибка при создании бронирования');
    }
  };

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="lg" />
        <Text>Загрузка...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={2}>Бронирование звонка</Title>

      {step === 'eventTypes' && (
        <>
          <Text c="dimmed">Выберите тип встречи, чтобы увидеть доступные слоты</Text>
          <Stack gap="md">
            {eventTypes.length === 0 ? (
              <Text>Нет доступных типов событий</Text>
            ) : (
              eventTypes.map((eventType) => (
                <Card key={eventType.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" align="center">
                    <div>
                      <Title order={4}>{eventType.name}</Title>
                      <Text c="dimmed">Длительность: {eventType.durationMinutes} минут</Text>
                    </div>
                    <Button onClick={() => handleSelectEventType(eventType)}>
                      Выбрать
                    </Button>
                  </Group>
                </Card>
              ))
            )}
          </Stack>
        </>
      )}

      {step === 'slots' && selectedEventType && (
        <>
          <Group>
            <Button variant="outline" onClick={handleBack}>
              Назад к типам событий
            </Button>
            <Title order={3}>Выберите слот для "{selectedEventType.name}"</Title>
          </Group>
          <CalendarSlotPicker
            slots={slots}
            onSlotSelect={handleSelectSlot}
            selectedSlotId={selectedSlot?.id}
          />
        </>
      )}

      {step === 'booking' && selectedSlot && (
        <>
          <Group>
            <Button variant="outline" onClick={handleBack}>
              Назад к слотам
            </Button>
            <Title order={3}>Заполните данные для бронирования</Title>
          </Group>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Text>
                Выбран слот:{' '}
                <strong>
                  {new Date(selectedSlot.startTime).toLocaleString()} -{' '}
                  {new Date(selectedSlot.endTime).toLocaleString()}
                </strong>
              </Text>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const guestName = formData.get('guestName') as string;
                  const guestEmail = formData.get('guestEmail') as string;
                  handleBookingSubmit({ guestName, guestEmail });
                }}
              >
                <Stack gap="sm">
                  <div>
                    <label htmlFor="guestName">Ваше имя</label>
                    <input
                      id="guestName"
                      name="guestName"
                      type="text"
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="guestEmail">Email</label>
                    <input
                      id="guestEmail"
                      name="guestEmail"
                      type="email"
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc' }}
                    />
                  </div>
                  <Button type="submit">Забронировать</Button>
                </Stack>
              </form>
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}, 'GuestBooking');