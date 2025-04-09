import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Material } from '@/services/materials';
import { useTheme } from '@/contexts/ThemeContext';
import { X, DollarSign, Layers, FileText, Package, Activity } from 'lucide-react';
import { ACTIVE, INACTIVE } from '@/constants/colors';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Material, 'materialId' | 'createdAt' | 'updatedAt'>) => void;
  isLoading: boolean;
}

const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitPrice: 0,
    stockQuantity: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE', // Default status
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Add keyframes for animations
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes fieldFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes dropdownFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes arrowSpin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(180deg);
                }
            }

            @keyframes arrowSpinReverse {
                from {
                    transform: rotate(180deg);
                }
                to {
                    transform: rotate(0deg);
                }
            }

            .arrow-spin {
                animation: arrowSpin 0.3s ease forwards;
            }

            .arrow-spin-reverse {
                animation: arrowSpinReverse 0.3s ease forwards;
            }
        `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Transform the form data to match the expected Material format
    const materialData = {
      name: formData.name,
      description: formData.description,
      unit_price: formData.unitPrice.toString(),
      stock_quantity: formData.stockQuantity,
      status: formData.status,
    };
    onSubmit(materialData as any);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown') && showStatusDropdown) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="mx-auto w-full max-w-xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl my-4"
          style={{
            animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New Material
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              className="animate-in"
              style={{ animation: 'fieldFadeIn 0.3s ease-out forwards', animationDelay: '0.05s' }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Material Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  required
                  title="Material name"
                  placeholder="Enter material name"
                />
              </div>
            </div>

            <div
              className="animate-in"
              style={{ animation: 'fieldFadeIn 0.3s ease-out forwards', animationDelay: '0.1s' }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none transition-colors"
                  rows={4}
                  required
                  title="Material description"
                  placeholder="Enter material description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="animate-in"
                style={{ animation: 'fieldFadeIn 0.3s ease-out forwards', animationDelay: '0.15s' }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={e =>
                      setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    min="0"
                    step="0.01"
                    required
                    title="Unit price"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div
                className="animate-in"
                style={{ animation: 'fieldFadeIn 0.3s ease-out forwards', animationDelay: '0.2s' }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Quantity
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Layers className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={e =>
                      setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })
                    }
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    min="0"
                    required
                    title="Stock quantity"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Status dropdown */}
            <div
              className="animate-in"
              style={{ animation: 'fieldFadeIn 0.3s ease-out forwards', animationDelay: '0.25s' }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div
                className="relative status-dropdown"
                style={{
                  marginBottom: showStatusDropdown ? '120px' : '0px',
                  transition: 'margin-bottom 0.3s',
                }}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Activity className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div
                  className="flex items-center justify-between w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        formData.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span>{formData.status}</span>
                  </div>
                  <svg
                    className={showStatusDropdown ? 'arrow-spin' : 'arrow-spin-reverse'}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {showStatusDropdown && (
                  <div
                    className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    style={{
                      animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, status: 'ACTIVE' });
                          setShowStatusDropdown(false);
                        }}
                        className={`flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 ${
                          formData.status === 'ACTIVE'
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span
                          className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full mr-2 ${ACTIVE}`}
                        >
                          ACTIVE
                        </span>
                        <span>Available for use</span>
                        {formData.status === 'ACTIVE' && (
                          <svg
                            className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, status: 'INACTIVE' });
                          setShowStatusDropdown(false);
                        }}
                        className={`flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 ${
                          formData.status === 'INACTIVE'
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span
                          className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full mr-2 ${INACTIVE}`}
                        >
                          INACTIVE
                        </span>
                        <span>Not available for use</span>
                        {formData.status === 'INACTIVE' && (
                          <svg
                            className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700"
              style={{ animation: 'fieldFadeIn 0.3s ease-out forwards', animationDelay: '0.3s' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Material'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreateMaterialModal;
