import axios from 'axios'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const EXPIRES_AT_KEY = 'auth_expires_at'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
})

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY) ?? '0')
  if (token && expiresAt && Date.now() > expiresAt) {
    clearStoredSession()
    return config
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
