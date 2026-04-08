import { Type } from '@sinclair/typebox';

export const CreateSlotSchema = Type.Object({
  startTime: Type.String({ format: 'date-time' }),
  endTime: Type.String({ format: 'date-time' }),
  isAvailable: Type.Optional(Type.Boolean()),
  eventTypeId: Type.Optional(Type.String({ format: 'uuid' })),
  ownerId: Type.String({ format: 'uuid' }),
});

export const UpdateSlotSchema = Type.Partial(
  Type.Object({
    isAvailable: Type.Boolean(),
    eventTypeId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  })
);

export const SlotParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const SlotQuerySchema = Type.Object({
  startDate: Type.String({ format: 'date-time' }),
  endDate: Type.String({ format: 'date-time' }),
  eventTypeId: Type.Optional(Type.String({ format: 'uuid' })),
  ownerId: Type.Optional(Type.String({ format: 'uuid' })),
  isAvailable: Type.Optional(Type.Boolean()),
});

export type CreateSlotBody = typeof CreateSlotSchema.static;
export type UpdateSlotBody = typeof UpdateSlotSchema.static;
export type SlotParams = typeof SlotParamsSchema.static;
export type SlotQuery = typeof SlotQuerySchema.static;