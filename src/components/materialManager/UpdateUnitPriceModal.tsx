import React, { useState } from "react"
import { Dialog } from "@headlessui/react"
import { Material } from "@/services/materials"

interface UpdateUnitPriceModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (unitPrice: string) => void
    material: Material
    isLoading: boolean
}

const UpdateUnitPriceModal: React.FC<UpdateUnitPriceModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    material,
    isLoading,
}) => {
    const [unitPrice, setUnitPrice] = useState(material.unit_price)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(unitPrice)
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-sm rounded bg-white dark:bg-gray-800 p-6">
                    <Dialog.Title className="text-lg font-medium mb-4">
                        Update Unit Price
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Unit Price
                            </label>
                            <input
                                type="number"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                                min="0"
                                step="1000"
                                title="Unit price"
                                placeholder="Enter unit price"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Updating..." : "Update"}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}

export default UpdateUnitPriceModal 