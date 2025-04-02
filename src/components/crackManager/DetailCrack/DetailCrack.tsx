import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import crackApi from "@/services/cracks";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";

// Add this CSS class at the top of the file
const pulseAnimation = {
  pending: "animate-pulse-fast bg-red-500",
  inProgress: "animate-pulse bg-orange-500",
  resolved: "bg-green-500"
};

const DetailCrack: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [crack, setCrack] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrackDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await crackApi.getCrackDetail(id);
        console.log("Crack detail response:", response);
        if (response.isSuccess && response.data.length > 0) {
          setCrack(response.data[0]);
        } else {
          setError("No crack data found");
        }
      } catch (error) {
        console.error("Error fetching crack detail:", error);
        setError("Failed to load crack details");
      } finally {
        setLoading(false);
      }
    };

    fetchCrackDetail();
  }, [id]);

  // Get reporter username
  const getReporterName = () => {
    if (!crack) return "Unknown";
    return crack.reportedBy && typeof crack.reportedBy === 'object' 
      ? crack.reportedBy.username 
      : typeof crack.reportedBy === 'string' 
        ? crack.reportedBy 
        : "Unknown";
  };

  // Get verifier username
  const getVerifierName = () => {
    if (!crack) return "Not verified";
    return crack.verifiedBy 
      ? (typeof crack.verifiedBy === 'object' 
        ? crack.verifiedBy.username 
        : crack.verifiedBy) 
      : "Not verified yet";
  };

  // Convert status to animation key
  const getStatusAnimationClass = (status: string) => {
    switch (status) {
      case "Resolved":
        return pulseAnimation.resolved;
      case "InProgress":
        return pulseAnimation.inProgress;
      default:
        return pulseAnimation.pending;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-800 transition-colors">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="text-xl text-gray-600 dark:text-gray-300 mt-4">Loading crack details...</p>
      </div>
    );
  }

  if (error || !crack) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 transition-colors">
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-xl text-gray-700 dark:text-gray-200 mb-6">{error || `Crack ID#${id} not found`}</p>
            <button
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center mx-auto"
              onClick={() => navigate("/crack-management")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Crack List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format the date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "InProgress":
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/crack-management")}
              className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              Crack Report Details
              <span className="ml-3 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-normal text-gray-700 dark:text-gray-300">
                ID: {crack.crackReportId.substring(0, 8)}...
              </span>
            </h1>
          </div>
          
          <div className="mt-4 flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/crack-management" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
              Crack Management
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Detail View</span>
            
            <div className="ml-auto flex items-center space-x-4">
              <div className="flex items-center">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${getStatusAnimationClass(crack.status)}`}></div>
                  {crack.status !== "Resolved" && (
                    <div className={`absolute -inset-1 rounded-full ${
                      crack.status === "InProgress" 
                        ? "bg-orange-500" 
                        : "bg-red-500"
                    } opacity-30 animate-ping`}></div>
                  )}
                </div>
                <span className={`ml-2 font-medium ${
                  crack.status === "Resolved" 
                    ? "text-green-600 dark:text-green-400" 
                    : crack.status === "InProgress" 
                    ? "text-orange-600 dark:text-orange-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {crack.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>Reported by: <span className="font-medium">{getReporterName()}</span></span>
            </div>
            {crack.verifiedBy && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Verified by: <span className="font-medium">{getVerifierName()}</span></span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Created: <span className="font-medium">{formatDate(crack.createdAt)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Report Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">{crack.description}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Building Detail ID</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">{crack.buildingDetailId}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asset Type</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {crack.isPrivatesAsset ? "Private Asset" : "Public Asset"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {crack.position || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Reporting Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reported By</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {getReporterName()}
                    {crack.reportedBy && typeof crack.reportedBy === 'object' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        (ID: {crack.reportedBy.userId.substring(0, 8)}...)
                      </span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verified By</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {getVerifierName()}
                    {crack.verifiedBy && typeof crack.verifiedBy === 'object' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        (ID: {crack.verifiedBy.userId.substring(0, 8)}...)
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created Date</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">{formatDate(crack.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">{formatDate(crack.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Images */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Crack Images
              </h2>
              
              {crack.crackDetails && crack.crackDetails.length > 0 ? (
                <div className="space-y-8">
                  {crack.crackDetails.map((detail: any, index: number) => (
                    <div 
                      key={detail.crackDetailsId} 
                      className={`space-y-4 p-4 rounded-lg ${
                        detail.severity === "High" 
                          ? "animate-pulse-border border border-red-300 dark:border-red-700" 
                          : "border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Image #{index + 1}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center ${
                          detail.severity === "High" 
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                            : detail.severity === "Medium" 
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" 
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            detail.severity === "High" 
                              ? "animate-pulse-fast bg-red-500" 
                              : detail.severity === "Medium" 
                              ? "animate-pulse bg-yellow-500" 
                              : "bg-green-500"
                          }`}></div>
                          {detail.severity} Severity
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Original Image</p>
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={detail.photoUrl || "https://via.placeholder.com/400x300?text=No+Image+Available"}
                              alt={`Original crack image ${index + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">AI Detected</p>
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={detail.aiDetectionUrl || "https://via.placeholder.com/400x300?text=No+AI+Detection"}
                              alt={`AI detected crack image ${index + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                        <span>Uploaded: {formatDate(detail.createdAt)}</span>
                        <span>ID: {detail.crackDetailsId.substring(0, 8)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-center mb-4">No crack images available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-6">
          <button
            className="px-6 py-3 rounded-lg text-red-500 border border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
            onClick={() => navigate("/crack-management")}
          >
            <XCircle className="h-5 w-5 mr-2" />
            Reject Report
          </button>
          <button
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            onClick={() => navigate("/crack-management")}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Approve Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailCrack;
