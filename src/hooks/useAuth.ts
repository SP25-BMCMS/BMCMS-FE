import { useState, useEffect } from 'react'
import authApi from '@/services/auth'
import { GetCurrentUserAPIResponse } from '@/types'

export const useAuth = () => {
  const [user, setUser] = useState<GetCurrentUserAPIResponse | null>(() => {
    const storedUser = localStorage.getItem('bmcms_user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [loading, setLoading] = useState(false)

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await authApi.getCurrentUser()
      if (response) {
        setUser(response)
        localStorage.setItem('bmcms_user', JSON.stringify(response))
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('bmcms_user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      fetchUser()
    }
  }, [])

  return { user, loading }
}
