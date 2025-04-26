import React, { useState } from 'react';
import Table, { Column } from '@/components/Table';
import { Residents } from '@/types';
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import AddButton from '@/components/AddButton';
import AddResident from '@/components/Residents/AddResidents/AddResidents';
import RemoveResident from '@/components/Residents/RemoveResidents/RemoveResidents';
import ConfirmStatusChangeModal from '@/components/Residents/StatusResidents/ConfirmStatusChangeModal';
import Pagination from '@/components/Pagination';
import { Toaster } from 'react-hot-toast';
import { useAddNewResident } from '@/components/Residents/AddResidents/use-add-new-residents';
import { useRemoveResident } from '@/components/Residents/RemoveResidents/use-remove-residents';
import { FiUserPlus } from 'react-icons/fi';
import { getAllResidents, updateResidentStatus } from '@/services/residents';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import ViewDetailResident from '@/components/Residents/ViewDetailResident';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

interface ResidentsResponse {
  data: Residents[];
  pagination: {
    total: number;
    totalPages: number;
  };
}

const Resident: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState<boolean>(false);
  const [residentToChangeStatus, setResidentToChangeStatus] = useState<Residents | null>(null);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState<boolean>(false);
  const [selectedResident, setSelectedResident] = useState<Residents | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const queryClient = useQueryClient();

  // Fetch residents with React Query
  const { data: residentsResponse, isLoading: isLoadingResidents } = useQuery<ResidentsResponse>({
    queryKey: ['residents', currentPage, itemsPerPage, selectedStatus, searchTerm],
    queryFn: async () => {
      const result = await getAllResidents({
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        status: selectedStatus,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      newStatus,
    }: {
      userId: string;
      newStatus: 'Active' | 'Inactive';
    }) => {
      try {
        const result = await updateResidentStatus(userId, newStatus);
        return { userId, newStatus, result };
      } catch (error: any) {
        // Lấy thông báo lỗi cụ thể từ API (nếu có)
        const errorMessage = error.response?.data?.message || 'Failed to update resident status';
        throw new Error(errorMessage);
      }
    },
    onMutate: async ({ userId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['residents'] });
      const previousResidents = queryClient.getQueryData(['residents']);
      queryClient.setQueryData(['residents'], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((resident: Residents) =>
            resident.userId === userId ? { ...resident, accountStatus: newStatus } : resident
          ),
        };
      });
      return { previousResidents };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousResidents) {
        queryClient.setQueryData(['residents'], context.previousResidents);
      }
      toast.error(error.message || 'Failed to update resident status!');
    },
    onSuccess: data => {
      toast.success(`Resident status updated to ${data.newStatus} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });

  const openStatusChangeModal = (resident: Residents) => {
    setResidentToChangeStatus(resident);
    setIsStatusChangeModalOpen(true);
  };

  const handleChangeStatus = async () => {
    if (!residentToChangeStatus) return;

    const newStatus = residentToChangeStatus.accountStatus === 'Active' ? 'Inactive' : 'Active';
    updateStatusMutation.mutate({
      userId: residentToChangeStatus.userId,
      newStatus: newStatus as 'Active' | 'Inactive',
    });
    setIsStatusChangeModalOpen(false);
    setResidentToChangeStatus(null);
  };

  const {
    isLoading: isAdding,
    isModalOpen,
    openModal,
    closeModal,
    addResident,
  } = useAddNewResident({
    onAddSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });

  const {
    isModalOpen: isRemoveModalOpen,
    isLoading: isRemoving,
    residentToRemove,
    openModal: openRemoveModal,
    closeModal: closeRemoveModal,
    removeResident,
  } = useRemoveResident({
    onRemoveSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });

  const filterOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Active', label: 'Hoạt động' },
    { value: 'Inactive', label: 'Không hoạt động' },
  ];

  const columns: Column<Residents>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      ),
      width: '60px',
    },
    {
      key: 'name',
      title: 'Resident Name',
      render: item => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.username}</div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: item => <div className="text-sm text-gray-500 dark:text-gray-400">{item.email}</div>,
    },
    {
      key: 'phone',
      title: 'Phone',
      render: item => <div className="text-sm text-gray-500 dark:text-gray-400">{item.phone}</div>,
    },
    {
      key: 'Gender',
      title: 'Gender',
      render: item => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.gender === 'Male'
              ? 'bg-[#FBCD17] bg-opacity-35 text-[#FBCD17] border border-[#FBCD17]'
              : 'bg-[#FF6B98] bg-opacity-30 text-[#FF6B98] border border-[#FF6B98]'
          }`}
        >
          {item.gender}
        </span>
      ),
    },
    {
      key: 'Date Of Birth',
      title: 'Date Of Birth',
      render: item => {
        try {
          if (!item.dateOfBirth) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>;
          }

          const date = new Date(item.dateOfBirth);

          if (isNaN(date.getTime())) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">Invalid date</div>;
          }

          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();

          const formattedDate = `${day}/${month}/${year}`;
          return <div className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</div>;
        } catch (error) {
          console.error('Error formatting date:', error);
          return <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>;
        }
      },
    },
    {
      key: 'createdDate',
      title: 'Created Date',
      render: item => {
        try {
          if (!item.createdDate) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>;
          }

          const date = new Date(item.createdDate);

          if (isNaN(date.getTime())) {
            return <div className="text-sm text-gray-500 dark:text-gray-400">Invalid date</div>;
          }

          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();

          const formattedDate = `${day}/${month}/${year}`;
          return <div className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</div>;
        } catch (error) {
          console.error('Error formatting date:', error);
          return <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>;
        }
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: item => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.accountStatus === 'Active'
              ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]'
              : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
          }`}
        >
          {item.accountStatus}
        </span>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      render: item => (
        <DropdownMenu
          onViewDetail={() => handleViewDetail(item)}
          onChangeStatus={() => openStatusChangeModal(item)}
          // onRemove={() => openRemoveModal(item)}
        />
      ),
      width: '80px',
    },
  ];

  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  };

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">Loading residents data...</p>
    </div>
  );

  const handleViewDetail = (resident: Residents) => {
    setSelectedResident(resident);
    setIsViewDetailOpen(true);
  };

  if (isLoadingResidents) {
    return <LoadingIndicator />;
  }

  if (!residentsResponse?.data || residentsResponse.data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-700 dark:text-gray-300">No residents found.</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-[30px] md:mt-[60px] px-3 sm:px-4 md:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <SearchInput
          placeholder="Search by name, email or phone"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-[20rem] max-w-full md:max-w-xs"
        />
      </div>

      <div className="w-full overflow-x-auto">
        <Table<Residents>
          data={residentsResponse?.data || []}
          columns={columns}
          keyExtractor={item => item.userId}
          onRowClick={item => console.log('Row clicked:', item)}
          className="w-full"
          tableClassName="w-full min-w-[750px]"
          isLoading={isLoadingResidents}
          emptyText="cannot find data"
        />
      </div>

      <div className="w-full mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={residentsResponse?.pagination.totalPages || 1}
          onPageChange={setCurrentPage}
          totalItems={residentsResponse?.pagination.total || 0}
          itemsPerPage={itemsPerPage}
          onLimitChange={setItemsPerPage}
        />
      </div>

      {/* <AddResident
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={handleAddResident}
        isLoading={isAdding}
      /> */}
      <ConfirmStatusChangeModal
        isOpen={isStatusChangeModalOpen}
        onClose={() => setIsStatusChangeModalOpen(false)}
        onConfirm={handleChangeStatus}
        resident={residentToChangeStatus}
      />
      {/* <RemoveResident
        isOpen={isRemoveModalOpen}
        onClose={closeRemoveModal}
        onConfirm={removeResident}
        isLoading={isRemoving}
        resident={residentToRemove}
      /> */}
      <ViewDetailResident
        isOpen={isViewDetailOpen}
        onClose={() => setIsViewDetailOpen(false)}
        resident={selectedResident}
      />
    </div>
  );
};

export default Resident;
