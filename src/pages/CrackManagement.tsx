import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Table, { Column } from '@/components/Table';
import { mockCracks } from '@/mock/mockDataCrack';
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import { Crack } from '@/types';

// Define the Crack type


const CrackManagement: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cracks, setCracks] = useState<Crack[]>(mockCracks);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const columns: Column<Crack>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => <span className="text-sm text-gray-500">{index + 1}</span>,
      width: '60px'
    },
    {
      key: 'id',
      title: 'Crack ID',
      render: (item) => <span className="text-sm text-gray-500">{item.id}</span>
    },
    {
      key: 'reportDescription',
      title: 'Report Description',
      render: (item) => <span className="text-sm font-medium text-gray-900">{item.reportDescription}</span>
    },
    {
      key: 'residentName',
      title: 'Reported By',
      render: (item) => <span className="text-sm text-gray-500">{item.residentName}</span>
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
          item.status === 'resolved' 
            ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]' 
            : item.status === 'in_progress'
              ? 'bg-[rgba(255,165,0,0.3)] text-[#ff9900] border border-[#ffa500]'
              : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
        }`}>
          {item.status === 'resolved' 
            ? 'Resolved' 
            : item.status === 'in_progress' 
              ? 'In Progress' 
              : 'Pending'}
        </span>
      )
    },
    {
      key: 'action',
      title: 'Action',
      render: (item) => (
        <DropdownMenu 
          onViewDetail={() => navigate(`/crack/detail/${item.id}`)} // Navigate to the detail page
          onChangeStatus={() => console.log("Change Status", item)}
          onRemove={() => console.log("Remove", item)}
        />
      ),
      width: '80px',
    }
  ];

  return (
    <div className="w-full mt-[60px]">
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
      </div>
      
      <Table<Crack>
        data={cracks}
        columns={columns}
        keyExtractor={(item) => item.id}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
      />
    </div>
  );
};

export default CrackManagement;