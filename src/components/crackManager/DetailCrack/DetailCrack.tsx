import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { mockCracks } from "@/mock/mockDataCrack";

const DetailCrack: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const crack = mockCracks.find((crack) => crack.id === id);

  if (!crack) {
    return (
        <>
      <div className="flex flex-col items-center justify-center h-screen bg-[#D9D9D9]">
        <p className="text-xl text-gray-600 mb-4">Crack ID#{id} not found</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => navigate("/crack-management")}
        >
          Back to List
        </button>
      </div>
      </>
    );
  }

  return (
    <>
      <div className="border-b border-[#000] flex justify-between items-center bg-[#D9D9D9]">
        <h1 className="text-2xl font-semibold p-4">Detail Crack ID#{crack.id}</h1>
      </div>
      <div className="w-full p-6">
        <div className="text-gray-500 text-sm mt-4 mb-6">
          <Link to="/crack" className="hover:underline">
            View Request
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-700 font-medium">Detail Crack</span>
        </div>

        <div className="border border-[#000] rounded-lg p-6 mb-8 bg-white shadow">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="font-medium">Title:</span>{" "}
              <span>{crack.reportDescription}</span>
            </div>
            <div>
              <span className="font-medium">FullName:</span>{" "}
              <span>{crack.residentName}</span>
            </div>
            <div>
              <span className="font-medium">Location:</span>{" "}
              <span>{crack.location}</span>
            </div>
            <div>
              <span className="font-medium">Created Date:</span>{" "}
              <span>{crack.createdDate}</span>
            </div>
          </div>

          <div>
            <span className="font-medium">Description:</span>
            <p className="mt-1 text-justify text-gray-700">
              {crack.description}
            </p>
          </div>
        </div>

        <div className="border border-[#000] rounded-lg p-6 mb-8 bg-white shadow">
          <div className="grid grid-cols-2 divide-x divide-[#000]">
            <div className="p-4 text-center">
              <h3 className="font-medium mb-4">Picture Origin</h3>
              <img
                src={
                  crack.originalImage ||
                  "https://via.placeholder.com/400x300?text=Wall+Crack+Image"
                }
                alt="Original crack"
                className="mx-auto border border-gray-300"
              />
              <p className="text-gray-500 mt-2">Image #1</p>
            </div>
            <div className="p-4 text-center">
              <h3 className="font-medium mb-4">AI Detected</h3>
              <img
                src={
                  crack.aiDetectedImage ||
                  "https://via.placeholder.com/400x300?text=AI+Detected+Crack"
                }
                alt="AI detected crack"
                className="mx-auto border border-gray-300"
              />
              <p className="text-gray-500 mt-2">Image #1</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-6">
          <button
            className="px-6 py-2 text-[#FF0000] underline rounded hover:bg-red-100"
            onClick={() => navigate("/crack")}
          >
            Rejected
          </button>
          <button
            className="px-6 py-2 text-[#00FF90] border border-[#00FF90] rounded bg-[#00FF90] bg-opacity-20"
            onClick={() => navigate("/crack")}
          >
            Received
          </button>
        </div>
      </div>
    </>
  );
};

export default DetailCrack;
