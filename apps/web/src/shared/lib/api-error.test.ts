import { describe, it, expect } from 'vitest'
import { parseApiError } from './api-error'

describe('parseApiError', () => {
  it('должен возвращать fallback если err не является Error', () => {
    expect(parseApiError(null, 'Ошибка')).toEqual(new Error('Ошибка'))
    expect(parseApiError(undefined, 'Ошибка')).toEqual(new Error('Ошибка'))
    expect(parseApiError('строка', 'Ошибка')).toEqual(new Error('Ошибка'))
    expect(parseApiError(42, 'Ошибка')).toEqual(new Error('Ошибка'))
  })

  it('должен возвращать «Выбранный слот уже занят» при коде SLOT_ALREADY_BOOKED', () => {
    const err = new Error(JSON.stringify({ code: 'SLOT_ALREADY_BOOKED', message: 'slot taken' }))
    const result = parseApiError(err, 'Ошибка по умолчанию')
    expect(result.message).toBe('Выбранный слот уже занят')
  })

  it('должен возвращать message из JSON если код не специальный', () => {
    const err = new Error(JSON.stringify({ code: 'NOT_FOUND', message: 'Ресурс не найден' }))
    const result = parseApiError(err, 'Ошибка по умолчанию')
    expect(result.message).toBe('Ресурс не найден')
  })

  it('должен возвращать fallback если JSON не содержит message', () => {
    const err = new Error(JSON.stringify({ code: 'SOME_ERROR' }))
    const result = parseApiError(err, 'Ошибка по умолчанию')
    expect(result.message).toBe('Ошибка по умолчанию')
  })

  it('должен возвращать оригинальное сообщение если err.message не является JSON', () => {
    const err = new Error('Сетевая ошибка')
    const result = parseApiError(err, 'Ошибка по умолчанию')
    expect(result.message).toBe('Сетевая ошибка')
  })

  it('должен возвращать fallback если err.message пустая строка', () => {
    const err = new Error('')
    const result = parseApiError(err, 'Ошибка по умолчанию')
    expect(result.message).toBe('Ошибка по умолчанию')
  })
})
