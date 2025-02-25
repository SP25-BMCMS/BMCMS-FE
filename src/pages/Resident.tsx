import React, { useState } from 'react';
import Table, { Column } from '@/components/table';
import { Residents } from '@/types';
import { mockResidents } from '@/mock/mockData';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import AddButton from '@/components/AddButton';


const Resident: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  
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
      key: 'actions',
      title: 'Actions',
      render: () => (
        <div className="text-right">
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
            </svg>
          </button>
        </div>
      ),
      width: '80px'
    }
  ];

  return (
    <div className="w-full mt-[60px]">
      <div className="flex justify-between mb-4 ml-[90px] mr-[132px]">
        {/* Phần Search - sử dụng component SearchInput */}
        <SearchInput 
          placeholder="Search by ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[20rem] max-w-xs"
        />
        
        {/* Phần Filter - sử dụng component FilterDropdown */}
        <FilterDropdown 
          options={filterOptions}
          onSelect={(value) => console.log('Selected filter:', value)}
        />
        
        {/* Nút Add User - sử dụng component AddButton */}
        <AddButton 
          label="Add User"
          onClick={() => console.log('Add user clicked')}
        />
      </div>
      
      {/* Sử dụng component Table */}
      <Table<Residents>
        data={mockResidents}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => console.log('Row clicked:', item)}
        className="w-[95%] mx-auto" // Điều chỉnh độ rộng của container bao quanh bảng
        tableClassName="w-full" // Điều chỉnh độ rộng của bảng
      />
    </div>
  );
};

export default Resident;