import React, { useState, useEffect } from 'react'
import { updateBuilding, getBuildingById } from '@/services/building'
import { getAreaList } from '@/services/areas'
import { getAllStaff } from '@/services/staff'
import { Area, StaffData } from '@/types'
import toast from 'react-hot-toast'
import { Loader2, UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EditBuildingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  buildingId: string | null
}

const EditBuildingModal: React.FC<EditBuildingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  buildingId,
}) => {
  const { t } = useTranslation()
  const [areas, setAreas] = useState<Area[]>([])
  const [staff, setStaff] = useState<StaffData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [formData, setFormData] = useState({
    buildingId: '',
    name: '',
    description: '',
    numberFloor: 1,
    imageCover: '',
    areaId: '',
    manager_id: '',
    construction_date: new Date().toLocaleDateString('en-CA'),
    completion_date: new Date().toLocaleDateString('en-CA'),
    status: 'operational',
  })

  const [errors, setErrors] = useState<{
    [key: string]: string
  }>({})

  // Fetch building data when modal opens
  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!buildingId) return

      setIsLoadingData(true)
      try {
        const buildingResponse = await getBuildingById(buildingId)
        if (buildingResponse.data) {
          const building = buildingResponse.data

          // Format the dates properly for input fields
          const formattedConstructionDate = building.construction_date
            ? new Date(building.construction_date).toLocaleDateString('en-CA')
            : new Date().toLocaleDateString('en-CA')

          const formattedCompletionDate = building.completion_date
            ? new Date(building.completion_date).toLocaleDateString('en-CA')
            : new Date().toLocaleDateString('en-CA')

          setFormData({
            buildingId: building.buildingId,
            name: building.name || '',
            description: building.description || '',
            numberFloor: building.numberFloor || 1,
            imageCover: building.imageCover || '',
            areaId: building.areaId || '',
            manager_id: building.manager_id || '',
            construction_date: formattedConstructionDate,
            completion_date: formattedCompletionDate,
            status: building.Status.toLowerCase() as 'operational' | 'under_construction',
          })
        }
      } catch (error) {
        console.error('Error fetching building data:', error)
        toast.error(t('building.edit.error'))
      } finally {
        setIsLoadingData(false)
      }
    }

    if (isOpen && buildingId) {
      fetchBuildingData()
    }
  }, [isOpen, buildingId, t])

  useEffect(() => {
    if (formData.status === 'under_construction') {
      setFormData(prev => ({
        ...prev,
        completion_date: 'dd/mm/yyyy',
        manager_id: '', // Reset manager_id when under construction
      }))
    }
  }, [formData.status])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch areas
        const areasData = await getAreaList()
        setAreas(areasData)

        // Fetch staff for manager selection - Thêm tham số page và limit
        const staffResponse = await getAllStaff({
          page: '1',
          limit: '9999' // hoặc số lượng phù hợp với nhu cầu của bạn
        })

        if (staffResponse && staffResponse.data) {
          setStaff(staffResponse.data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error(t('common.error'))
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, t])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (name === 'numberFloor') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 1,
      }))
    } else if (name === 'status') {
      if (value === 'under_construction') {
        setFormData(prev => ({
          ...prev,
          status: value,
          completion_date: 'dd/mm/yyyy',
          manager_id: '', // Clear manager when status is under construction
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          status: value,
          completion_date: new Date().toLocaleDateString('en-CA'),
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = t('building.edit.nameRequired')
    }

    if (!formData.areaId) {
      newErrors.areaId = t('building.edit.areaRequired')
    }

    if (!formData.construction_date) {
      newErrors.construction_date = t('building.edit.constructionDateRequired')
    }

    if (formData.status === 'operational' && !formData.completion_date) {
      newErrors.completion_date = t('building.edit.completionDateRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !buildingId) {
      return
    }

    setIsLoading(true)
    try {
      // Convert dates to ISO 8601 format for API
      const construction_date_iso = formData.construction_date && formData.construction_date !== 'dd/mm/yyyy'
        ? new Date(formData.construction_date).toISOString()
        : null

      const completion_date_iso = formData.status === 'operational' && formData.completion_date && formData.completion_date !== 'dd/mm/yyyy'
        ? new Date(formData.completion_date).toISOString()
        : null

      const buildingData = {
        buildingId: formData.buildingId,
        name: formData.name,
        description: formData.description,
        numberFloor: formData.numberFloor,
        imageCover: formData.imageCover,
        areaId: formData.areaId,
        construction_date: construction_date_iso,
        completion_date: completion_date_iso,
        status: formData.status as 'operational' | 'under_construction',
        ...(formData.status === 'operational' && formData.manager_id
          ? { manager_id: formData.manager_id }
          : {}),
      }

      await updateBuilding(buildingId, buildingData)

      toast.success(t('building.edit.success'))
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating building:', err)
      toast.error(t('building.edit.error'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-[800px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t('building.edit.title')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('building.edit.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center items-center p-4 sm:p-8">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">{t('building.edit.loading')}</span>
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSubmit()
            }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Building Name */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('building.edit.namePlaceholder')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.name
                    ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                    : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Number of Floors */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.numberFloors')}
                </label>
                <input
                  type="number"
                  name="numberFloor"
                  value={formData.numberFloor}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.numberFloor
                    ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                    : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                />
                {errors.numberFloor && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.numberFloor}
                  </p>
                )}
              </div>

              {/* Image URL */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.imageUrl')}
                </label>
                <input
                  type="text"
                  name="imageCover"
                  value={formData.imageCover}
                  onChange={handleChange}
                  placeholder={t('building.edit.imageUrlPlaceholder')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.imageCover
                    ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                    : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                />
                {errors.imageCover && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.imageCover}</p>
                )}
              </div>

              {/* Area Selection */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.area')}
                </label>
                <select
                  name="areaId"
                  value={formData.areaId}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.areaId
                    ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                    : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                >
                  <option value="">{t('building.edit.selectArea')}</option>
                  {areas.map(area => (
                    <option key={area.areaId} value={area.areaId}>
                      {area.name}
                    </option>
                  ))}
                </select>
                {errors.areaId && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.areaId}</p>
                )}
              </div>

              {/* Construction Date */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.constructionDate')}
                </label>
                <input
                  type="date"
                  name="construction_date"
                  value={formData.construction_date}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.construction_date
                    ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                    : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                />
                {errors.construction_date && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.construction_date}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.status')}
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="operational"
                      checked={formData.status === 'operational'}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600 dark:text-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('building.edit.operational')}
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="under_construction"
                      checked={formData.status === 'under_construction'}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600 dark:text-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('building.edit.underConstruction')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Completion Date */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.completionDate')}
                </label>
                {formData.status === 'under_construction' ? (
                  <input
                    type="text"
                    name="completion_date"
                    value={formData.completion_date}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
                            bg-gray-50 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    disabled
                  />
                ) : (
                  <input
                    type="date"
                    name="completion_date"
                    value={formData.completion_date}
                    onChange={handleChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.completion_date
                      ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                      : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                  />
                )}
                {errors.completion_date && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.completion_date}
                  </p>
                )}
              </div>

              {/* Manager Selection - Only shows for operational buildings */}
              {formData.status === 'operational' && (
                <div className="space-y-1 sm:space-y-2 col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center">
                    <UserIcon className="w-4 h-4 mr-1.5 text-blue-500" />
                    {t('building.edit.manager')}
                  </label>
                  <select
                    name="manager_id"
                    value={formData.manager_id}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">{t('building.edit.selectManager')}</option>
                    {staff
                      .filter(s => s.role === 'Manager' || s.role === 'manager')
                      .map(manager => (
                        <option key={manager.userId} value={manager.userId}>
                          {manager.username}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('building.edit.managerHint')}
                  </p>
                </div>
              )}

              {/* Description - Full Width */}
              <div className="col-span-1 sm:col-span-2 space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('building.edit.description')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('building.edit.descriptionPlaceholder')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.description
                    ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20'
                    : 'border-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-600 transition-colors text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('building.edit.updating')}
                  </span>
                ) : (
                  t('building.edit.updateButton')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditBuildingModal
