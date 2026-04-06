export interface Booking {
  id: string;
  eventTypeId: string;
  guestEmail: string;
  guestName: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}