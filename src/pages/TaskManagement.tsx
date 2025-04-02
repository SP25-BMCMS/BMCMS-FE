import React, { useState, useEffect } from 'react';
import Table, { Column } from '@/components/Table';
import DropdownMenu from '@/components/DropDownMenu';
import SearchInput from '@/components/SearchInput';
import FilterDropdown from '@/components/FilterDropdown';
import AddButton from '@/components/AddButton';
import { MdOutlineAddTask } from "react-icons/md";
import { motion } from "framer-motion";
import tasksApi from '@/services/tasks';
import { TaskResponse } from '@/types';
import Pagination from '@/components/Pagination';

// Define the Task type (using your provided interface)

const TaskManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Fetch tasks data
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await tasksApi.getTasks({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
        });
        
        setTasks(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [currentPage, itemsPerPage, searchTerm]);
  
  // Loading animation
  const loadingVariants = {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  };

  const LoadingIndicator = () => (
    <div className="flex flex-col justify-center items-center h-64">
      <motion.div
        animate={loadingVariants}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner mb-4"
      />
      <p className="text-gray-700 dark:text-gray-300">Loading tasks data...</p>
    </div>
  );

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
  ];
  
  const handleFilterChange = (value: string) => {
    // Reset to first page when changing filters
    setCurrentPage(1);
    // TODO: Implement filter by status if needed
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const columns: Column<TaskResponse>[] = [
    {
      key: 'index',
      title: 'No',
      render: (_, index) => <div className="text-sm text-gray-500 dark:text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</div>,
      width: '60px'
    },
    {
      key: 'task_id',
      title: 'Task ID',
      render: (item) => <div className="text-sm text-gray-500 dark:text-gray-400">{item.task_id.substring(0, 8)}</div>
    },
    {
      key: 'description',
      title: 'Description',
      render: (item) => <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</div>
    },
    {
      key: 'crack_id',
      title: 'Crack ID',
      render: (item) => <div className="text-sm text-gray-500 dark:text-gray-400">{item.crack_id.substring(0, 8)}</div>
    },
    {
      key: 'created_at',
      title: 'Created Date',
      render: (item) => <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleDateString()}</div>
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.status === 'Completed' 
            ? 'bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]' 
            : item.status === 'In Progress'
              ? 'bg-[rgba(255,193,7,0.3)] text-[#ffc107] border border-[#ffc107]'
              : 'bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]'
        }`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'action',
      title: 'Action',
      render: (item) => (
        <DropdownMenu 
          onViewDetail={() => console.log('View detail clicked', item)}
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="w-[20rem] max-w-xs"
        />
        
        <FilterDropdown 
          options={filterOptions}
          onSelect={handleFilterChange}
        />
        
        <AddButton 
          label="Add Task"
          icon={<MdOutlineAddTask />}
          className='w-[154px]'
          onClick={() => console.log('Add Task clicked')}
        />
      </div>
      
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          <Table<TaskResponse>
            data={tasks}
            columns={columns}
            keyExtractor={(item) => item.task_id}
            onRowClick={(item) => console.log('Row clicked:', item)}
            className="w-[95%] mx-auto"
            tableClassName="w-full"
          />
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onLimitChange={handleLimitChange}
            className="w-[95%] mx-auto mt-4"
          />
        </>
      )}
    </div>
  );
};

export default TaskManagement;