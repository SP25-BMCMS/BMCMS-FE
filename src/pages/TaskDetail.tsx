import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import tasksApi from '@/services/tasks'
import { motion } from 'framer-motion'
import { FORMAT_DATE_TIME } from '@/utils/helpers'
import { STATUS_COLORS } from '@/constants/colors'
import { IoArrowBack } from 'react-icons/io5'
import { FaClipboardList, FaUser, FaCalendarAlt, FaCheckCircle, FaExchangeAlt, FaTools, FaCheck } from 'react-icons/fa'

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()

  // Fetch task details and assignments
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['taskAssignments', taskId],
    queryFn: () => tasksApi.getTaskAssignmentsByTaskId(taskId || ''),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!taskData || !taskId) {
    return (
      <div className="p-6 w-full">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Unable to load job information. Please try again later.</p>
        </div>
      </div>
    )
  }

  const task = taskData.data
  
  // Group assignments by status
  const assignmentsByStatus = {
    Confirmed: task.taskAssignments.filter(a => a.status === 'Confirmed'),
    Reassigned: task.taskAssignments.filter(a => a.status === 'Reassigned'),
    InFixing: task.taskAssignments.filter(a => a.status === 'InFixing'),
    Fixed: task.taskAssignments.filter(a => a.status === 'Fixed')
  }

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return STATUS_COLORS.IN_PROGRESS
      case 'Reassigned':
        return STATUS_COLORS.REVIEWING
      case 'InFixing':
        return STATUS_COLORS.PENDING
      case 'Fixed':
        return STATUS_COLORS.RESOLVED
      default:
        return STATUS_COLORS.PENDING
    }
  }

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <FaCheckCircle className="text-[#360AFE]" />
      case 'Reassigned':
        return <FaExchangeAlt className="text-[#5856D6]" />
      case 'InFixing':
        return <FaTools className="text-[#FFA500]" />
      case 'Fixed':
        return <FaCheck className="text-[#50F186]" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 w-full bg-gray-50 dark:bg-gray-800 min-h-screen">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/tasks')} 
          className="mr-4 p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition"
        >
          <IoArrowBack className="text-xl" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">Task Assignment</h1>
      </div>

      {/* Task details card */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center mb-2">
              <FaClipboardList className="mr-2 text-blue-500" />
              <h2 className="text-xl font-semibold dark:text-white">{task.description}</h2>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
              <span className="mr-4">ID: {task.task_id}</span>
              {task.crack_id && <span>Crack ID: {task.crack_id}</span>}
            </div>
          </div>
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: 
                task.status === 'Resolved' ? STATUS_COLORS.RESOLVED.BG :
                task.status === 'In Progress' ? STATUS_COLORS.IN_PROGRESS.BG :
                task.status === 'Assigned' ? STATUS_COLORS.INACTIVE.BG :
                STATUS_COLORS.REVIEWING.BG,
              color: 
                task.status === 'Resolved' ? STATUS_COLORS.RESOLVED.TEXT :
                task.status === 'In Progress' ? STATUS_COLORS.IN_PROGRESS.TEXT :
                task.status === 'Assigned' ? STATUS_COLORS.INACTIVE.TEXT :
                STATUS_COLORS.REVIEWING.TEXT,
              border: '1px solid',
              borderColor: 
                task.status === 'Resolved' ? STATUS_COLORS.RESOLVED.BORDER :
                task.status === 'In Progress' ? STATUS_COLORS.IN_PROGRESS.BORDER :
                task.status === 'Assigned' ? STATUS_COLORS.INACTIVE.BORDER :
                STATUS_COLORS.REVIEWING.BORDER
            }}
          >
            {task.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Created: {FORMAT_DATE_TIME(task.created_at)}
            </span>
          </div>
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Updated: {FORMAT_DATE_TIME(task.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Task assignments section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Confirmed Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.IN_PROGRESS.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">Confirmed ({assignmentsByStatus.Confirmed.length})</h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.Confirmed.map((assignment) => (
              <div 
                key={assignment.assignment_id} 
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition"
                style={{ borderLeftColor: STATUS_COLORS.IN_PROGRESS.TEXT }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">{assignment.description}</h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>ID: {assignment.employee_id.substring(0, 8)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.Confirmed.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No assignment yet
              </div>
            )}
          </div>
        </div>

        {/* Reassigned Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.REVIEWING.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">Reassigned ({assignmentsByStatus.Reassigned.length})</h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.Reassigned.map((assignment) => (
              <div 
                key={assignment.assignment_id} 
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition"
                style={{ borderLeftColor: STATUS_COLORS.REVIEWING.TEXT }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">{assignment.description}</h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>ID: {assignment.employee_id.substring(0, 8)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.Reassigned.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Không có phân công nào
              </div>
            )}
          </div>
        </div>

        {/* InFixing Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.PENDING.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">In Fixing ({assignmentsByStatus.InFixing.length})</h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.InFixing.map((assignment) => (
              <div 
                key={assignment.assignment_id} 
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition"
                style={{ borderLeftColor: STATUS_COLORS.PENDING.TEXT }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">{assignment.description}</h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>ID: {assignment.employee_id.substring(0, 8)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.InFixing.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Không có phân công nào
              </div>
            )}
          </div>
        </div>

        {/* Fixed Column */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS.RESOLVED.TEXT }}
            ></div>
            <h3 className="font-semibold dark:text-white">Fixed ({assignmentsByStatus.Fixed.length})</h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-[70vh]">
            {assignmentsByStatus.Fixed.map((assignment) => (
              <div 
                key={assignment.assignment_id} 
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2 border-l-4 hover:shadow-md transition"
                style={{ borderLeftColor: STATUS_COLORS.RESOLVED.TEXT }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm dark:text-white line-clamp-2">{assignment.description}</h4>
                  {getStatusIcon(assignment.status)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mb-1">
                    <FaUser className="mr-1" />
                    <span>ID: {assignment.employee_id.substring(0, 8)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>{FORMAT_DATE_TIME(assignment.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {assignmentsByStatus.Fixed.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Không có phân công nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail 