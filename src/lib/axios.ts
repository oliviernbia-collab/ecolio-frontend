import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecolio_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Ne pas forcer application/json si le body est un FormData
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.response?.status === 401
    // Exclure l'endpoint de login : un 401 là-bas signifie "mauvais mot de passe",
    // pas "session expirée" — l'erreur doit remonter au formulaire
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (is401 && !isLoginEndpoint) {
      localStorage.removeItem('ecolio_token')
      localStorage.removeItem('ecolio_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
