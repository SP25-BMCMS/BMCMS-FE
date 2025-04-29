import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { AxiosError } from 'axios'
import materialsApi, { Material } from '@/services/materials'
import UpdateMaterialModal from '@/components/materialManager/UpdateMaterialModal'
import UpdateUnitPriceModal from '@/components/materialManager/UpdateUnitPriceModal'
import UpdateStockQuantityModal from '@/components/materialManager/UpdateStockQuantityModal'
import UpdateStatusModal from '@/components/materialManager/UpdateStatusModal'
import { useTranslation } from 'react-i18next'

const MaterialDetail: React.FC = () => {
  const { t } = useTranslation()
  const { materialId } = useParams<{ materialId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isUnitPriceModalOpen, setIsUnitPriceModalOpen] = useState(false)
  const [isStockQuantityModalOpen, setIsStockQuantityModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  const {
    data: material,
    isLoading,
    isError,
  } = useQuery<Material>({
    queryKey: ['material', materialId],
    queryFn: () => materialsApi.getMaterialById(materialId || ''),
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  })

  // Handle query error
  React.useEffect(() => {
    if (isError) {
      toast.error(t('materialManagement.errorLoadingDetails'))
      navigate('/materials')
    }
  }, [isError, navigate, t])

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: (data: Partial<Material>) => materialsApi.updateMaterial(materialId || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', materialId] })
      setIsUpdateModalOpen(false)
      toast.success(t('materialManagement.updateSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.updateError'))
    },
  })

  // Update unit price mutation
  const updateUnitPriceMutation = useMutation({
    mutationFn: (unitPrice: string) => materialsApi.updateUnitPrice(materialId || '', unitPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', materialId] })
      setIsUnitPriceModalOpen(false)
      toast.success(t('materialManagement.unitPriceUpdateSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.unitPriceUpdateError'))
    },
  })

  // Update stock quantity mutation
  const updateStockQuantityMutation = useMutation({
    mutationFn: (stockQuantity: number) =>
      materialsApi.updateStockQuantity(materialId || '', stockQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', materialId] })
      setIsStockQuantityModalOpen(false)
      toast.success(t('materialManagement.stockQuantityUpdateSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.stockQuantityUpdateError'))
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') =>
      materialsApi.updateStatus(materialId || '', status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', materialId] })
      setIsStatusModalOpen(false)
      toast.success(t('materialManagement.statusUpdateSuccess'))
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || t('materialManagement.statusUpdateError'))
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (isError || !material) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{t('materialManagement.errorLoadingDetails')}</div>
      </div>
    )
  }

  return (
    <div className="w-full mt-[60px]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('materialManagement.details')}</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('materialManagement.editMaterial')}
            </button>
            <button
              onClick={() => navigate('/materials')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              {t('materialManagement.backToList')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('materialManagement.basicInfo')}
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('materialManagement.materialId')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {material.material_id}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('materialManagement.name')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{material.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('materialManagement.description')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {material.description}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('materialManagement.additionalInfo')}
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('materialManagement.unitPrice')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  ${parseFloat(material.unit_price).toFixed(2)}
                  <button
                    onClick={() => setIsUnitPriceModalOpen(true)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title={t('materialManagement.edit')}
                  >
                    {t('materialManagement.edit')}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('materialManagement.stockQuantity')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {material.stock_quantity}
                  <button
                    onClick={() => setIsStockQuantityModalOpen(true)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title={t('materialManagement.edit')}
                  >
                    {t('materialManagement.edit')}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('materialManagement.status')}</dt>
                <dd className="mt-1">
                  <span
                    className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full
                      ${material.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                  >
                    {material.status === 'ACTIVE'
                      ? t('materialManagement.filterOptions.status.active')
                      : t('materialManagement.filterOptions.status.inactive')}
                  </span>
                  <button
                    onClick={() => setIsStatusModalOpen(true)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title={t('materialManagement.edit')}
                  >
                    {t('materialManagement.edit')}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('materialManagement.createdAt')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(material.created_at).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('materialManagement.updatedAt')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(material.updated_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <UpdateMaterialModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSubmit={updateMaterialMutation.mutate}
        material={material}
        isLoading={updateMaterialMutation.isPending}
      />

      <UpdateUnitPriceModal
        isOpen={isUnitPriceModalOpen}
        onClose={() => setIsUnitPriceModalOpen(false)}
        onSubmit={updateUnitPriceMutation.mutate}
        material={material}
        isLoading={updateUnitPriceMutation.isPending}
      />

      <UpdateStockQuantityModal
        isOpen={isStockQuantityModalOpen}
        onClose={() => setIsStockQuantityModalOpen(false)}
        onSubmit={updateStockQuantityMutation.mutate}
        material={material}
        isLoading={updateStockQuantityMutation.isPending}
      />

      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSubmit={updateStatusMutation.mutate}
        material={material}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  )
}

export default MaterialDetail
