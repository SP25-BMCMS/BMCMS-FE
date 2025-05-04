import React, { useState, useEffect } from 'react'
import { Residents } from '@/types'
import { toast } from 'react-hot-toast'
import { X, Building, User, Home, Info } from 'lucide-react'
import { getAllBuildingDetails, addApartmentForResident } from '@/services/residents'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'

interface AddApartmentModalProps {
  isOpen: boolean
  onClose: () => void
  resident: Residents | null
  onSuccess: () => void
}

interface BuildingDetail {
  buildingDetailId: string
  name: string
  building: {
    name: string
  }
}

interface BuildingOption {
  value: string
  label: string
}

const AddApartmentModal: React.FC<AddApartmentModalProps> = ({
  isOpen,
  onClose,
  resident,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [apartmentName, setApartmentName] = useState<string>('')
  const [selectedBuildingDetail, setSelectedBuildingDetail] = useState<BuildingOption | null>(null)
  const [buildingDetails, setBuildingDetails] = useState<BuildingDetail[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      fetchBuildingDetails()
    }
  }, [isOpen])

  const fetchBuildingDetails = async () => {
    setIsLoading(true)
    try {
      const response = await getAllBuildingDetails({ page: '1', limit: '9999' })
      if (response.data) {
        setBuildingDetails(response.data)
      }
    } catch (error) {
      console.error('Error fetching building details:', error)
      toast.error(t('residentManagement.addApartmentModal.errors.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resident) {
      toast.error(t('residentManagement.addApartmentModal.errors.missingResident'))
      return
    }

    if (!apartmentName.trim()) {
      toast.error(t('residentManagement.addApartmentModal.errors.enterName'))
      return
    }

    if (!selectedBuildingDetail) {
      toast.error(t('residentManagement.addApartmentModal.errors.selectBuilding'))
      return
    }

    setIsSubmitting(true)
    try {
      await addApartmentForResident(resident.userId, {
        apartments: [
          {
            apartmentName: apartmentName.trim(),
            buildingDetailId: selectedBuildingDetail.value,
          },
        ],
      })

      toast.success(t('residentManagement.addApartmentModal.success', { username: resident.username }))
      setApartmentName('')
      setSelectedBuildingDetail(null)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('residentManagement.addApartmentModal.errors.assignError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildingOptions: BuildingOption[] = buildingDetails.map(detail => ({
    value: detail.buildingDetailId,
    label: `${detail.name} - ${detail.building.name}`,
  }))

  // Updated styles for react-select
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      paddingLeft: '2.5rem',
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      '&:hover': {
        borderColor: '#3B82F6',
      },
      boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
      backgroundColor: 'transparent',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#E5E7EB' : 'transparent',
      color: state.isSelected ? 'white' : '#111827',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3B82F6' : '#E5E7EB',
      },
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#111827',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#111827',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'white',
      zIndex: 9999,
      position: 'absolute',
      width: '100%',
      marginTop: '4px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
  }

  // Dark mode styles
  const darkModeStyles = {
    ...customStyles,
    control: (provided: any, state: any) => ({
      ...customStyles.control(provided, state),
      backgroundColor: '#374151',
      borderColor: state.isFocused ? '#3B82F6' : '#4B5563',
    }),
    option: (provided: any, state: any) => ({
      ...customStyles.option(provided, state),
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#4B5563' : '#374151',
      color: 'white',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3B82F6' : '#4B5563',
      },
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'white',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'white',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#374151',
      zIndex: 9999,
      position: 'absolute',
      width: '100%',
      marginTop: '4px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
  }

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('residentManagement.addApartmentModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {resident && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center">
              <User className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('residentManagement.addApartmentModal.assigningFor')}
                </p>
                <p className="text-gray-900 dark:text-white font-medium">{resident.username}</p>
              </div>
            </div>
          </div>
        )}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/20">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('residentManagement.addApartmentModal.infoMessage')}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="apartmentName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('residentManagement.addApartmentModal.apartmentNameLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Home className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="apartmentName"
                  type="text"
                  value={apartmentName}
                  onChange={e => setApartmentName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder={t('residentManagement.addApartmentModal.apartmentNamePlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="buildingDetail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('residentManagement.addApartmentModal.buildingDetailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-[101]">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                {isLoading ? (
                  <div className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-400 sm:text-sm dark:bg-gray-700">
                    {t('residentManagement.addApartmentModal.loadingBuildingDetails')}
                  </div>
                ) : (
                  <Select
                    id="buildingDetail"
                    value={selectedBuildingDetail}
                    onChange={(option) => setSelectedBuildingDetail(option)}
                    options={buildingOptions}
                    isSearchable={true}
                    placeholder={t('residentManagement.addApartmentModal.buildingDetailPlaceholder')}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={document.documentElement.classList.contains('dark') ? darkModeStyles : customStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary: '#3B82F6',
                        primary75: '#60A5FA',
                        primary50: '#93C5FD',
                        primary25: '#BFDBFE',
                      },
                    })}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 ${isSubmitting || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('residentManagement.addApartmentModal.assigningButton')}
                </>
              ) : (
                t('residentManagement.addApartmentModal.assignButton')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddApartmentModal
