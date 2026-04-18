/**
 * Парсит ошибку из API клиента и возвращает читаемое сообщение.
 * API клиент бросает Error с JSON-строкой вида { code, message }.
 *
 * @param err - перехваченная ошибка (любого типа)
 * @param fallback - сообщение по умолчанию, если распарсить не удалось
 */
export function parseApiError(err: unknown, fallback: string): Error {
  if (!(err instanceof Error)) {
    return new Error(fallback)
  }
  try {
    const parsed = JSON.parse(err.message) as { code?: string; message?: string }
    if (parsed.code === 'SLOT_ALREADY_BOOKED') {
      return new Error('Выбранный слот уже занят')
    }
    return new Error(parsed.message || fallback)
  } catch {
    // Если не JSON — возвращаем оригинальное сообщение или fallback
    return new Error(err.message || fallback)
  }
}
