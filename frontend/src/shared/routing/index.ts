import { reatomRoute, urlAtom, wrap } from '@reatom/core';
import { apiClient } from '../api/client.js';
import { EventType } from '../../entities/event-type/types.js';
import { Slot } from '../../entities/slot/types.js';
import { Booking } from '../../entities/booking/types.js';

// Layout route (always active, renders outlet)
export const layoutRoute = reatomRoute({
  layout: true,
  render({ outlet }) {
    return outlet();
  },
});

// Home page route
export const homeRoute = layoutRoute.reatomRoute('', {
  render() {
    return 'HomePage'; // будет заменено на компонент
  },
});

// Guest route (layout для гостя)
export const guestRoute = layoutRoute.reatomRoute('guest', {
  layout: true,
  render({ outlet }) {
    return outlet();
  },
});

// Public event types list
export const eventTypesRoute = guestRoute.reatomRoute('event-types', {
  async loader() {
    const data = await wrap(apiClient.get<EventType[]>('/public/event-types'));
    return data;
  },
  render(self) {
    const { data, isPending } = self.status();
    if (isPending) return <div>Загрузка типов событий...</div>;
    const eventTypes = data as EventType[] | undefined;
    if (!eventTypes || eventTypes.length === 0) {
      return <div>Нет доступных типов событий</div>;
    }
    const handleSelect = (eventTypeId: string) => {
      eventTypesRoute.reatomRoute(':eventTypeId').go({ eventTypeId });
    };
    return (
      <div>
        <h2>Выберите тип встречи</h2>
        <p>Выберите тип встречи, чтобы увидеть доступные слоты</p>
        {eventTypes.map((eventType) => (
          <div key={eventType.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <h3>{eventType.name}</h3>
            <p>Длительность: {eventType.durationMinutes} минут</p>
            <button onClick={() => handleSelect(eventType.id)}>Выбрать</button>
          </div>
        ))}
      </div>
    );
  },
});

// Single event type with slots
export const eventTypeRoute = eventTypesRoute.reatomRoute(':eventTypeId', {
  async loader({ eventTypeId }) {
    const [eventType, slots] = await Promise.all([
      wrap(apiClient.get<EventType>(`/public/event-types/${eventTypeId}`)),
      wrap(apiClient.get<Slot[]>(`/public/event-types/${eventTypeId}/slots`, {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })),
    ]);
    return { eventType, slots };
  },
  render(self) {
    const { data, isPending } = self.status();
    if (isPending) return 'Loading event type...';
    return `EventType: ${data?.eventType.name}`;
  },
});

// Booking creation route
export const bookingRoute = guestRoute.reatomRoute('booking', {
  async loader({ slotId }: { slotId?: string }) {
    if (!slotId) throw new Error('Slot ID required');
    const slot = await wrap(apiClient.get<Slot>(`/slots/${slotId}`));
    return { slot };
  },
  render(self) {
    const { data } = self.status();
    return `Booking form for slot ${data?.slot.id}`;
  },
});

// Owner route (layout для владельца)
export const ownerRoute = layoutRoute.reatomRoute('owner', {
  layout: true,
  render({ outlet }) {
    return outlet();
  },
});

// Owner event types management
export const ownerEventTypesRoute = ownerRoute.reatomRoute('event-types', {
  async loader() {
    const data = await wrap(apiClient.get<EventType[]>('/event-types'));
    return data;
  },
  render(self) {
    const { data } = self.status();
    return `Manage event types (${data?.length})`;
  },
});

// Owner bookings list
export const ownerBookingsRoute = ownerRoute.reatomRoute('bookings', {
  async loader() {
    const data = await wrap(apiClient.get<Booking[]>('/owner/bookings'));
    return data;
  },
  render(self) {
    const { data } = self.status();
    return `Owner bookings (${data?.length})`;
  },
});

// Export urlAtom for navigation
export { urlAtom };