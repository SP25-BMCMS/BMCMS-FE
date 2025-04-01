import React, { useState } from "react";
import { addNewArea } from "@/services/areas";
import toast from 'react-hot-toast';
import { Loader2 } from "lucide-react";

interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isLoading?: boolean;
}

const AddAreaModal: React.FC<AddAreaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    createdDate: new Date().toLocaleDateString("en-CA"),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Area name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await addNewArea({
        name: formData.name,
        description: formData.description
      });

      toast.success("Area added successfully!");

      setFormData({
        name: "",
        description: "",
        createdDate: new Date().toLocaleDateString("en-CA"),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error adding area:", err);
      toast.error("Error adding new area!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-[600px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Add New Area</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in the information below to add a new area</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Area Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter area name"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                  errors.name ? "border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20" : "border-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Created Date
              </label>
              <input
                type="text"
                name="createdDate"
                value={formData.createdDate}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
                         bg-gray-50 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                disabled
              />
            </div>

            {/* Description - Full Width */}
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter area description"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                  errors.description ? "border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-20" : "border-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                rows={4}
              />
              {errors.description && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Add Area"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAreaModal;
