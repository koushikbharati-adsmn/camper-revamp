import { clearAuthToken, getAuthToken } from "@/lib/auth-session"
import axios from "axios"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()

  config.headers["x-api-key"] = import.meta.env.VITE_API_KEY

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getAuthToken()) {
      clearAuthToken()
    }

    if (error.response) {
      error.message = error.response.data?.message ?? "Something went wrong"

      return Promise.reject(error)
    }

    if (error.request) {
      error.message = "Network error. Please try again."

      return Promise.reject(error)
    }

    error.message = error.message ?? "Unknown error"

    return Promise.reject(error)
  }
)

export default apiClient
