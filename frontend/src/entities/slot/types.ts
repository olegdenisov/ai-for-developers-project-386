export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  eventTypeId: string;
  isAvailable: boolean;
  createdAt?: string;
}