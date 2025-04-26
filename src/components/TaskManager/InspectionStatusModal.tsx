import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import inspectionsApi from '@/services/inspections';
import { Inspection } from '@/types';
import toast from 'react-hot-toast';
import { FaThumbsUp, FaThumbsDown, FaTimes } from 'react-icons/fa';
import { STATUS_COLORS } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth'; // Import auth hook to get current user

// Type for report status
type ReportStatus = 'NoPending' | 'Pending' | 'Rejected' | 'Approved';

interface InspectionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: Inspection;
}

const InspectionStatusModal: React.FC<InspectionStatusModalProps> = ({
  isOpen,
  onClose,
  inspection,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get current user from auth context
  
  // Use 'Approved' for display but keep 'NoPending' for API
  const [selectedStatus, setSelectedStatus] = useState<'NoPending' | 'Rejected'>(
    inspection.report_status === 'Pending' || inspection.report_status === 'Rejected'
      ? 'Rejected'
      : 'NoPending'
  );
  const [reason, setReason] = useState<string>('');

  // Mutation for updating inspection status
  const updateStatusMutation = useMutation({
    mutationFn: ({
      inspectionId,
      status,
      userId,
      reason,
    }: {
      inspectionId: string;
      status: 'NoPending' | 'Rejected';
      userId: string;
      reason: string;
    }) => inspectionsApi.updateInspectionReportStatus(inspectionId, status, userId, reason),
    onSuccess: () => {
      const successMessage = selectedStatus === 'NoPending' 
        ? 'Inspection approved successfully' 
        : 'Inspection rejected successfully';
      toast.success(successMessage);
      // Invalidate inspections query to refresh data
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      onClose();
    },
    onError: error => {
      console.error('Failed to update inspection status:', error);
      toast.error('Failed to update inspection status');
    },
  });

  const handleSubmit = () => {
    if (!user?.userId) {
      toast.error('User information is missing. Please login again.');
      return;
    }

    updateStatusMutation.mutate({
      inspectionId: inspection.inspection_id,
      status: selectedStatus,
      userId: user.userId,
      reason: reason,
    });
  };

  // Display a more user-friendly status text
  const getDisplayStatus = (status: ReportStatus | string): string => {
    switch (status) {
      case 'NoPending':
        return 'Approved';
      case 'Pending':
        return 'Pending';
      case 'Rejected':
        return 'Rejected';
      case 'Approved':
        return 'Approved';
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  // Display value for the current status
  const currentDisplayStatus = getDisplayStatus(inspection.report_status);
  // Display value for the selected status (for buttons, labels, etc.)
  const displaySelectedStatus = selectedStatus === 'NoPending' ? 'Approved' : 'Rejected';

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-50"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dark:text-white">Update Inspection Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Inspection ID: {inspection.inspection_id.substring(0, 8)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Current Status:{' '}
              <span className="font-medium">{currentDisplayStatus}</span>
            </p>

            <div className="flex flex-col space-y-3 mt-4">
              {/* Approve Button using STATUS_COLORS */}
              <button
                className="flex items-center justify-center p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    selectedStatus === 'NoPending'
                      ? STATUS_COLORS.RESOLVED.BG
                      : 'rgba(229, 231, 235, var(--tw-bg-opacity))',
                  color:
                    selectedStatus === 'NoPending'
                      ? STATUS_COLORS.RESOLVED.TEXT
                      : 'rgba(55, 65, 81, var(--tw-text-opacity))',
                  borderWidth: selectedStatus === 'NoPending' ? '1px' : '0px',
                  borderColor:
                    selectedStatus === 'NoPending'
                      ? STATUS_COLORS.RESOLVED.BORDER
                      : 'transparent',
                }}
                onClick={() => setSelectedStatus('NoPending')}
              >
                <FaThumbsUp className="mr-2" />
                Approve
              </button>

              {/* Reject Button using STATUS_COLORS */}
              <button
                className="flex items-center justify-center p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    selectedStatus === 'Rejected'
                      ? STATUS_COLORS.INACTIVE.BG
                      : 'rgba(229, 231, 235, var(--tw-bg-opacity))',
                  color:
                    selectedStatus === 'Rejected'
                      ? STATUS_COLORS.INACTIVE.TEXT
                      : 'rgba(55, 65, 81, var(--tw-text-opacity))',
                  borderWidth: selectedStatus === 'Rejected' ? '1px' : '0px',
                  borderColor:
                    selectedStatus === 'Rejected'
                      ? STATUS_COLORS.INACTIVE.BORDER
                      : 'transparent',
                }}
                onClick={() => setSelectedStatus('Rejected')}
              >
                <FaThumbsDown className="mr-2" />
                Reject
              </button>
            </div>

            {/* Selected status indicator */}
            <div className="mt-3 text-sm text-center">
              <span className="font-medium">Selected action:</span>{' '}
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: selectedStatus === 'NoPending' ? STATUS_COLORS.RESOLVED.BG : STATUS_COLORS.INACTIVE.BG,
                  color: selectedStatus === 'NoPending' ? STATUS_COLORS.RESOLVED.TEXT : STATUS_COLORS.INACTIVE.TEXT,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: selectedStatus === 'NoPending' ? STATUS_COLORS.RESOLVED.BORDER : STATUS_COLORS.INACTIVE.BORDER,
                }}
              >
                {displaySelectedStatus}
              </span>
            </div>

            {/* Reason field */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason {selectedStatus === 'Rejected' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={selectedStatus === 'Rejected' ? "Please provide a reason for rejection" : "Optional notes for approval"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                required={selectedStatus === 'Rejected'}
              />
              {selectedStatus === 'Rejected' && !reason && (
                <p className="mt-1 text-xs text-red-500">Reason is required for rejection</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  selectedStatus === 'NoPending'
                    ? STATUS_COLORS.RESOLVED.BG
                    : STATUS_COLORS.INACTIVE.BG,
                color:
                  selectedStatus === 'NoPending'
                    ? STATUS_COLORS.RESOLVED.TEXT
                    : STATUS_COLORS.INACTIVE.TEXT,
                borderWidth: '1px',
                borderColor:
                  selectedStatus === 'NoPending'
                    ? STATUS_COLORS.RESOLVED.BORDER
                    : STATUS_COLORS.INACTIVE.BORDER,
              }}
              onClick={handleSubmit}
              disabled={updateStatusMutation.isPending || (selectedStatus === 'Rejected' && !reason)}
            >
              {updateStatusMutation.isPending 
                ? 'Updating...' 
                : `${displaySelectedStatus} Inspection`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InspectionStatusModal;
