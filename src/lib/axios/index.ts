import axios from 'axios'

export const TOKEN_KEY = 'bmcms_token'
export const REFRESH_TOKEN_KEY = 'bmcms_refresh_token'

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_SECRET.startsWith('http') 
    ? import.meta.env.VITE_API_SECRET 
    : `http://${import.meta.env.VITE_API_SECRET}`
});


apiInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


export default apiInstance
