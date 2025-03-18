import React, { useState } from "react";
import Modal from "./Modal";
import { addNewArea } from "@/services/areas";
import toast from 'react-hot-toast';

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
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    if (!formData.name.trim()) {
      toast.error("Area name is required!");
      setIsLoading(false);
      return;
    }

    try {
      await addNewArea({
        name: formData.name,
        description: formData.description
      });

      toast.success("Add area successfully!");

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Area">
      <div className="p-6 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Name Areas
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter area name"
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Created Date
            </label>
            <input
              type="text"
              name="createdDate"
              value={formData.createdDate}
              onChange={handleChange}
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              readOnly
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter area description"
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-red-600 underline hover:text-red-700"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Add"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddAreaModal;
