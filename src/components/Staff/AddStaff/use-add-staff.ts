import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { addStaff, AddStaffData } from '@/services/staffs';
import { useTranslation } from 'react-i18next';

interface UseAddStaffProps {
  onAddSuccess?: (newStaff: any) => void;
}

export const useAddStaff = ({ onAddSuccess }: UseAddStaffProps = {}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const addNewStaff = async (staffData: AddStaffData) => {
    setIsLoading(true);
    try {
      const response = await addStaff(staffData);

      toast.success(t('staffManagement.addStaff.messages.success'));
      closeModal();

      if (onAddSuccess) {
        onAddSuccess(response.data);
      }

      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('staffManagement.addStaff.messages.error');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isModalOpen,
    isLoading,
    openModal,
    closeModal,
    addNewStaff,
  };
};
