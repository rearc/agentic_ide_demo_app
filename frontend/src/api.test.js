import { describe, expect, it } from 'vitest'

import {
  createTodo,
  deleteTodo,
  fetchCardData,
  fetchCards,
  fetchTodos,
  updateCard,
  updateTodo,
} from './api'
import { brokenJsonResponse, jsonResponse, stubFetch } from './test/helpers'

describe('fetchCards', () => {
  it('requests the cards collection', async () => {
    const fetchMock = stubFetch(jsonResponse([{ id: 1 }]))

    await fetchCards()

    expect(fetchMock).toHaveBeenCalledWith('/api/cards')
  })

  it('returns the parsed cards', async () => {
    stubFetch(jsonResponse([{ id: 1, slug: 'weather' }]))

    await expect(fetchCards()).resolves.toEqual([{ id: 1, slug: 'weather' }])
  })

  it('throws when the request fails', async () => {
    stubFetch(jsonResponse({}, { status: 500 }))

    await expect(fetchCards()).rejects.toThrow('Failed to fetch cards')
  })
})

describe('updateCard', () => {
  it('sends a PUT with a JSON body', async () => {
    const fetchMock = stubFetch(jsonResponse({ id: 1 }))
    const layout = { x: 1, y: 2, w: 3, h: 4 }

    await updateCard(1, { layout })

    expect(fetchMock).toHaveBeenCalledWith('/api/cards/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout }),
    })
  })

  it('returns the updated card', async () => {
    stubFetch(jsonResponse({ id: 1, title: 'Renamed' }))

    await expect(updateCard(1, { title: 'Renamed' })).resolves.toEqual({
      id: 1,
      title: 'Renamed',
    })
  })

  it('throws when the request fails', async () => {
    stubFetch(jsonResponse({}, { status: 404 }))

    await expect(updateCard(1, {})).rejects.toThrow('Failed to update card')
  })
})

describe('fetchCardData', () => {
  it('omits the query string when there is no config', async () => {
    const fetchMock = stubFetch(jsonResponse({}))

    await fetchCardData('quote')

    expect(fetchMock).toHaveBeenCalledWith('/api/data/quote')
  })

  it('omits the query string for an empty config', async () => {
    const fetchMock = stubFetch(jsonResponse({}))

    await fetchCardData('quote', {})

    expect(fetchMock).toHaveBeenCalledWith('/api/data/quote')
  })

  it('serializes config into the query string', async () => {
    const fetchMock = stubFetch(jsonResponse({}))

    await fetchCardData('weather', { city: 'Boston' })

    expect(fetchMock).toHaveBeenCalledWith('/api/data/weather?city=Boston')
  })

  it('url-encodes config values', async () => {
    const fetchMock = stubFetch(jsonResponse({}))

    await fetchCardData('weather', { city: 'San Francisco' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/data/weather?city=San+Francisco',
    )
  })

  it('names the source in the error', async () => {
    stubFetch(jsonResponse({}, { status: 404 }))

    await expect(fetchCardData('nope')).rejects.toThrow(
      'Failed to fetch data for nope',
    )
  })
})

describe('fetchTodos', () => {
  it('scopes the request to the card', async () => {
    const fetchMock = stubFetch(jsonResponse([]))

    await fetchTodos(7)

    expect(fetchMock).toHaveBeenCalledWith('/api/todos?card_id=7')
  })

  it('returns the parsed todos', async () => {
    stubFetch(jsonResponse([{ id: 1, text: 'A task' }]))

    await expect(fetchTodos(7)).resolves.toEqual([{ id: 1, text: 'A task' }])
  })

  it('surfaces the API error message', async () => {
    stubFetch(jsonResponse({ error: 'Card not found' }, { status: 404 }))

    await expect(fetchTodos(999)).rejects.toThrow('Card not found')
  })

  it('falls back to statusText when the error body is not JSON', async () => {
    stubFetch(
      brokenJsonResponse({ status: 500, statusText: 'Internal Server Error' }),
    )

    await expect(fetchTodos(1)).rejects.toThrow('Internal Server Error')
  })

  it('falls back to statusText when the error body has no error field', async () => {
    stubFetch(
      jsonResponse(
        { unexpected: true },
        { status: 500, statusText: 'Server Error' },
      ),
    )

    await expect(fetchTodos(1)).rejects.toThrow('Server Error')
  })
})

describe('createTodo', () => {
  it('posts the card id and text', async () => {
    const fetchMock = stubFetch(jsonResponse({ id: 1 }))

    await createTodo(7, 'Write tests')

    expect(fetchMock).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: 7, text: 'Write tests' }),
    })
  })

  it('returns the created todo', async () => {
    stubFetch(jsonResponse({ id: 1, text: 'Write tests', done: false }))

    await expect(createTodo(7, 'Write tests')).resolves.toEqual({
      id: 1,
      text: 'Write tests',
      done: false,
    })
  })

  it('surfaces the API error message', async () => {
    stubFetch(jsonResponse({ error: 'text is required' }, { status: 400 }))

    await expect(createTodo(7, '')).rejects.toThrow('text is required')
  })
})

describe('updateTodo', () => {
  it('patches only the supplied fields', async () => {
    const fetchMock = stubFetch(jsonResponse({ id: 1 }))

    await updateTodo(1, { done: true })

    expect(fetchMock).toHaveBeenCalledWith('/api/todos/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })
  })

  it('returns the updated todo', async () => {
    stubFetch(jsonResponse({ id: 1, done: true }))

    await expect(updateTodo(1, { done: true })).resolves.toEqual({
      id: 1,
      done: true,
    })
  })

  it('surfaces the API error message', async () => {
    stubFetch(
      jsonResponse({ error: 'done must be a boolean' }, { status: 400 }),
    )

    await expect(updateTodo(1, { done: 'yes' })).rejects.toThrow(
      'done must be a boolean',
    )
  })
})

describe('deleteTodo', () => {
  it('sends a DELETE', async () => {
    const fetchMock = stubFetch(jsonResponse(null, { status: 204 }))

    await deleteTodo(1)

    expect(fetchMock).toHaveBeenCalledWith('/api/todos/1', { method: 'DELETE' })
  })

  it('resolves with nothing on success', async () => {
    stubFetch(jsonResponse(null, { status: 204 }))

    await expect(deleteTodo(1)).resolves.toBeUndefined()
  })

  it('surfaces the API error message', async () => {
    stubFetch(jsonResponse({ error: 'Todo not found' }, { status: 404 }))

    await expect(deleteTodo(999)).rejects.toThrow('Todo not found')
  })
})

describe('server error messages', () => {
  /* The API explains failures in an `error` field. Discarding it leaves the
     dashboard showing a fixed string no matter what actually went wrong. */

  it('surfaces the API error from fetchCards', async () => {
    stubFetch(
      jsonResponse({ error: 'Database is unavailable' }, { status: 500 }),
    )

    await expect(fetchCards()).rejects.toThrow('Database is unavailable')
  })

  it('falls back to a generic message when the body has no error field', async () => {
    stubFetch(jsonResponse({}, { status: 500 }))

    await expect(fetchCards()).rejects.toThrow('Failed to fetch cards')
  })

  it('surfaces the API error from updateCard', async () => {
    stubFetch(jsonResponse({ error: 'Card not found' }, { status: 404 }))

    await expect(updateCard(1, {})).rejects.toThrow('Card not found')
  })

  it('surfaces the API error from fetchCardData', async () => {
    stubFetch(jsonResponse({ error: 'Unknown source: nope' }, { status: 404 }))

    await expect(fetchCardData('nope')).rejects.toThrow('Unknown source: nope')
  })

  it('still names the source when the body has no error field', async () => {
    stubFetch(jsonResponse({}, { status: 404 }))

    await expect(fetchCardData('nope')).rejects.toThrow(
      'Failed to fetch data for nope',
    )
  })
})
