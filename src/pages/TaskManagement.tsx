
import React, { useState } from 'react';
import Table, { Column } from '@/components/Table';
import { mockTasks } from '@/mock/mockDataTask';
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import AddButton from '@/components/AddButton';

// Define the Task type (using your provided interface)
type Task = {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  createdAt: string;
};

const TaskManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const columns: Column<Task>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => <span className="text-sm text-gray-500">{index + 1}</span>,
      width: '60px'
    },
    {
      key: 'id',
      title: 'Task ID',
      render: (item) => <span className="text-sm text-gray-500">{item.id}</span>
    },
    {
      key: 'title',
      title: 'Task Title',
      render: (item) => <span className="text-sm font-medium text-gray-900">{item.title}</span>
    },
    {
      key: 'assignedTo',
      title: 'Assigned To',
      render: (item) => <span className="text-sm text-gray-500">{item.assignedTo}</span>
    },
    {
      key: 'createdAt',
      title: 'Created Date',
      render: (item) => <span className="text-sm text-gray-500">{item.createdAt}</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.status === 'completed' 
            ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]' 
            : item.status === 'in_progress'
              ? 'bg-[rgba(255,193,7,0.3)] text-[#ffc107] border border-[#ffc107]'
              : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
        }`}>
          {item.status === 'completed' 
            ? 'Completed' 
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
          onViewDetail={() => console.log('View detail clicked')}
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
        
        <AddButton 
          label="Add Task"
          className='w-[154px]'
          onClick={() => console.log('Add Task clicked')}
        />
      </div>
      
      <Table<Task>
        data={tasks}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        onRowClick={(item) => console.log('Row clicked:', item)}
        className="w-[95%] mx-auto"
        tableClassName="w-full"
      />
    </div>
  );
};

export default TaskManagement;