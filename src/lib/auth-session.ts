export const AUTH_TOKEN_STORAGE_KEY = "token"
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized"
export const DEFAULT_AUTH_REDIRECT = "/app/workshops"

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export function notifyUnauthorized() {
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
}
