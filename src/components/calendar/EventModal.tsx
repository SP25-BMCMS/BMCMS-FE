import { TaskEvent } from '@/types/calendar';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { vi } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import BuildingSelectionModal from './BuildingSelectionModal';
import ConfirmModal from './ConfirmModal';

registerLocale('vi', vi);

interface FormData {
  title: string;
  description: string;
  schedule_type: string;
  start_date: Date;
  end_date: Date;
  buildingId: string[];
}

interface EventModalProps {
  isOpen: boolean;
  isCreateMode: boolean;
  selectedEvent: TaskEvent | null;
  onClose: () => void;
  onSave: (formData: FormData) => void;
  onUpdate: (formData: FormData) => void;
  onDelete: (id: string) => void;
  onViewScheduleJob: () => void;
  onUpdateStatus: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
  initialFormData: Partial<TaskEvent>;
  buildings: Array<{
    buildingId: string;
    name: string;
    description?: string;
    Status: string;
  }>;
  selectedBuildings: string[];
  onBuildingSelect: (buildingId: string) => void;
  onSetSelectedBuildings: (buildings: string[]) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  isCreateMode,
  selectedEvent,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  onViewScheduleJob,
  initialFormData,
  buildings,
  selectedBuildings,
  onBuildingSelect,
  onSetSelectedBuildings,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    schedule_type: 'Daily',
    start_date: new Date(),
    end_date: new Date(),
    buildingId: [],
  });
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isCreateMode && initialFormData) {
      setFormData({
        title: initialFormData.title || '',
        description: initialFormData.description || '',
        schedule_type: initialFormData.schedule_type || 'Daily',
        start_date: initialFormData.start ? new Date(initialFormData.start) : new Date(),
        end_date: initialFormData.end ? new Date(initialFormData.end) : new Date(),
        buildingId: selectedBuildings,
      });
    } else if (selectedEvent) {
      setFormData({
        title: selectedEvent.title || '',
        description: selectedEvent.description || '',
        schedule_type: selectedEvent.schedule_type || 'Daily',
        start_date: selectedEvent.start ? new Date(selectedEvent.start) : new Date(),
        end_date: selectedEvent.end ? new Date(selectedEvent.end) : new Date(),
        buildingId: selectedEvent.buildingId || [],
      });
      // Set selectedBuildings directly
      onSetSelectedBuildings(selectedEvent.buildingId || []);
    }
  }, [isCreateMode, initialFormData, selectedEvent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      buildingId: selectedBuildings,
    };

    if (isCreateMode) {
      onSave(submitData);
    } else {
      onUpdate(submitData);
    }
  };

  const handleDelete = () => {
    if (selectedEvent?.id) {
      onDelete(selectedEvent.id);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {isCreateMode ? 'Create New Schedule' : 'Edit Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <DocumentTextIcon className="w-4 h-4 inline-block mr-2" />
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                aria-label="Schedule title"
                placeholder="Enter schedule title"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <TagIcon className="w-4 h-4 inline-block mr-2" />
                Schedule Type
              </label>
              <select
                value={formData.schedule_type}
                onChange={e => setFormData(prev => ({ ...prev, schedule_type: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                aria-label="Schedule type"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Specific">Specific</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarIcon className="w-4 h-4 inline-block mr-2" />
                Start Date
              </label>
              <DatePicker
                selected={formData.start_date}
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData(prev => ({ ...prev, start_date: date }));
                  }
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                locale="vi"
                aria-label="Start date"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarIcon className="w-4 h-4 inline-block mr-2" />
                End Date
              </label>
              <DatePicker
                selected={formData.end_date}
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData(prev => ({ ...prev, end_date: date }));
                  }
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                locale="vi"
                minDate={formData.start_date}
                aria-label="End date"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <BuildingOfficeIcon className="w-4 h-4 inline-block mr-2" />
                Buildings
              </label>
              <button
                type="button"
                onClick={() => setShowBuildingModal(true)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                aria-label="Select buildings"
              >
                Select Buildings
              </button>

              {selectedBuildings.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedBuildings.map(buildingId => {
                    const building = buildings.find(b => b.buildingId === buildingId);
                    return building ? (
                      <div
                        key={buildingId}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                      >
                        <span>{building.name}</span>
                        <button
                          type="button"
                          onClick={() => onBuildingSelect(buildingId)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          aria-label={`Remove ${building.name}`}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <DocumentTextIcon className="w-4 h-4 inline-block mr-2" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows={4}
                aria-label="Schedule description"
                placeholder="Enter schedule description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!isCreateMode && selectedEvent?.id && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onViewScheduleJob}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Detail
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isCreateMode ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>

      <BuildingSelectionModal
        isOpen={showBuildingModal}
        onClose={() => setShowBuildingModal(false)}
        buildings={buildings}
        selectedBuildings={selectedBuildings}
        onBuildingSelect={onBuildingSelect}
        selectedEvent={selectedEvent}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Confirm Delete"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default EventModal;
