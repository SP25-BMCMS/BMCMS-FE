import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TechnicalRecord } from '@/services/technicalRecord'
import { Download, Eye, FileText, FileIcon, BookOpen, Upload, Plus, X } from 'lucide-react'
import { motion } from 'framer-motion'
import apiInstance from '@/lib/axios'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Pagination from '@/components/Pagination'
import SearchInput from '@/components/SearchInput'
import { useDebounce } from '@/hooks/useDebounce'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, size = 'md', children }) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  const getMaxWidth = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'md':
        return 'max-w-2xl'
      case 'lg':
        return 'max-w-4xl'
      case 'xl':
        return 'max-w-6xl'
      default:
        return 'max-w-2xl'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${getMaxWidth()} flex flex-col max-h-[90vh]`}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            title={t('common.close')}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-6 scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-rounded-md scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          {children}
        </div>
      </div>
    </div>
  )
}

// Interface for device data
interface Device {
  device_id: string
  name: string
  type: string
  buildingDetail: {
    buildingDetailId: string
    name: string
  }
}

// Interface for device response
interface DeviceResponse {
  data: Device[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Interface for technical record upload form
interface UploadTechnicalRecordFormProps {
  buildingId: string
  buildingDetailId: string | null
  onSuccess: () => void
  onCancel: () => void
}

// Technical Record Upload Form Component
const UploadTechnicalRecordForm: React.FC<UploadTechnicalRecordFormProps> = ({
  buildingId,
  buildingDetailId,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation()
  const [deviceId, setDeviceId] = useState<string>('')
  const [fileType, setFileType] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const queryClient = useQueryClient()

  // Fetch technical records for the building to find devices that already have records
  const { data: existingRecords } = useQuery({
    queryKey: ['technicalRecordsByBuilding', buildingId],
    queryFn: async () => {
      if (!buildingId) return []

      const url = import.meta.env.VITE_GET_TECHNICAL_RECORD_BY_BUILDING_ID.replace(
        '{buildingId}',
        buildingId
      )
      const response = await apiInstance.get<TechnicalRecordsByBuildingResponse>(url)
      return response.data.data || []
    },
    enabled: !!buildingId,
  })

  // Fetch devices for the building detail
  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices', buildingDetailId],
    queryFn: async () => {
      if (!buildingDetailId) return { data: [] }

      const url = import.meta.env.VITE_GET_DEVICE_BY_BUILDING_DETAIL_ID.replace(
        '{buildingDetailId}',
        buildingDetailId
      )
      const response = await apiInstance.get<DeviceResponse>(url)
      return response.data
    },
    enabled: !!buildingDetailId,
  })

  // Filter out devices that already have technical records
  const availableDevices = useMemo(() => {
    if (!devices?.data || !existingRecords) return []

    // Get all device IDs that already have technical records
    const usedDeviceIds = new Set(existingRecords.map(record => record.device_id))

    // Filter devices that don't have technical records yet
    return devices.data.filter(device => !usedDeviceIds.has(device.device_id))
  }, [devices, existingRecords])

  // File type options
  const fileTypeOptions = [
    { value: 'Manual', label: t('buildingManager.technicalRecord.upload.documentType.options.manual') },
    { value: 'Specification', label: t('buildingManager.technicalRecord.upload.documentType.options.specification') },
    { value: 'Certificate', label: t('buildingManager.technicalRecord.upload.documentType.options.certificate') },
    { value: 'Warranty', label: t('buildingManager.technicalRecord.upload.documentType.options.warranty') },
    { value: 'Maintenance', label: t('buildingManager.technicalRecord.upload.documentType.options.maintenance') },
  ]

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check if file is PDF
      if (selectedFile.type !== 'application/pdf') {
        toast.error(t('buildingManager.technicalRecord.upload.file.invalidType'))
        e.target.value = ''
        return
      }

      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error(t('buildingManager.technicalRecord.upload.file.fileTooLarge'))
        e.target.value = ''
        return
      }

      setFile(selectedFile)
    }
  }

  // Create technical record mutation
  const createTechnicalRecord = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiInstance.post(
        import.meta.env.VITE_CREATE_TECHNICAL_RECORD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalRecordsByBuilding', buildingId] })
      toast.success('Technical record uploaded successfully')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(`Failed to upload: ${error.message || 'Unknown error'}`)
      setIsSubmitting(false)
    },
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!deviceId) {
      toast.error('Please select a device')
      return
    }

    if (!fileType) {
      toast.error('Please select a file type')
      return
    }

    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('device_id', deviceId)
    formData.append('file_type', fileType)
    formData.append('recordFile', file)

    createTechnicalRecord.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('buildingManager.technicalRecord.upload.device.label')} <span className="text-red-500">*</span>
        </label>
        {isLoadingDevices ? (
          <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        ) : availableDevices.length > 0 ? (
          <select
            value={deviceId}
            onChange={e => setDeviceId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
            title={t('buildingManager.technicalRecord.upload.device.label')}
          >
            <option value="">{t('buildingManager.technicalRecord.upload.device.select')}</option>
            {availableDevices.map(device => (
              <option key={device.device_id} value={device.device_id}>
                {device.name} ({device.type})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-red-500 py-2 bg-red-50 dark:bg-red-900/20 px-3 rounded-md">
            {t('buildingManager.technicalRecord.upload.device.allDevicesHaveRecords')}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('buildingManager.technicalRecord.upload.documentType.label')} <span className="text-red-500">*</span>
        </label>
        <select
          value={fileType}
          onChange={e => setFileType(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
          disabled={availableDevices.length === 0}
          title={t('buildingManager.technicalRecord.upload.documentType.label')}
        >
          <option value="">{t('buildingManager.technicalRecord.upload.documentType.select')}</option>
          {fileTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('buildingManager.technicalRecord.upload.file.label')} <span className="text-red-500">*</span>
        </label>
        <div
          className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 ${availableDevices.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="space-y-2 text-center">
            {file ? (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-700"
                  disabled={availableDevices.length === 0}
                  title={t('buildingManager.technicalRecord.upload.file.removeFile')}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex justify-center text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className={`relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${availableDevices.length === 0 ? 'pointer-events-none' : ''}`}
                  >
                    <span>{t('buildingManager.technicalRecord.upload.file.uploadButton')}</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={availableDevices.length === 0}
                    />
                  </label>
                  <p className="pl-1">{t('buildingManager.technicalRecord.upload.file.dragDrop')}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('buildingManager.technicalRecord.upload.file.pdfOnly')}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('buildingManager.technicalRecord.upload.buttons.cancel')}
        </button>
        <button
          type="submit"
          disabled={
            isSubmitting || !deviceId || !fileType || !file || availableDevices.length === 0
          }
          className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none ${isSubmitting || !deviceId || !fileType || !file || availableDevices.length === 0
            ? 'opacity-70 cursor-not-allowed'
            : ''
            }`}
        >
          {isSubmitting ? t('buildingManager.technicalRecord.upload.buttons.uploading') : t('buildingManager.technicalRecord.upload.buttons.upload')}
        </button>
      </div>
    </form>
  )
}

interface TechnicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  buildingId: string
  buildingDetailId: string | null
  buildingName: string
}

// Response type for the technical records API
interface TechnicalRecordsByBuildingResponse {
  data: TechnicalRecord[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const TechnicalRecordModal: React.FC<TechnicalRecordModalProps> = ({
  isOpen,
  onClose,
  buildingId,
  buildingDetailId,
  buildingName,
}) => {
  const { t } = useTranslation()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchTerm, setSearchTerm] = useState('')

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Function to fetch technical records by building ID using the new API endpoint
  const fetchTechnicalRecordsByBuildingId = async (buildingId: string) => {
    try {
      const url = import.meta.env.VITE_GET_TECHNICAL_RECORD_BY_BUILDING_ID.replace(
        '{buildingId}',
        buildingId
      )
      const response = await apiInstance.get<TechnicalRecordsByBuildingResponse>(url)
      return response.data.data
    } catch (error) {
      console.error('Error fetching technical records for building:', error)
      throw error
    }
  }

  // Get technical records for the building
  const {
    data: technicalRecords,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['technicalRecordsByBuilding', buildingId],
    queryFn: () => fetchTechnicalRecordsByBuildingId(buildingId),
    enabled: !!buildingId && isOpen,
  })

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('manual')) {
      return <BookOpen className="h-5 w-5 text-blue-500" />
    } else if (type.includes('technical') || type.includes('specification')) {
      return <FileText className="h-5 w-5 text-green-500" />
    } else if (type.includes('certificate')) {
      return <FileIcon className="h-5 w-5 text-yellow-500" />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  // Extract filename from URL
  const extractFilename = (path: string) => {
    // Try to extract filename from URL or path
    if (!path) return 'Unnamed Document'

    // Check if it contains a slash and get the part after the last slash
    if (path.includes('/')) {
      const parts = path.split('/')
      return parts[parts.length - 1]
    }

    return path
  }

  // Open upload modal
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true)
  }

  // Close upload modal
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
  }

  // Handle successful upload
  const handleUploadSuccess = () => {
    handleCloseUploadModal()
    refetch()
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  }

  // Filter records based on search term
  const getFilteredRecords = () => {
    if (!technicalRecords) return []

    return technicalRecords.filter(record => {
      const searchString = debouncedSearchTerm.toLowerCase()
      return (
        record.file_name.toLowerCase().includes(searchString) ||
        record.file_type.toLowerCase().includes(searchString) ||
        record.device.name.toLowerCase().includes(searchString) ||
        record.device.type.toLowerCase().includes(searchString)
      )
    })
  }

  // Update pagination calculation to use filtered records
  const getPaginatedRecords = () => {
    const filteredRecords = getFilteredRecords()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentRecords = filteredRecords.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

    return {
      currentRecords,
      totalPages,
      startIndex,
      endIndex,
      totalItems: filteredRecords.length
    }
  }

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm])

  // If upload modal is open, show it instead of the main content
  if (isUploadModalOpen) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('buildingManager.technicalRecord.upload.title')}
        size="md"
      >
        <UploadTechnicalRecordForm
          buildingId={buildingId}
          buildingDetailId={buildingDetailId}
          onSuccess={handleUploadSuccess}
          onCancel={handleCloseUploadModal}
        />
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('buildingManager.technicalRecord.list.title', { buildingName })}
      size="lg"
    >
      {!buildingId ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="inline-flex justify-center items-center p-4 mb-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500 dark:text-red-400">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('buildingManager.technicalRecord.errors.buildingIdRequired.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {t('buildingManager.technicalRecord.errors.buildingIdRequired.description')}
          </p>
        </motion.div>
      ) : isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6 px-4"
        >
          <div className="inline-flex justify-center items-center p-3 mb-3 bg-red-100 rounded-full text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('buildingManager.technicalRecord.errors.loadFailed.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : t('buildingManager.technicalRecord.errors.loadFailed.description')}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 mr-4">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('buildingManager.technicalRecord.search.placeholder')}
                className="w-full max-w-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('buildingManager.technicalRecord.list.count', { count: getPaginatedRecords().totalItems })}
              </span>
              <button
                onClick={handleOpenUploadModal}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {t('buildingManager.technicalRecord.list.uploadNew')}
              </button>
            </div>
          </div>

          {!technicalRecords || getPaginatedRecords().totalItems === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="inline-flex justify-center items-center p-4 mb-4 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm
                  ? t('buildingManager.technicalRecord.search.noResults')
                  : t('buildingManager.technicalRecord.list.noRecords.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {searchTerm
                  ? t('buildingManager.technicalRecord.search.tryDifferent')
                  : t('buildingManager.technicalRecord.list.noRecords.description')}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-6">
                  {getPaginatedRecords().currentRecords.map((record: TechnicalRecord) => (
                    <motion.div
                      key={record.record_id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
                      variants={itemVariants}
                    >
                      <div className="flex flex-wrap justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {getFileTypeIcon(record.file_type)}
                          <div>
                            <h5 className="text-base font-medium text-gray-900 dark:text-white">
                              {extractFilename(record.file_name)}
                            </h5>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md text-xs font-medium mr-2">
                                {record.file_type}
                              </span>
                              <span>{t('buildingManager.technicalRecord.list.uploadDate', { date: formatDate(record.upload_date) })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('buildingManager.technicalRecord.list.deviceInfo.title')}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center">
                            <span className="text-gray-500 dark:text-gray-400 mr-2">{t('buildingManager.technicalRecord.list.deviceInfo.device')}</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {record.device.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 dark:text-gray-400 mr-2">{t('buildingManager.technicalRecord.list.deviceInfo.type')}</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {record.device.type}
                            </span>
                          </div>
                          <div className="flex items-center md:col-span-2">
                            <span className="text-gray-500 dark:text-gray-400 mr-2">{t('buildingManager.technicalRecord.list.deviceInfo.building')}</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {record.device.buildingDetail.building.name} ({record.device.buildingDetail.name})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={record.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          {t('buildingManager.technicalRecord.list.actions.download')}
                        </a>
                        <a
                          href={record.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          {t('buildingManager.technicalRecord.list.actions.view')}
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {technicalRecords && technicalRecords.length > 0 && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={getPaginatedRecords().totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={getPaginatedRecords().totalItems}
                    itemsPerPage={itemsPerPage}
                    onLimitChange={setItemsPerPage}
                    limitOptions={[5, 10, 20, 50]}
                  />
                </div>
              )}

              <style>
                {`
                  /* Custom scrollbar styles */
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                  }

                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                  }

                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                    border: 2px solid #f1f1f1;
                  }

                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                  }

                  /* Dark mode */
                  .dark .custom-scrollbar::-webkit-scrollbar-track {
                    background: #374151;
                  }

                  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4B5563;
                    border: 2px solid #374151;
                  }

                  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6B7280;
                  }
                `}
              </style>
            </>
          )}
        </motion.div>
      )}
    </Modal>
  )
}

export default TechnicalRecordModal

