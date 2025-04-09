import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Material } from '@/services/materials';
import { useTheme } from '@/contexts/ThemeContext';
import { ACTIVE, INACTIVE } from '@/constants/colors';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: 'ACTIVE' | 'INACTIVE') => void;
  material: Material;
  isLoading: boolean;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  material,
  isLoading,
}) => {
  const { theme } = useTheme();
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(material.status);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(status);
  };

  // Add keyframes to the document for animations
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    // Add keyframe animations
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
      
      @keyframes selectFadeIn {
        from {
          opacity: 0;
          border-color: transparent;
        }
        to {
          opacity: 1;
          border-color: #e5e7eb;
        }
      }

      @keyframes smoothPulse {
        0% {
          opacity: 0.6;
          transform: scale(0.95);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
        }
        100% {
          opacity: 0.6;
          transform: scale(0.95);
        }
      }
      
      @keyframes checkmarkFadeIn {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
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
    // Append to document head
    document.head.appendChild(styleElement);

    // Cleanup on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="mx-auto w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl"
          style={{
            animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'center',
          }}
        >
          <Dialog.Title className="text-xl font-medium mb-6 text-gray-900 dark:text-white">
            Update Status
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                Material: <span className="font-bold">{material.name}</span>
              </label>

              <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
                Current Status:
                <span
                  className={`ml-2 px-3 py-1 text-xs leading-5 font-semibold rounded-full inline-flex items-center
                    ${material.status === 'ACTIVE' ? ACTIVE : INACTIVE}`}
                >
                  {material.status}
                </span>
              </label>

              <div className="mt-4 w-full">
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Status
                </label>
                <div className="relative" onClick={() => setShowDropdown(!showDropdown)}>
                  <div
                    className="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
                    style={{
                      animation: 'selectFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ animation: 'smoothPulse 2s ease-in-out infinite' }}
                      ></span>
                      <span>{status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                    </div>

                    <svg
                      className={showDropdown ? 'arrow-spin' : 'arrow-spin-reverse'}
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

                  {showDropdown && (
                    <div
                      className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700 overflow-hidden"
                      style={{
                        animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      }}
                    >
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setStatus('ACTIVE');
                            setShowDropdown(false);
                          }}
                          className={`flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 ${
                            status === 'ACTIVE'
                              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                          <span>Active</span>
                          {status === 'ACTIVE' && (
                            <svg
                              className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{
                                animation:
                                  'checkmarkFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                              }}
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
                          onClick={e => {
                            e.stopPropagation();
                            setStatus('INACTIVE');
                            setShowDropdown(false);
                          }}
                          className={`flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 ${
                            status === 'INACTIVE'
                              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                          <span>Inactive</span>
                          {status === 'INACTIVE' && (
                            <svg
                              className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{
                                animation:
                                  'checkmarkFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                              }}
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
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md 
                          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                          dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 
                          transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md 
                          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                          disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default UpdateStatusModal;
