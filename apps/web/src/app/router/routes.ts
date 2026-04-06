// Route definitions for the application
// Using plain object for route paths (will be used with Reatom router)

export const ROUTES = {
  home: '/',
  eventType: '/event-types/:id',
  booking: '/bookings/:id',
  bookingSuccess: '/bookings/:id/success',
  owner: '/owner',
  ownerEventTypes: '/owner/event-types',
} as const;

// Route helper functions
export const routeHelpers = {
  home: () => '/',
  eventType: (id: string) => `/event-types/${id}`,
  booking: (id: string) => `/bookings/${id}`,
  bookingSuccess: (id: string) => `/bookings/${id}/success`,
  owner: () => '/owner',
  ownerEventTypes: () => '/owner/event-types',
};
