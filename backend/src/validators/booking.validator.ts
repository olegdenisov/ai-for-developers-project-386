import { Type } from '@sinclair/typebox';

export const CreateBookingSchema = Type.Object({
  eventTypeId: Type.String({ format: 'uuid' }),
  slotId: Type.String({ format: 'uuid' }),
  guestName: Type.String({ minLength: 1, maxLength: 100 }),
  guestEmail: Type.String({ format: 'email' }),
  guestNotes: Type.Optional(Type.String({ maxLength: 1000 })),
  ownerId: Type.String({ format: 'uuid' }),
});

export const UpdateBookingSchema = Type.Partial(
  Type.Object({
    guestName: Type.String({ minLength: 1, maxLength: 100 }),
    guestEmail: Type.String({ format: 'email' }),
    guestNotes: Type.Union([Type.String({ maxLength: 1000 }), Type.Null()]),
    status: Type.Union([
      Type.Literal('confirmed'),
      Type.Literal('cancelled'),
      Type.Literal('completed'),
    ]),
  })
);

export const BookingParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const BookingQuerySchema = Type.Object({
  ownerId: Type.Optional(Type.String({ format: 'uuid' })),
  eventTypeId: Type.Optional(Type.String({ format: 'uuid' })),
  status: Type.Optional(
    Type.Union([
      Type.Literal('confirmed'),
      Type.Literal('cancelled'),
      Type.Literal('completed'),
    ])
  ),
  startDate: Type.Optional(Type.String({ format: 'date-time' })),
  endDate: Type.Optional(Type.String({ format: 'date-time' })),
});

export type CreateBookingBody = typeof CreateBookingSchema.static;
export type UpdateBookingBody = typeof UpdateBookingSchema.static;
export type BookingParams = typeof BookingParamsSchema.static;
export type BookingQuery = typeof BookingQuerySchema.static;