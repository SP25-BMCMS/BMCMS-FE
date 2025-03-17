import React, { useState } from "react";
import Modal from "./Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar1Icon } from "lucide-react";

interface AddResidentProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (residentData: any) => void;
  isLoading?: boolean;
}

const AddResident: React.FC<AddResidentProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: null as Date | null,
    createdDate: new Date().toLocaleDateString("en-CA"),
    role: "resident", // Mặc định là resident
    area: "",
    status: "active",
    gender: "male",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const formattedData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth
        ? formData.dateOfBirth.toLocaleDateString("en-CA")
        : "",
    };
    onAdd(formattedData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Resident">
      <div className="p-6 space-y-4">
        <div className="space-y-4">
          {/* Full Name */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              FullName
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nguyen Van A"
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Date of Birth */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Date Of Birth
            </label>
            <div className="w-2/3 relative">
              <DatePicker
                selected={formData.dateOfBirth}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                dateFormat="dd/MM/yyyy"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                placeholderText="DD/MM/YYYY"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-[75px] flex items-center pr-3"
              >
                <Calendar1Icon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Created Date
            </label>
            <input
              type="text"
              name="createdDate"
              value={formData.createdDate}
              onChange={handleChange}
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              readOnly
            />
          </div>

          {/* Role */}
          <div className="flex items-center">
  <label className="w-1/3 text-sm font-medium text-gray-700">Role</label>
  {["resident"].length > 1 ? (
    <select
      name="role"
      value={formData.role}
      onChange={handleChange}
      className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    >
      <option value="resident">Resident</option>
    </select>
  ) : (
    <span className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">{formData.role}</span>
  )}
</div>

          {/* Area */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Area
            </label>
            <select
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="" disabled>
                Select Area
              </option>
              <option value="block-a">Block A</option>
              <option value="block-b">Block B</option>
              <option value="block-c">Block C</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="w-2/3 flex space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Inactive</span>
              </label>
            </div>
          </div>

          {/* Gender */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Gender
            </label>
            <div className="w-2/3 flex space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Male</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleRadioChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Female</span>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-red-600 underline hover:text-red-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Add
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddResident;
