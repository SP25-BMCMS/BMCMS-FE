import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { addBuilding } from "@/services/building";
import { getAreaList } from "@/services/areas";
import { Area } from "@/types";
import toast from "react-hot-toast";

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddBuildingModal: React.FC<AddBuildingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    numberFloor: 1,
    imageCover: "",
    areaId: "",
    construction_date: new Date().toLocaleDateString("en-CA"),
    completion_date: new Date().toLocaleDateString("en-CA"),
    status: "operational",
  });

  useEffect(() => {
    if (formData.status === "under_construction") {
      // Nếu trạng thái là đang xây dựng, định dạng lại ngày hoàn thành
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      setFormData((prev) => ({
        ...prev,
        completion_date: `${day}/${month}/${year}`,
      }));
    }
  }, [formData.status]);
  

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasData = await getAreaList();
        setAreas(areasData);
        if (areasData.length > 0) {
          setFormData((prev) => ({ ...prev, areaId: areasData[0].areaId }));
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách khu vực:", error);
        toast.error("Không thể tải danh sách khu vực!");
      }
    };

    if (isOpen) {
      fetchAreas();
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "numberFloor") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 1,
      }));
    } else if (name === "status") {
      // Khi thay đổi status
      if (value === "under_construction") {
        // Nếu chọn đang xây dựng, đặt ngày hoàn thành là DD/MM/YYYY
        const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  setFormData((prev) => ({
    ...prev,
    status: value,
    completion_date: `${day}/${month}/${year}`,
        }));
      } else {
        // Nếu chọn đang hoạt động, đặt lại ngày hoàn thành
        setFormData((prev) => ({
          ...prev,
          status: value,
          completion_date: new Date().toLocaleDateString("en-CA"),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    if (!formData.name.trim()) {
      toast.error("Tên tòa nhà không được để trống!");
      setIsLoading(false);
      return;
    }

    if (!formData.areaId) {
      toast.error("Vui lòng chọn khu vực!");
      setIsLoading(false);
      return;
    }

    try {
      await addBuilding({
        name: formData.name,
        description: formData.description,
        numberFloor: formData.numberFloor,
        imageCover: formData.imageCover,
        areaId: formData.areaId,
        construction_date: formData.construction_date,
        completion_date: formData.completion_date,
        status: formData.status as "operational" | "under_construction",
      });

      toast.success("Thêm tòa nhà thành công!");

      // Reset form
      setFormData({
        name: "",
        description: "",
        numberFloor: 1,
        imageCover: "",
        areaId: "",
        construction_date: new Date().toLocaleDateString("en-CA"),
        completion_date: new Date().toLocaleDateString("en-CA"),
        status: "operational",
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Lỗi khi thêm tòa nhà:", err);
      toast.error("Lỗi khi thêm tòa nhà mới!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm tòa nhà mới">
      <div className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Tên tòa nhà
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên tòa nhà"
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Số tầng
            </label>
            <input
              type="number"
              name="numberFloor"
              value={formData.numberFloor}
              onChange={handleChange}
              min="1"
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Hình ảnh (URL)
            </label>
            <input
              type="text"
              name="imageCover"
              value={formData.imageCover}
              onChange={handleChange}
              placeholder="Nhập URL hình ảnh"
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Khu vực
            </label>
            <select
              name="areaId"
              value={formData.areaId}
              onChange={handleChange}
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Chọn khu vực</option>
              {areas.map((area) => (
                <option key={area.areaId} value={area.areaId}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Ngày khởi công
            </label>
            <input
              type="date"
              name="construction_date"
              value={formData.construction_date}
              onChange={handleChange}
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Trạng thái
            </label>
            <div className="w-2/3 flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="operational"
                  checked={formData.status === "operational"}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Đang hoạt động</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="under_construction"
                  checked={formData.status === "under_construction"}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Đang xây dựng</span>
              </label>
            </div>
          </div>

          {/* Điều chỉnh trường ngày hoàn thành */}
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Ngày hoàn thành
            </label>
            {formData.status === "under_construction" ? (
              <input
                type="text"
                name="completion_date"
                value={formData.completion_date}
                className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm bg-gray-100 cursor-not-allowed"
                disabled
              />
            ) : (
              <input
                type="date"
                name="completion_date"
                value={formData.completion_date}
                onChange={handleChange}
                className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả tòa nhà"
              className="w-2/3 px-3 py-2 border border-black rounded-[7px] shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-red-600 underline hover:text-red-700"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Thêm"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddBuildingModal;
