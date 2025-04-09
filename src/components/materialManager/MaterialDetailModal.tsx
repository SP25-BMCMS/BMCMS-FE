import React, { useState } from "react"
import { Dialog } from "@headlessui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { AxiosError } from "axios"
import { ACTIVE, INACTIVE } from "@/constants/colors"
import materialsApi, { Material } from "@/services/materials"
import UpdateMaterialModal from "./UpdateMaterialModal"
import UpdateUnitPriceModal from "./UpdateUnitPriceModal"
import UpdateStockQuantityModal from "./UpdateStockQuantityModal"
import UpdateStatusModal from "./UpdateStatusModal"

interface MaterialDetailModalProps {
    isOpen: boolean
    onClose: () => void
    material: Material
}

const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({ isOpen, onClose, material }) => {
    const queryClient = useQueryClient()
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
    const [isUnitPriceModalOpen, setIsUnitPriceModalOpen] = useState(false)
    const [isStockQuantityModalOpen, setIsStockQuantityModalOpen] = useState(false)
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

    // Update material mutation
    const updateMaterialMutation = useMutation({
        mutationFn: (data: Partial<Material>) => materialsApi.updateMaterial(material.material_id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] })
            setIsUpdateModalOpen(false)
            toast.success("Material updated successfully")
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || "Failed to update material")
        }
    })

    // Update unit price mutation
    const updateUnitPriceMutation = useMutation({
        mutationFn: (unitPrice: string) => materialsApi.updateUnitPrice(material.material_id, unitPrice),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] })
            setIsUnitPriceModalOpen(false)
            toast.success("Unit price updated successfully")
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || "Failed to update unit price")
        }
    })

    // Update stock quantity mutation
    const updateStockQuantityMutation = useMutation({
        mutationFn: (stockQuantity: number) => materialsApi.updateStockQuantity(material.material_id, stockQuantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] })
            setIsStockQuantityModalOpen(false)
            toast.success("Stock quantity updated successfully")
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || "Failed to update stock quantity")
        }
    })

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: (status: "ACTIVE" | "INACTIVE") => materialsApi.updateStatus(material.material_id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] })
            setIsStatusModalOpen(false)
            toast.success("Status updated successfully")
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || "Failed to update status")
        }
    })

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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Basic Information</h2>
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Material ID</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{material.material_id}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{material.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{material.description}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Additional Information</h2>
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Price</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                ${parseFloat(material.unit_price).toFixed(2)}
                                                <button
                                                    onClick={() => setIsUnitPriceModalOpen(true)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Edit
                                                </button>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Quantity</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {material.stock_quantity}
                                                <button
                                                    onClick={() => setIsStockQuantityModalOpen(true)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Edit
                                                </button>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                                            <dd className="mt-1">
                                                <span
                                                    className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full
                                                        ${material.status === "ACTIVE"
                                                            ? ACTIVE
                                                            : INACTIVE
                                                        }`}
                                                >
                                                    {material.status}
                                                </span>
                                                <button
                                                    onClick={() => setIsStatusModalOpen(true)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Edit
                                                </button>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {new Date(material.created_at).toLocaleString()}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated At</dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {new Date(material.updated_at).toLocaleString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-4">
                                <button
                                    onClick={() => setIsUpdateModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Edit Material
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
    )
}

export default MaterialDetailModal 