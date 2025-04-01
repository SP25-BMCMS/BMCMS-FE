import { useState } from "react";
import { toast } from "react-hot-toast";
import { addStaff, AddStaffData } from "@/services/staffs";

interface UseAddStaffProps {
  onAddSuccess?: (newStaff: any) => void;
}

export const useAddStaff = ({ onAddSuccess }: UseAddStaffProps = {}) => {
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
      
      toast.success("Add new staff successfully!");
      closeModal();
      
      if (onAddSuccess) {
        onAddSuccess(response.data);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Something went wrong!";
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