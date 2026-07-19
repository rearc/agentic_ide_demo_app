import { vi } from 'vitest'

/** Build a minimal fetch Response stand-in carrying a JSON body. */
export function jsonResponse(body, { status = 200, statusText = 'OK' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
  }
}

/** A response whose body is not valid JSON, so `.json()` rejects. */
export function brokenJsonResponse({
  status = 500,
  statusText = 'Server Error',
} = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON')
    },
  }
}

/** Point global fetch at a queue of responses, one per call, in order. */
export function stubFetchSequence(...responses) {
  const fetchMock = vi.fn()
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response))
  globalThis.fetch = fetchMock
  return fetchMock
}

/** Point global fetch at a single response returned for every call. */
export function stubFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  globalThis.fetch = fetchMock
  return fetchMock
}
