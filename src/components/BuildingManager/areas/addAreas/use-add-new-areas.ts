// hooks/useAddNewArea.ts
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Area } from '@/types';
import { addNewArea } from '@/services/areas';

interface UseAddNewAreaProps {
  onAddSuccess?: (newArea: Area) => void;
}

interface AddAreaData {
  name: string;
  description: string;
  createdDate?: string;
}

export const useAddNewArea = (props?: UseAddNewAreaProps) => {
  const { onAddSuccess } = props || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const addArea = async (data: AddAreaData) => {
    setIsLoading(true);

    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.name) {
        toast.error('Area name is required!');
        setIsLoading(false);
        return null;
      }

      // Gọi API để thêm khu vực mới
      const response = await addNewArea({
        name: data.name,
        description: data.description || ''
      });
      
      // Hiển thị thông báo thành công
      toast.success('Add area successfully!');
      
      // Đóng modal
      closeModal();
      
      // Gọi callback nếu có
      if (onAddSuccess) {
        onAddSuccess(response);
      }
      
      setIsLoading(false);
      return response;
    } catch (error) {
      // Xử lý lỗi
      console.error('Error adding new area:', error);
      toast.error('Error adding new area!');
      setIsLoading(false);
      return null;
    }
  };

  return {
    isLoading,
    isModalOpen,
    openModal,
    closeModal,
    addArea
  };
};
