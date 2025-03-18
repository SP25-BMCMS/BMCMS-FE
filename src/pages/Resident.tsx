import React, { useState } from 'react';
import Table, {Column} from '@/components/Table';
import { Residents } from '@/types';
import { mockResidents } from '@/mock/mockData';
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

const Resident: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [residents, setResidents] = useState<Residents[]>(mockResidents);
  
  // Use the hook for adding residents
  const { 
    isLoading, 
    isModalOpen, 
    openModal, 
    closeModal, 
    addResident 
  } = useAddNewResident({
    onAddSuccess: (newResident) => {
      // Update the residents state when a new resident is successfully added
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
      // Cập nhật danh sách residents khi xóa thành công
      setResidents(residents.filter(r => r.id !== removedResidentId));
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
      key: 'id',
      title: 'Customer ID',
      render: (item) => <span className="text-sm text-gray-500">{item.id}</span>
    },
    {
      key: 'name',
      title: 'Customer Name',
      render: (item) => <span className="text-sm font-medium text-gray-900">{item.name}</span>
    },
    {
      key: 'createdDate',
      title: 'Created Date',
      render: (item) => <span className="text-sm text-gray-500">{item.createdDate}</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.status === 'active' 
            ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]' 
            : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
        }`}>
          {item.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
        key: 'action',
        title: 'Action',
        render:(item) =>(
            <DropdownMenu 
            onViewDetail={()=> console.log('View detail clicked')}
            onChangeStatus={()=> console.log("Change Status", item)}
            onRemove={()=> openRemoveModal(item)}/>
        ),
        width: '80px',
    }
  ];

  // Handle submission from the AddResident component
  const handleAddResident = async (residentData: any) => {
    await addResident(residentData);
  };

  return (
    <div className="w-full mt-[60px]">
      {/* Add Toast container */}
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
          onClick={openModal} // Use the openModal function from the hook
        />
      </div>
      
      <Table<Residents>
        data={residents} // Use the state residents instead of mockResidents
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => console.log('Row clicked:', item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
      />
      
      <AddResident 
        isOpen={isModalOpen} // Use the state from the hook
        onClose={closeModal} // Use the closeModal function from the hook
        onAdd={handleAddResident}
        isLoading={isLoading} // Pass loading state to show loading indicator
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