import { reatomRouter } from '@reatom/url';

// Route definitions
export const router = reatomRouter({
  routes: {
    home: '/',
    eventType: '/event-types/:id',
    booking: '/bookings/new',
    bookingSuccess: '/bookings/:id/success',
    owner: '/owner',
    ownerEventTypes: '/owner/event-types',
  },
});

// Route helpers
export const routeHelpers = {
  home: () => '/',
  eventType: (id: string) => `/event-types/${id}`,
  booking: () => '/bookings/new',
  bookingSuccess: (id: string) => `/bookings/${id}/success`,
  owner: () => '/owner',
  ownerEventTypes: () => '/owner/event-types',
};

// Navigation helpers
export const navigate = {
  home: () => router.navigate('home'),
  eventType: (id: string) => router.navigate('eventType', { id }),
  booking: () => router.navigate('booking'),
  bookingSuccess: (id: string) => router.navigate('bookingSuccess', { id }),
  back: () => window.history.back(),
};
