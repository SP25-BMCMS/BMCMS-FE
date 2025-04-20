import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import inspectionsApi from '@/services/inspections';
import { Inspection } from '@/types';
import toast from 'react-hot-toast';
import { FaThumbsUp, FaThumbsDown, FaTimes } from 'react-icons/fa';
import { STATUS_COLORS } from '@/constants/colors';

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
  const [selectedStatus, setSelectedStatus] = useState<'NoPending' | 'Rejected'>(
    inspection.report_status === 'Pending' || inspection.report_status === 'Rejected'
      ? 'Rejected'
      : 'NoPending'
  );

  // Mutation for updating inspection status
  const updateStatusMutation = useMutation({
    mutationFn: ({
      inspectionId,
      status,
    }: {
      inspectionId: string;
      status: 'NoPending' | 'Rejected';
    }) => inspectionsApi.updateInspectionReportStatus(inspectionId, status),
    onSuccess: () => {
      toast.success('Inspection status updated successfully');
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
    updateStatusMutation.mutate({
      inspectionId: inspection.inspection_id,
      status: selectedStatus,
    });
  };

  // Display a more user-friendly status text
  const getDisplayStatus = (status: string) => {
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

  // Console log to debug colors
  console.log('STATUS_COLORS.RESOLVED:', STATUS_COLORS.RESOLVED);
  console.log('STATUS_COLORS.INACTIVE:', STATUS_COLORS.INACTIVE);

  if (!isOpen) return null;

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
              <span className="font-medium">{getDisplayStatus(inspection.report_status)}</span>
            </p>

            <div className="flex flex-col space-y-3 mt-4">
              {/* Approve Button with explicit style values */}
              <button
                className="flex items-center justify-center p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    selectedStatus === 'NoPending'
                      ? 'rgba(80, 241, 134, 0.35)' // STATUS_COLORS.RESOLVED.BG
                      : 'rgba(229, 231, 235, var(--tw-bg-opacity))',
                  color:
                    selectedStatus === 'NoPending'
                      ? '#50F186' // STATUS_COLORS.RESOLVED.TEXT
                      : 'rgba(55, 65, 81, var(--tw-text-opacity))',
                  borderWidth: selectedStatus === 'NoPending' ? '1px' : '0px',
                  borderColor:
                    selectedStatus === 'NoPending'
                      ? '#50F186' // STATUS_COLORS.RESOLVED.BORDER
                      : 'transparent',
                }}
                onClick={() => setSelectedStatus('NoPending')}
              >
                <FaThumbsUp className="mr-2" />
                Approve
              </button>

              {/* Reject Button with explicit style values */}
              <button
                className="flex items-center justify-center p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    selectedStatus === 'Rejected'
                      ? 'rgba(248, 8, 8, 0.3)' // STATUS_COLORS.INACTIVE.BG
                      : 'rgba(229, 231, 235, var(--tw-bg-opacity))',
                  color:
                    selectedStatus === 'Rejected'
                      ? '#ff0000' // STATUS_COLORS.INACTIVE.TEXT
                      : 'rgba(55, 65, 81, var(--tw-text-opacity))',
                  borderWidth: selectedStatus === 'Rejected' ? '1px' : '0px',
                  borderColor:
                    selectedStatus === 'Rejected'
                      ? '#f80808' // STATUS_COLORS.INACTIVE.BORDER
                      : 'transparent',
                }}
                onClick={() => setSelectedStatus('Rejected')}
              >
                <FaThumbsDown className="mr-2" />
                Reject
              </button>
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
                    ? 'rgba(80, 241, 134, 0.35)' // STATUS_COLORS.RESOLVED.BG
                    : 'rgba(248, 8, 8, 0.3)', // STATUS_COLORS.INACTIVE.BG
                color:
                  selectedStatus === 'NoPending'
                    ? '#50F186' // STATUS_COLORS.RESOLVED.TEXT
                    : '#ff0000', // STATUS_COLORS.INACTIVE.TEXT
                borderWidth: '1px',
                borderColor:
                  selectedStatus === 'NoPending'
                    ? '#50F186' // STATUS_COLORS.RESOLVED.BORDER
                    : '#f80808', // STATUS_COLORS.INACTIVE.BORDER
              }}
              onClick={handleSubmit}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InspectionStatusModal;
