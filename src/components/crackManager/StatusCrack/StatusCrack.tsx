import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import crackApi from '@/services/cracks';
import { getAllStaff } from '@/services/staffs';
import { StaffData, Crack } from '@/types';
import { toast } from 'react-hot-toast';

interface StatusCrackProps {
  isOpen: boolean;
  onClose: () => void;
  crackId: string;
  crackStatus: string;
  onUpdateSuccess: () => void;
}

const StatusCrack: React.FC<StatusCrackProps> = ({
  isOpen,
  onClose,
  crackId,
  crackStatus,
  onUpdateSuccess
}) => {
  const [staffList, setStaffList] = useState<StaffData[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Status title mapping
  const statusMapping = {
    pending: { title: "Assign Staff to Pending Crack", label: "Pending" },
    InProgress: { title: "Update In-Progress Crack", label: "In Progress" },
    resolved: { title: "Resolve Crack", label: "Resolved" }
  };

  // Get the status title
  const getStatusTitle = () => {
    return statusMapping[crackStatus as keyof typeof statusMapping]?.title || "Update Crack Status";
  };

  // Get the status label
  const getStatusLabel = () => {
    return statusMapping[crackStatus as keyof typeof statusMapping]?.label || crackStatus;
  };

  // Fetch staff list when modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchStaffList();
    }
  }, [isOpen]);

  // Fetch staff list from API
  const fetchStaffList = async () => {
    setIsLoading(true);
    try {
      const response = await getAllStaff();
      if (response.isSuccess && response.data) {
        // Filter to only include staff with the "Staff" role
        const staffMembers = response.data.filter(staff => staff.role === "Staff");
        setStaffList(staffMembers);
      } else {
        toast.error('Failed to load staff list');
      }
    } catch (error) {
      console.error('Error fetching staff list:', error);
      toast.error('Could not load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection change
  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStaffId(e.target.value);
  };

  // Get status animation class for the badge
  const getStatusAnimationClass = (status: string) => {
    switch (status) {
      case "resolved":
        return "";
      case "InProgress":
        return "animate-pulse";
      default:
        return "animate-pulse-fast";
    }
  };

  // Get status colors for the badge
  const getStatusColors = () => {
    switch (crackStatus) {
      case "resolved":
        return "bg-[rgba(80,241,134,0.31)] text-[#00ff90] border border-[#50f186]";
      case "InProgress":
        return "bg-[rgba(255,165,0,0.3)] text-[#ff9900] border border-[#ffa500]";
      default:
        return "bg-[#f80808] bg-opacity-30 text-[#ff0000] border border-[#f80808]";
    }
  };

  // Get dot colors for the status badge
  const getDotColors = () => {
    switch (crackStatus) {
      case "resolved":
        return "bg-[#00ff90]";
      case "InProgress":
        return "bg-[#ff9900]";
      default:
        return "bg-[#ff0000]";
    }
  };

  // Save the staff assignment
  const handleSave = async () => {
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    setIsSaving(true);
    try {
      // Convert UI status to API status format
      const apiStatus =
        crackStatus === "InProgress"
          ? "InProgress"
          : crackStatus === "resolved"
          ? "Resolved"
          : "Pending";

      // Call API to update crack status with staff assignment
      const response = await crackApi.updateCrackStatus(
        crackId, 
        apiStatus as any, 
        selectedStaffId // This is the staff's userId that will be sent as staffId in the request body
      );
      
      if (response.isSuccess) {
        toast.success(`Staff assigned and status updated to ${getStatusLabel()}`);
        onUpdateSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Failed to update crack status:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getStatusTitle()}
      size="md"
    >
      <div className="space-y-4">
        {/* Current status display */}
        <div className="flex justify-center mb-4">
          <span
            className={`px-4 py-2 inline-flex items-center text-sm leading-5 font-semibold rounded-full ${getStatusColors()}`}
          >
            <span className="relative mr-2">
              <span className={`inline-block w-3 h-3 rounded-full ${getDotColors()} ${getStatusAnimationClass(crackStatus)}`}></span>
              {crackStatus !== "resolved" && (
                <span className={`absolute -inset-1 rounded-full ${
                  crackStatus === "InProgress"
                    ? "bg-[#ff9900]"
                    : "bg-[#ff0000]"
                } opacity-30 animate-ping`}></span>
              )}
            </span>
            Current Status: {getStatusLabel()}
          </span>
        </div>

        {/* Staff selection dropdown */}
        <div>
          <label htmlFor="staff" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assign Staff Member
          </label>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-yellow-700 dark:text-yellow-400">
              No staff members available to assign. Please add staff members with the "Staff" role first.
            </div>
          ) : (
            <select
              id="staff"
              value={selectedStaffId}
              onChange={handleStaffChange}
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 border-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
              disabled={isSaving}
            >
              <option value="">-- Select Staff Member --</option>
              {staffList.map(staff => (
                <option key={staff.userId} value={staff.userId}>
                  {staff.username}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Staff selection note */}
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
          <p>Assigning a staff member will automatically update the crack status to <strong>{getStatusLabel()}</strong>.</p>
          <p className="mt-1">The selected staff will be responsible for addressing this crack report.</p>
          <p className="mt-1 text-blue-500 dark:text-blue-400">Note: Only users with the "Staff" role can be assigned to handle crack reports.</p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedStaffId || isSaving}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Processing...
              </span>
            ) : (
              'Assign & Update Status'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StatusCrack; 