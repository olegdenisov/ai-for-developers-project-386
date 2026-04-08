import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

// Service metadata will be added manually to generated OpenAPI
@service
@server("https://api.calendar-booking.example.com", "Production server")
@server("http://localhost:3000", "Development server")
namespace CalendarBooking;

// ============================================
// DOMAIN ENTITIES
// ============================================

/**
 * Owner - единый предопределённый профиль владельца календаря.
 * В системе нет регистрации и авторизации, владелец - один заранее заданный профиль.
 */
model Owner {
  @key
  @format("uuid")
  id: string;

  @minLength(1)
  @maxLength(100)
  name: string;

  @format("email")
  email: string;

  /** Признак предопределённого системного профиля */
  isPredefined: boolean;

  createdAt: utcDateTime;
}

/**
 * EventType - тип события, создаваемый владельцем календаря.
 * Каждый тип определяет характеристики встречи (название, описание, длительность).
 */
model EventType {
  @key
  @format("uuid")
  id: string;

  @minLength(1)
  @maxLength(100)
  name: string;

  @maxLength(500)
  description?: string;

  /** Длительность события в минутах */
  @minValue(1)
  @maxValue(480)
  durationMinutes: int32;

  /** Автоматически генерируемая метка времени создания */
  createdAt: utcDateTime;

  /** Автоматически генерируемая метка времени обновления */
  updatedAt: utcDateTime;
}

/**
 * Slot - временной слот в календаре для бронирования.
 * Слоты генерируются на основе доступности и привязаны ко времени.
 * Бизнес-правило: на одно и то же время нельзя создать две записи.
 */
model Slot {
  @key
  @format("uuid")
  id: string;

  /** Время начала слота */
  startTime: utcDateTime;

  /** Время окончания слота */
  endTime: utcDateTime;

  /** Статус доступности слота */
  isAvailable: boolean;

  /** Опциональная ссылка на тип события, если слот привязан к конкретному типу */
  eventTypeId?: string;

  /** Автоматически генерируемая метка времени создания */
  createdAt: utcDateTime;
}

/**
 * Booking - бронирование, создаваемое гостём на выбранный слот.
 * Содержит информацию о госте и выбранном типе события.
 */
model Booking {
  @key
  @format("uuid")
  id: string;

  /** Ссылка на тип события */
  eventTypeId: string;

  /** Ссылка на забронированный слот */
  slotId: string;

  /** Имя гостя */
  @minLength(1)
  @maxLength(100)
  guestName: string;

  /** Email гостя */
  @format("email")
  guestEmail: string;

  /** Дополнительные заметки от гостя */
  @maxLength(1000)
  guestNotes?: string;

  /** Статус бронирования */
  status: BookingStatus;

  /** Автоматически генерируемая метка времени создания */
  createdAt: utcDateTime;

  /** Автоматически генерируемая метка времени обновления */
  updatedAt: utcDateTime;

  /** Вложенный тип события (включается при получении деталей бронирования) */
  eventType?: EventType;

  /** Вложенный слот (включается при получении деталей бронирования) */
  slot?: Slot;
}

/**
 * Статусы бронирования
 */
enum BookingStatus {
  /** Бронирование подтверждено */
  confirmed,

  /** Бронирование отменено */
  cancelled,

  /** Бронирование завершено */
  completed,
}

// ============================================
// DTOs FOR OPERATIONS
// ============================================

/** DTO для создания типа события (владелец) */
model CreateEventTypeRequest {
  @minLength(1)
  @maxLength(100)
  name: string;

  @maxLength(500)
  description?: string;

  @minValue(1)
  @maxValue(480)
  durationMinutes: int32;
}

/** DTO для обновления типа события (владелец) */
model UpdateEventTypeRequest {
  @minLength(1)
  @maxLength(100)
  name?: string;

  @maxLength(500)
  description?: string;

  @minValue(1)
  @maxValue(480)
  durationMinutes?: int32;
}

/** DTO для создания бронирования (гость) */
model CreateBookingRequest {
  @format("uuid")
  eventTypeId: string;

  @format("uuid")
  slotId: string;

  @minLength(1)
  @maxLength(100)
  guestName: string;

  @format("email")
  guestEmail: string;

  @maxLength(1000)
  guestNotes?: string;
}

/** DTO для отмены бронирования (гость) */
model CancelBookingRequest {
  /** Причина отмены (опционально) */
  @maxLength(500)
  reason?: string;
}

// ============================================
// ERROR MODELS
// ============================================

@error
model ErrorResponse {
  /** Код ошибки */
  code: string;

  /** Сообщение об ошибке */
  message: string;

  /** Детали ошибки */
  details?: string[];
}

@error
model SlotConflictError {
  /** Код ошибки конфликта слота */
  @statusCode
  statusCode: 409;

  code: "SLOT_ALREADY_BOOKED";
  message: "Этот слот уже забронирован. На одно и то же время нельзя создать две записи.";
}

@error
model NotFoundError {
  @statusCode
  statusCode: 404;

  code: "NOT_FOUND";
  message: string;
}

@error
model ValidationError {
  @statusCode
  statusCode: 400;

  code: "VALIDATION_ERROR";
  message: "Некорректные данные запроса";
  errors: FieldError[];
}

model FieldError {
  field: string;
  message: string;
}

// ============================================
// OWNER API (ВЛАДЕЛЕЦ КАЛЕНДАРЯ)
// ============================================

@route("/owner")
@tag("Owner")
interface OwnerApi {
  /**
   * Получить информацию о владельце календаря.
   * В системе только один предопределённый владелец.
   */
  @get
  @route("/profile")
  getProfile(): Owner;

  /**
   * Получить список всех предстоящих встреч (бронирований).
   * Показывает бронирования всех типов событий в одном списке.
   */
  @get
  @route("/bookings")
  getUpcomingBookings(
    /** Фильтр по статусу */
    @query status?: BookingStatus,

    /** Фильтр по дате начала (включительно) */
    @query startDate?: plainDate,

    /** Фильтр по дате окончания (включительно) */
    @query endDate?: plainDate,

    /** Пагинация - номер страницы */
    @query @minValue(1) page?: int32 = 1,

    /** Пагинация - размер страницы */
    @query @minValue(1) @maxValue(100) pageSize?: int32 = 20,
  ): {
    @body bookings: Booking[];
    @header totalCount: int32;
  } | NotFoundError;
}

// ============================================
// EVENT TYPES API (УПРАВЛЕНИЕ ТИПАМИ СОБЫТИЙ)
// ============================================

@route("/event-types")
@tag("Event Types")
interface EventTypesApi {
  /**
   * Получить список всех типов событий.
   * Доступно как владельцу, так и гостям (для выбора при бронировании).
   */
  @get
  listEventTypes(): EventType[];

  /**
   * Получить тип события по ID.
   */
  @get
  @route("/{id}")
  getEventType(@path id: string): EventType | NotFoundError;

  /**
   * Создать новый тип события (только владелец).
   */
  @post
  createEventType(@body request: CreateEventTypeRequest): EventType | ValidationError;

  /**
   * Обновить тип события (только владелец).
   */
  @put
  @route("/{id}")
  updateEventType(
    @path id: string,
    @body request: UpdateEventTypeRequest,
  ): EventType | NotFoundError | ValidationError;

  /**
   * Удалить тип события (только владелец).
   * Нельзя удалить тип, если есть активные бронирования.
   */
  @delete
  @route("/{id}")
  deleteEventType(@path id: string): {
    @statusCode statusCode: 204;
  } | NotFoundError | ErrorResponse;
}

// ============================================
// SLOTS API (УПРАВЛЕНИЕ СЛОТАМИ)
// ============================================

@route("/slots")
@tag("Slots")
interface SlotsApi {
  /**
   * Получить доступные слоты для бронирования.
   * Гость использует этот endpoint для выбора свободного слота.
   */
  @get
  listAvailableSlots(
    /** Фильтр по типу события */
    @query eventTypeId?: string,

    /** Дата начала периода */
    @query startDate: plainDate,

    /** Дата окончания периода */
    @query endDate: plainDate,
  ): Slot[] | NotFoundError;

  /**
   * Получить информацию о конкретном слоте.
   */
  @get
  @route("/{id}")
  getSlot(@path id: string): Slot | NotFoundError;
}

// ============================================
// GUEST PUBLIC API (ПУБЛИЧНЫЙ СЦЕНАРИЙ ГОСТЯ)
// ============================================

@route("/public")
@tag("Guest Public API")
interface GuestPublicApi {
  /**
   * Получить список доступных типов бронирования.
   * Гость видит название, описание и длительность каждого типа.
   */
  @get
  @route("/event-types")
  listPublicEventTypes(): {
    @body eventTypes: EventType[];
  };

  /**
   * Получить подробную информацию о типе события.
   */
  @get
  @route("/event-types/{id}")
  getPublicEventType(@path id: string): EventType | NotFoundError;

  /**
   * Получить доступные слоты для выбранного типа события.
   * Гость выбирает тип события и видит свободные слоты в календаре.
   */
  @get
  @route("/event-types/{eventTypeId}/slots")
  getAvailableSlotsForEventType(
    @path eventTypeId: string,

    /** Дата начала периода */
    @query startDate: plainDate,

    /** Дата окончания периода */
    @query endDate: plainDate,
  ): Slot[] | NotFoundError;

  /**
   * Создать бронирование на выбранный слот.
   * Гость выбирает тип события и свободный слот, указывает свои данные.
   * Бизнес-правило: нельзя создать две записи на одно и то же время.
   */
  @post
  @route("/bookings")
  createBooking(@body request: CreateBookingRequest): Booking | SlotConflictError | ValidationError | NotFoundError;

  /**
   * Получить информацию о бронировании по ID.
   * Гость может проверить детали своего бронирования.
   */
  @get
  @route("/bookings/{id}")
  getBooking(@path id: string): Booking | NotFoundError;

  /**
   * Отменить бронирование.
   * Гость может отменить своё бронирование.
   */
  @post
  @route("/bookings/{id}/cancel")
  cancelBooking(
    @path id: string,
    @body request?: CancelBookingRequest,
  ): Booking | NotFoundError | ErrorResponse;
}

// ============================================
// API INFORMATION
// ============================================

/** API для системы бронирования звонков по календарю без авторизации */
alias CalendarBookingDescription = CalendarBooking;
