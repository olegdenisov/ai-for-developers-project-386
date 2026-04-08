import { Type } from '@sinclair/typebox';

export const CreateEventTypeSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.Optional(Type.String({ maxLength: 500 })),
  durationMinutes: Type.Integer({ minimum: 1, maximum: 480 }),
  ownerId: Type.String({ format: 'uuid' }),
});

export const UpdateEventTypeSchema = Type.Partial(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 100 }),
    description: Type.Union([Type.String({ maxLength: 500 }), Type.Null()]),
    durationMinutes: Type.Integer({ minimum: 1, maximum: 480 }),
  })
);

export const EventTypeParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export type CreateEventTypeBody = typeof CreateEventTypeSchema.static;
export type UpdateEventTypeBody = typeof UpdateEventTypeSchema.static;
export type EventTypeParams = typeof EventTypeParamsSchema.static;