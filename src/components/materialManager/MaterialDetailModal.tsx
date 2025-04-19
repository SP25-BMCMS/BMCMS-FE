import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { ACTIVE, INACTIVE } from '@/constants/colors';
import materialsApi, { Material } from '@/services/materials';
import UpdateMaterialModal from './UpdateMaterialModal';
import UpdateUnitPriceModal from './UpdateUnitPriceModal';
import UpdateStockQuantityModal from './UpdateStockQuantityModal';
import UpdateStatusModal from './UpdateStatusModal';
import { DollarSign, Box, RefreshCw, Calendar, Edit, Tag, FileText, Info } from 'lucide-react';

interface MaterialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({ isOpen, onClose, material }) => {
  const queryClient = useQueryClient();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUnitPriceModalOpen, setIsUnitPriceModalOpen] = useState(false);
  const [isStockQuantityModalOpen, setIsStockQuantityModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: (data: Partial<Material>) =>
      materialsApi.updateMaterial(material.material_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsUpdateModalOpen(false);
      toast.success('Material updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update material');
    },
  });

  // Update unit price mutation
  const updateUnitPriceMutation = useMutation({
    mutationFn: (unitPrice: string) =>
      materialsApi.updateUnitPrice(material.material_id, unitPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsUnitPriceModalOpen(false);
      toast.success('Unit price updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update unit price');
    },
  });

  // Update stock quantity mutation
  const updateStockQuantityMutation = useMutation({
    mutationFn: (stockQuantity: number) =>
      materialsApi.updateStockQuantity(material.material_id, stockQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsStockQuantityModalOpen(false);
      toast.success('Stock quantity updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update stock quantity');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') =>
      materialsApi.updateStatus(material.material_id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsStatusModalOpen(false);
      toast.success('Status updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Format price to VND
  const formatPrice = (price: string) => {
    if (!price) return '0 VND';

    try {
      const numericPrice = parseInt(price);
      if (isNaN(numericPrice)) return '0 VND';

      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(numericPrice);
    } catch (error) {
      return '0 VND';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                  Material Details
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" /> Basic
                    Information
                  </h2>
                  <dl className="space-y-4">
                    <div></div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-green-500" /> Name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {material.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-orange-500" /> Description
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {material.description}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" /> Additional
                    Information
                  </h2>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-green-500" /> Unit Price
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                        <span className="bg-green-50 dark:bg-green-900 px-2 py-1 rounded text-green-700 dark:text-green-300">
                          {formatPrice(material.unit_price)}
                        </span>
                        <button
                          onClick={() => setIsUnitPriceModalOpen(true)}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <Box className="w-4 h-4 mr-2 text-blue-500" /> Stock Quantity
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                        <span
                          className={`px-2 py-1 rounded ${
                            material.stock_quantity > 10
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : material.stock_quantity > 0
                                ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                : 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {material.stock_quantity} units
                        </span>
                        <button
                          onClick={() => setIsStockQuantityModalOpen(true)}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 text-purple-500" /> Status
                      </dt>
                      <dd className="mt-1 flex items-center">
                        <span
                          className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full
                            ${material.status === 'ACTIVE' ? ACTIVE : INACTIVE}`}
                        >
                          {material.status}
                        </span>
                        <button
                          onClick={() => setIsStatusModalOpen(true)}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-amber-500" /> Created At
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(material.created_at).toLocaleString('vi-VN')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Updated At
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(material.updated_at).toLocaleString('vi-VN')}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit Material
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

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
    </>
  );
};

export default MaterialDetailModal;
