import React, { useState } from 'react'
import { AddStaffData } from '@/services/staffs'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AddStaffProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (staffData: AddStaffData) => Promise<void>
  isLoading: boolean
}

const AddStaff: React.FC<AddStaffProps> = ({ isOpen, onClose, onAdd, isLoading }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<AddStaffData>({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'Staff',
    dateOfBirth: '',
    gender: 'Male',
  })

  const [errors, setErrors] = useState<{
    [key in keyof AddStaffData]?: string
  }>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof AddStaffData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSelectChange = (field: keyof AddStaffData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    const selectedDate = new Date(dateValue)
    const today = new Date()
    let age = today.getFullYear() - selectedDate.getFullYear()
    const monthDiff = today.getMonth() - selectedDate.getMonth()

    // Kiểm tra độ tuổi
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
      age--
    }

    if (age < 18) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: 'Staff must be at least 18 years old'
      }))
      return
    }

    const isoDate = dateValue ? new Date(dateValue).toISOString() : ''

    setFormData(prev => ({
      ...prev,
      dateOfBirth: isoDate,
    }))

    if (errors.dateOfBirth) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: undefined,
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key in keyof AddStaffData]?: string } = {}

    if (!formData.username.trim()) {
      newErrors.username = t('staffManagement.addStaff.form.username.required')
    }

    if (!formData.email.trim()) {
      newErrors.email = t('staffManagement.addStaff.form.email.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('staffManagement.addStaff.form.email.invalid')
    }

    if (!formData.password) {
      newErrors.password = t('staffManagement.addStaff.form.password.required')
    } else if (formData.password.length < 6) {
      newErrors.password = t('staffManagement.addStaff.form.password.minLength')
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('staffManagement.addStaff.form.phone.required')
    } else if (!/^\d{10,11}$/.test(formData.phone)) {
      newErrors.phone = t('staffManagement.addStaff.form.phone.invalid')
    }

    if (!formData.role) {
      newErrors.role = t('staffManagement.addStaff.form.role.required')
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('staffManagement.addStaff.form.dateOfBirth.required')
    }

    if (!formData.gender) {
      newErrors.gender = t('staffManagement.addStaff.form.gender.required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      await onAdd(formData)
      setFormData({
        username: '',
        email: '',
        password: '',
        phone: '',
        role: 'Staff',
        dateOfBirth: '',
        gender: 'Male',
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-[600px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t('staffManagement.addStaff.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('staffManagement.addStaff.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('staffManagement.addStaff.form.username.label')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder={t('staffManagement.addStaff.form.username.placeholder')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.username
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                  : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              />
              {errors.username && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('staffManagement.addStaff.form.email.label')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('staffManagement.addStaff.form.email.placeholder')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.email
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                  : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              />
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('staffManagement.addStaff.form.password.label')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('staffManagement.addStaff.form.password.placeholder')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.password
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                  : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              />
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('staffManagement.addStaff.form.phone.label')}
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('staffManagement.addStaff.form.phone.placeholder')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.phone
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                  : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              />
              {errors.phone && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('staffManagement.addStaff.form.role.label')}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={e => handleSelectChange('role', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.role
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                  : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              >
                <option value="Staff">{t('staffManagement.addStaff.form.role.options.staff')}</option>
                <option value="Manager">{t('staffManagement.addStaff.form.role.options.manager')}</option>
              </select>
              {errors.role && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('staffManagement.addStaff.form.gender.label')}
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={e => handleSelectChange('gender', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.gender
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                  : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              >
                <option value="Male">{t('staffManagement.addStaff.form.gender.options.male')}</option>
                <option value="Female">{t('staffManagement.addStaff.form.gender.options.female')}</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="dateOfBirth"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('staffManagement.addStaff.form.dateOfBirth.label')}
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                onChange={handleDateChange}
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-CA') : ''}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.dateOfBirth
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                  : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-600 transition-colors"
            >
              {t('staffManagement.addStaff.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('staffManagement.addStaff.buttons.processing')}
                </span>
              ) : (
                t('staffManagement.addStaff.buttons.add')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddStaff
