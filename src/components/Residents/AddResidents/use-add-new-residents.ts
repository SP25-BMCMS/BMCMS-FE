import { useState } from 'react';
import toast from 'react-hot-toast';
import { Residents } from '@/types';

interface UseAddNewResidentProps {
  onAddSuccess?: (newResident: Residents) => void;
}

interface AddResidentData {
  fullName: string;
  dateOfBirth: Date | null | string;
  createdDate: string;
  role: string;
  area: string;
  status: 'active' | 'inactive';
  gender: string;
}

export const useAddNewResident = (props?: UseAddNewResidentProps) => {
  const { onAddSuccess } = props || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const addResident = async (data: AddResidentData) => {
    setIsLoading(true);

    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.fullName || !data.area) {
        toast.error('Vui lòng điền đầy đủ thông tin cần thiết!');
        setIsLoading(false);
        return null;
      }

      // Tạo ID mới (thông thường sẽ được tạo từ server)
      const newId = `RES${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`;

      // Tạo resident mới
      const newResident: Residents = {
        id: newId,
        name: data.fullName,
        createdDate: data.createdDate,
        status: data.status,
        // Thêm các trường khác nếu cần
      };

      // Giả lập API call - đây là nơi bạn sẽ gọi API thực tế
      await new Promise(resolve => setTimeout(resolve, 500));

      // Hiển thị thông báo thành công
      toast.success('Thêm cư dân mới thành công!');

      // Đóng modal
      closeModal();

      // Gọi callback nếu có
      if (onAddSuccess) {
        onAddSuccess(newResident);
      }

      setIsLoading(false);
      return newResident;
    } catch (error) {
      // Xử lý lỗi
      console.error('Lỗi khi thêm cư dân:', error);
      toast.error('Có lỗi xảy ra khi thêm cư dân mới!');
      setIsLoading(false);
      return null;
    }
  };

  return {
    isLoading,
    isModalOpen,
    openModal,
    closeModal,
    addResident,
  };
};
