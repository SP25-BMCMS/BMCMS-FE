import React, { useState, useEffect } from 'react';
import Table, { Column } from '@/components/Table';
import { Residents } from '@/types';
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import AddButton from '@/components/AddButton';
import AddResident from '@/components/Residents/AddResidents/AddResidents';
import RemoveResident from '@/components/Residents/RemoveResidents/RemoveResidents';
import { Toaster } from 'react-hot-toast';
import { useAddNewResident } from '@/components/Residents/AddResidents/use-add-new-residents';
import { useRemoveResident } from '@/components/Residents/RemoveResidents/use-remove-residents';
import { FiUserPlus } from "react-icons/fi";
import { getAllResidents } from '@/services/residents';

const Resident: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [residents, setResidents] = useState<Residents[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch residents data
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoading(true);
        const data = await getAllResidents();
        
        // Chuyển đổi dữ liệu từ API sang định dạng hiển thị
        const formattedResidents = data.map(resident => ({
          ...resident,
          id: resident.userId, // Sử dụng userId làm id
          name: resident.username, // Sử dụng username làm name
          createdDate: new Date().toLocaleDateString(), // Nếu API không có createdDate
        }));
        
        setResidents(formattedResidents);
      } catch (err) {
        setError('Failed to fetch residents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);
  
  // Các hook và state khác giữ nguyên
  const { 
    isLoading, 
    isModalOpen, 
    openModal, 
    closeModal, 
    addResident 
  } = useAddNewResident({
    onAddSuccess: (newResident) => {
      setResidents([...residents, newResident]);
    }
  });

  const {
    isModalOpen: isRemoveModalOpen,
    isLoading: isRemoving,
    residentToRemove,
    openModal: openRemoveModal,
    closeModal: closeRemoveModal,
    removeResident
  } = useRemoveResident({
    onRemoveSuccess: (removedResidentId) => {
      setResidents(residents.filter(r => r.userId !== removedResidentId));
    }
  });

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const columns: Column<Residents>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => <span className="text-sm text-gray-500">{index + 1}</span>,
      width: '60px'
    },
    {
      key: 'name',
      title: 'Resident Name',
      render: (item) => <span className="text-sm font-medium text-gray-900">{item.username}</span>
    },
    {
      key: 'email',
      title: 'Email',
      render: (item) => <span className="text-sm text-gray-500">{item.email}</span>
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (item) => <span className="text-sm text-gray-500">{item.phone}</span>
    },
    {
      key: 'Gender',
      title: 'Gender',
      render: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.gender === "Male"
              ? "bg-[#FBCD17] bg-opacity-35 text-[#FBCD17] border border-[#FBCD17]"
              : "bg-[#360AFE] bg-opacity-30 text-[#360AFE] border border-[#360AFE]"
          }`}
        >
          {item.gender}
        </span>
      ),
    },
    {
      key: 'Date Of Birth',
      title: 'Date Of Birth',
      render: (item) => {
        try {
          
          const dateParts = item.dateOfBirth.split(' ');
          const day = dateParts[2];
          const month = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          }[dateParts[1]];
          const year = dateParts[3];
          
          
          const formattedDate = `${day}/${month}/${year}`;
          return <span className="text-sm text-gray-500">{formattedDate}</span>;
        } catch (error) {
          return <span className="text-sm text-gray-500">{item.dateOfBirth}</span>;
        }
      }
    },
    
    {
      key: 'createdDate',
      title: 'Created Date',
      render: (item) => <span className="text-sm text-gray-500">{item.createdDate}</span>
    },
    // {
    //   key: 'status',
    //   title: 'Status',
    //   render: (item) => (
    //     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
    //       (item.status === 'active') 
    //         ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]' 
    //         : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
    //     }`}>
    //       {(item.status === 'active') ? 'Active' : 'Inactive'}
    //     </span>
    //   )
    // },
    {
      key: 'action',
      title: 'Action',
      render:(item) => (
        <DropdownMenu 
          onViewDetail={() => console.log('View detail clicked')}
          onChangeStatus={() => console.log("Change Status", item)}
          onRemove={() => openRemoveModal(item)}
        />
      ),
      width: '80px',
    }
  ];

  // Handle submission from the AddResident component
  const handleAddResident = async (residentData: any) => {
    await addResident(residentData);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full mt-[60px]">
      <Toaster position="top-right" />
      
      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        <SearchInput 
          placeholder="Search by ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[20rem] max-w-xs"
        />
        
        <FilterDropdown 
          options={filterOptions}
          onSelect={(value) => console.log('Selected filter:', value)}
        />
        
        <AddButton 
          label="Add User"
          icon={<FiUserPlus />}
          onClick={openModal}
        />
      </div>
      
      <Table<Residents>
        data={residents}
        columns={columns}
        keyExtractor={(item) => item.userId}
        onRowClick={(item) => console.log('Row clicked:', item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
      />
      
      <AddResident 
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={handleAddResident}
        isLoading={isLoading}
      />
      
      <RemoveResident 
        isOpen={isRemoveModalOpen}
        onClose={closeRemoveModal}
        onConfirm={removeResident}
        isLoading={isRemoving}
        resident={residentToRemove}
      />
    </div>
  );
};

export default Resident;
