import React, { useState } from 'react'
import useToast from '@/hooks/use-toash'
import '../auth/login.css'
import loginImage from '../../image/login-screen.png'
import authApi from '@/services/auth'
import ThemeToggle from '@/components/ThemeToggle'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await authApi.signIn(username, password)

      // Lưu token vào localStorage
      localStorage.setItem('bmcms_token', response.accessToken)
      localStorage.setItem('bmcms_refresh_token', response.refreshToken)

      toast.success(t('common.loginSuccess'))
      navigate('/dashboard')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('common.loginFailed')
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex flex-col animation-bg justify-center bg-gradient-to-r from-[#94EBFF] via-[#D3F5FF] to-white dark:from-gray-900 dark:via-blue-900 dark:to-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex max-w-4xl w-full mx-auto">
        {/* Phần Login Box */}
        <div className="w-1/2 h-[500px] p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg border-4 border-[#0AEEFE] dark:border-blue-700">
          <h2 className="text-3xl font-bold mb-6 text-center dark:text-white">{t('common.login')}</h2>
          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300">
                <span className="flex items-center">
                  <i className="fas fa-envelope mr-2"></i>
                  {t('common.username')}
                </span>
              </label>
              <input
                type="username"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder={t('common.usernamePlaceholder')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300">
                <span className="flex items-center">
                  <i className="fas fa-lock mr-2"></i>
                  {t('common.password')}
                </span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('common.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-4 flex items-center">
                  <i className="fas fa-eye"></i>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" className="mr-2" />
                {t('common.rememberPassword')}
              </label>
              <a href="#" className="text-blue-500 text-sm">
                {t('common.forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-black dark:bg-blue-600 text-white py-3 rounded-lg text-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
            >
              {t('common.login')}
            </button>
          </form>
        </div>

        {/* Phần hình ảnh */}
        <div className="w-1/2 flex items-center justify-center">
          <img
            src={loginImage}
            alt="Login Illustration"
            className="max-w-xs transform scale-x-[-1]"
          />
        </div>
      </div>
    </div>
  )
}

export default Login
