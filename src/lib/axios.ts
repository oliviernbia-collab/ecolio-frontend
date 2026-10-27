import axios from 'axios'

// La session est portée par un cookie httpOnly posé par le backend à la connexion : aucun jeton
// n'est stocké ni lu côté JavaScript (un script injecté ne pourrait donc pas le voler).
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  // En-tête exigé par le backend sur les requêtes qui modifient des données (protection CSRF :
  // un autre site ne peut pas l'ajouter à une requête vers l'API)
  config.headers['X-Requested-With'] = 'XMLHttpRequest'
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
    // (inclut /auth/login/2fa : un 401 y signifie "code incorrect")
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (is401 && !isLoginEndpoint && localStorage.getItem('ecolio_user')) {
      localStorage.removeItem('ecolio_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
