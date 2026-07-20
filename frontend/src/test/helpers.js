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

/** Point global fetch at a single response returned for every call. */
export function stubFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  globalThis.fetch = fetchMock
  return fetchMock
}

/**
 * A promise whose settlement the test controls.
 *
 * Use this to observe a component mid-flight, between the moment it fires a
 * request and the moment that request settles. Assertions about optimistic
 * updates need it: once the promise resolves, the optimistic state and the
 * server-confirmed state look identical, so a test that only checks the end
 * state passes even when the optimistic update has been deleted.
 */
export function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
