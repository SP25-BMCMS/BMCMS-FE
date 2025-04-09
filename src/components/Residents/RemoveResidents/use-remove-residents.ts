import { useState } from 'react';
import { Residents } from '@/types';
import toast from 'react-hot-toast';

interface UseRemoveResidentProps {
  onRemoveSuccess?: (removedResidentId: string) => void;
}

export const useRemoveResident = ({ onRemoveSuccess }: UseRemoveResidentProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [residentToRemove, setResidentToRemove] = useState<Residents | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const openModal = (resident: Residents) => {
    setResidentToRemove(resident);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResidentToRemove(null);
  };

  const removeResident = async () => {
    if (!residentToRemove) return;
    
    setIsLoading(true);
    
    try {
      // Giả lập API call để xóa resident
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gọi callback khi xóa thành công
      if (onRemoveSuccess) {
        onRemoveSuccess(residentToRemove.id);
      }
      
      toast.success('Xóa khách hàng thành công!');
      closeModal();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa khách hàng!');
      console.error('Error removing resident:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isModalOpen,
    isLoading,
    residentToRemove,
    openModal,
    closeModal,
    removeResident
  };
};