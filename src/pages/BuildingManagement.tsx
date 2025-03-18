import React, { useState, useEffect } from 'react';
import Table, { Column } from '@/components/Table';
import { mockBuildings } from '@/mock/mockDataBuiding';
import { getAreaList } from '@/services/areas';
import { PiMapPinAreaBold } from "react-icons/pi";
import { FaRegBuilding } from "react-icons/fa";
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import AddButton from '@/components/AddButton';
import AddAreaModal from '@/components/BuildingManager/areas/addAreas/AddAreaModal';

// Define the Building type
export type Building = {
  id: string;
  name: string;
  createdDate: string;
  status: 'under_construction' | 'operational';
};

const Building: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [buildings, setBuildings] = useState<Building[]>(mockBuildings);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch areas when component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        await getAreaList();
        // Nếu bạn muốn hiển thị danh sách area, bạn có thể lưu chúng vào state
        // setAreas(areaList);
      } catch (error) {
        console.error('Failed to fetch areas:', error);
      }
    };

    fetchAreas();
  }, [refreshTrigger]);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'operational', label: 'Operational' },
    { value: 'under_construction', label: 'Under Construction' },
  ];

  const columns: Column<Building>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => <span className="text-sm text-gray-500">{index + 1}</span>,
      width: '60px'
    },
    {
      key: 'id',
      title: 'Building ID',
      render: (item) => <span className="text-sm text-gray-500">{item.id}</span>
    },
    {
      key: 'name',
      title: 'Building Name',
      render: (item) => <span className="text-sm font-medium text-gray-900">{item.name}</span>
    },
    {
      key: 'createdDate',
      title: 'Created Date',
      render: (item) => (
        <span className="text-sm text-gray-500">
          {item.status === 'under_construction' ? '--/--/----' : item.createdDate}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.status === 'operational' 
            ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]' 
            : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
        }`}>
          {item.status === 'operational' ? 'Operational' : 'Under Construction'}
        </span>
      )
    },
    {
      key: 'action',
      title: 'Action',
      render: (item) => (
        <DropdownMenu 
          onViewDetail={() => console.log('View detail clicked')}
          onChangeStatus={() => console.log("Change Status", item)}
          onRemove={() => console.log("Remove", item)}
        />
      ),
      width: '80px',
    }
  ];

  const handleAddAreaSuccess = () => {
    // Trigger a refresh of the area list
    setRefreshTrigger(prev => prev + 1);
  };

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
        
        <AddButton
          label='Add Area'
          className='w-[154px]'
          icon={<PiMapPinAreaBold/>}
          onClick={() => setIsAddAreaModalOpen(true)}
        />
        <AddButton 
          label="Add Building"
          icon={<FaRegBuilding />}
          className='w-[154px]'
          onClick={() => console.log('Add Building clicked')}
        />
      </div>
      
      <Table<Building>
        data={buildings}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => console.log('Row clicked:', item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
      />

      {/* Add Area Modal */}
      <AddAreaModal 
        isOpen={isAddAreaModalOpen}
        onClose={() => setIsAddAreaModalOpen(false)}
        onSuccess={handleAddAreaSuccess}
      />
    </div>
  );
};

export default Building;
