export const AUTH_TOKEN_STORAGE_KEY = "token"
export const DEFAULT_AUTH_REDIRECT = "/app/workshops"

const listeners = new Set<() => void>()

function notifyAuthChange() {
  listeners.forEach((listener) => listener())
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  notifyAuthChange()
}

export function clearAuthToken() {
  if (!getAuthToken()) return

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  notifyAuthChange()
}

export function subscribeAuthSession(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
