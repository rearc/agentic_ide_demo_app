const API_BASE = '/api'

/**
 * The API's own `{"error": "..."}` message when it sent one.
 *
 * Falls back to `fallback`, then to the status text. Without this, a caller
 * throws a fixed string and the specific reason the server gave is discarded
 * before anyone can show it.
 */
async function readErrorMessage(res, fallback) {
  try {
    const body = await res.json()
    return body.error || fallback || res.statusText
  } catch {
    return fallback || res.statusText
  }
}

export async function fetchCards() {
  const res = await fetch(`${API_BASE}/cards`)
  if (!res.ok)
    throw new Error(await readErrorMessage(res, 'Failed to fetch cards'))
  return res.json()
}

export async function updateCard(id, fields) {
  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok)
    throw new Error(await readErrorMessage(res, 'Failed to update card'))
  return res.json()
}

export async function fetchCardData(source, config = {}) {
  const params = new URLSearchParams(config)
  const query = params.toString()
  const url = `${API_BASE}/data/${source}${query ? `?${query}` : ''}`
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(
      await readErrorMessage(res, `Failed to fetch data for ${source}`),
    )
  return res.json()
}

export async function fetchTodos(cardId) {
  const res = await fetch(`${API_BASE}/todos?card_id=${cardId}`)
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return res.json()
}

export async function createTodo(cardId, text) {
  const res = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card_id: cardId, text }),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return res.json()
}

export async function updateTodo(todoId, fields) {
  const res = await fetch(`${API_BASE}/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return res.json()
}

export async function deleteTodo(todoId) {
  const res = await fetch(`${API_BASE}/todos/${todoId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readErrorMessage(res))
}
