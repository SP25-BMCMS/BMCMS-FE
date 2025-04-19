import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import crackApi from '@/services/cracks';
import { getBuildingDetail } from '@/services/building';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Loader2,
  Building2,
  MapPin,
} from 'lucide-react';
import { STATUS_COLORS } from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';

// Add this CSS class at the top of the file
const pulseAnimation = {
  pending: `animate-pulse-fast bg-[${STATUS_COLORS.PENDING.TEXT}]`,
  inProgress: `animate-pulse bg-[${STATUS_COLORS.IN_PROGRESS.TEXT}]`,
  resolved: `bg-[${STATUS_COLORS.RESOLVED.TEXT}]`,
};

// Define types for crack data
interface CrackDetail {
  crackReportId: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reportedBy: string | { userId: string; username: string };
  verifiedBy?: string | { userId: string; username: string };
  buildingDetailId: string;
  isPrivatesAsset: boolean;
  position?: string;
  crackDetails: Array<{
    crackDetailsId: string;
    photoUrl: string;
    aiDetectionUrl: string;
    severity: string;
    createdAt: string;
  }>;
}

// Define types for building detail data
interface BuildingDetailData {
  buildingDetailId: string;
  buildingId: string;
  name: string;
  total_apartments: number;
  createdAt: string;
  updatedAt: string;
  building: {
    buildingId: string;
    name: string;
    description: string;
    numberFloor: number;
    imageCover: string;
    manager_id: string;
    areaId: string;
    createdAt: string;
    updatedAt: string;
    Status: string;
    construction_date: string;
    completion_date: string;
    Warranty_date: string;
    area: {
      areaId: string;
      name: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

// Function to generate a tiny placeholder URL
const generateTinyPlaceholder = (originalUrl: string): string => {
  // In a real app, you would generate a tiny version of the image on the server
  // For now, we'll use the original image with a low quality parameter
  // This will make the browser download a low-quality version first
  if (originalUrl && originalUrl.startsWith('http')) {
    // If it's an external URL, we can use it directly
    return originalUrl;
  }
  // Fallback to a placeholder if no valid URL
  return `https://via.placeholder.com/20x20/cccccc/ffffff?text=Loading`;
};

const DetailCrack: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [crack, setCrack] = useState<CrackDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrorStates, setImageErrorStates] = useState<{ [key: string]: boolean }>({});
  const [visibleImages, setVisibleImages] = useState<{ [key: string]: boolean }>({});
  const [imageLoadedStates, setImageLoadedStates] = useState<{ [key: string]: boolean }>({});
  const imageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const imageId = entry.target.getAttribute('data-image-id');
            if (imageId) {
              setVisibleImages(prev => ({
                ...prev,
                [imageId]: true,
              }));
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    // Observe all image containers
    Object.keys(imageRefs.current).forEach(imageId => {
      const element = imageRefs.current[imageId];
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [crack]);

  useEffect(() => {
    const fetchCrackDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await crackApi.getCrackDetail(id);
        console.log('Crack detail response:', response);
        if (response.isSuccess && response.data.length > 0) {
          setCrack(response.data[0]);
        } else {
          setError('No crack data found');
        }
      } catch (error) {
        console.error('Error fetching crack detail:', error);
        setError('Failed to load crack details');
      } finally {
        setLoading(false);
      }
    };

    fetchCrackDetail();
  }, [id]);

  // Fetch building detail data using TanStack Query
  const { data: buildingDetail, isLoading: isBuildingLoading } = useQuery({
    queryKey: ['buildingDetail', crack?.buildingDetailId],
    queryFn: () => getBuildingDetail(crack?.buildingDetailId || ''),
    enabled: !!crack?.buildingDetailId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get reporter username
  const getReporterName = () => {
    if (!crack) return 'Unknown';
    return crack.reportedBy && typeof crack.reportedBy === 'object'
      ? crack.reportedBy.username
      : typeof crack.reportedBy === 'string'
        ? crack.reportedBy
        : 'Unknown';
  };

  // Get verifier username
  const getVerifierName = () => {
    if (!crack) return 'Not verified';
    return crack.verifiedBy
      ? typeof crack.verifiedBy === 'object'
        ? crack.verifiedBy.username
        : crack.verifiedBy
      : 'Not verified yet';
  };

  // Convert status to animation key
  const getStatusAnimationClass = (status: string) => {
    switch (status) {
      case 'Resolved':
        return pulseAnimation.resolved;
      case 'InProgress':
        return pulseAnimation.inProgress;
      default:
        return pulseAnimation.pending;
    }
  };

  // Handle image loading state
  const handleImageLoad = (imageId: string) => {
    setImageLoadedStates(prev => ({
      ...prev,
      [imageId]: true,
    }));
  };

  // Handle image error state
  const handleImageError = (imageId: string) => {
    setImageErrorStates(prev => ({
      ...prev,
      [imageId]: true,
    }));
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/crack');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-800 transition-colors">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
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
            <p className="text-xl text-gray-700 dark:text-gray-200 mb-6">
              {error || `Crack ID#${id} not found`}
            </p>
            <button
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center mx-auto"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
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
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get building detail name and area name
  const buildingDetailName = buildingDetail?.data?.name || 'Loading...';
  const buildingAreaName = buildingDetail?.data?.building?.area?.name || '';

  const buildingDetailInfo = isBuildingLoading
    ? 'Loading building details...'
    : buildingDetail
      ? `${buildingDetailName}${buildingAreaName ? ` (${buildingAreaName})` : ''}`
      : 'Building detail not found';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Go back"
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
            <Link
              to="/crack"
              className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Crack Management
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Detail View</span>

            <div className="ml-auto flex items-center space-x-4">
              <div className="flex items-center">
                <span
                  className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full"
                  style={{
                    backgroundColor:
                      crack.status === 'Resolved'
                        ? STATUS_COLORS.RESOLVED.BG
                        : crack.status === 'InProgress'
                          ? STATUS_COLORS.IN_PROGRESS.BG
                          : STATUS_COLORS.PENDING.BG,
                    color:
                      crack.status === 'Resolved'
                        ? STATUS_COLORS.RESOLVED.TEXT
                        : crack.status === 'InProgress'
                          ? STATUS_COLORS.IN_PROGRESS.TEXT
                          : STATUS_COLORS.PENDING.TEXT,
                    border: `1px solid ${
                      crack.status === 'Resolved'
                        ? STATUS_COLORS.RESOLVED.BORDER
                        : crack.status === 'InProgress'
                          ? STATUS_COLORS.IN_PROGRESS.BORDER
                          : STATUS_COLORS.PENDING.BORDER
                    }`,
                  }}
                >
                  <span className="relative mr-1.5 flex items-center justify-center w-3 h-3">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          crack.status === 'Resolved'
                            ? STATUS_COLORS.RESOLVED.TEXT
                            : crack.status === 'InProgress'
                              ? STATUS_COLORS.IN_PROGRESS.TEXT
                              : STATUS_COLORS.PENDING.TEXT,
                      }}
                    ></span>
                    {crack.status !== 'Resolved' && (
                      <span
                        className="absolute -inset-0.5 rounded-full opacity-30 animate-ping"
                        style={{
                          backgroundColor:
                            crack.status === 'InProgress'
                              ? STATUS_COLORS.IN_PROGRESS.TEXT
                              : STATUS_COLORS.PENDING.TEXT,
                        }}
                      ></span>
                    )}
                  </span>
                  {crack.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>
                Reported by: <span className="font-medium">{getReporterName()}</span>
              </span>
            </div>
            {crack.verifiedBy && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>
                  Verified by: <span className="font-medium">{getVerifierName()}</span>
                </span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                Created: <span className="font-medium">{formatDate(crack.createdAt)}</span>
              </span>
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
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {crack.description}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Building</p>
                  <div className="flex items-center text-gray-800 dark:text-gray-200 font-medium mt-1">
                    <Building2 className="h-4 w-4 mr-1.5 text-blue-500" />
                    {buildingDetailInfo}
                    {isBuildingLoading && (
                      <Loader2 className="h-3 w-3 ml-2 text-gray-400 animate-spin" />
                    )}
                  </div>
                </div>

                {buildingAreaName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Area</p>
                    <div className="flex items-center text-gray-800 dark:text-gray-200 font-medium mt-1">
                      <MapPin className="h-4 w-4 mr-1.5 text-green-500" />
                      {buildingAreaName}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asset Type</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {crack.isPrivatesAsset ? 'Private Asset' : 'Public Asset'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {crack.position || 'Not specified'}
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
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verified By</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {getVerifierName()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created Date</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {formatDate(crack.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">
                    {formatDate(crack.updatedAt)}
                  </p>
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
                  {crack.crackDetails.map(
                    (detail: CrackDetail['crackDetails'][0], index: number) => (
                      <div
                        key={detail.crackDetailsId}
                        className={`space-y-4 p-4 rounded-lg ${
                          detail.severity === 'High'
                            ? 'animate-pulse-border border border-red-300 dark:border-red-700'
                            : 'border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                            Image #{index + 1}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs flex items-center ${
                              detail.severity === 'High'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                : detail.severity === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                detail.severity === 'High'
                                  ? `animate-pulse-fast bg-[${STATUS_COLORS.PENDING.TEXT}]`
                                  : detail.severity === 'Medium'
                                    ? `animate-pulse bg-[${STATUS_COLORS.IN_PROGRESS.TEXT}]`
                                    : `bg-[${STATUS_COLORS.RESOLVED.TEXT}]`
                              }`}
                            ></div>
                            {detail.severity} Severity
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                              Original Image
                            </p>
                            <div
                              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative aspect-video bg-gray-100 dark:bg-gray-700"
                              ref={el =>
                                (imageRefs.current[`original-${detail.crackDetailsId}`] = el)
                              }
                              data-image-id={`original-${detail.crackDetailsId}`}
                            >
                              {/* Progressive Image Loading */}
                              {visibleImages[`original-${detail.crackDetailsId}`] && (
                                <>
                                  {/* Low quality blurred image (always visible) */}
                                  <img
                                    src={
                                      detail.photoUrl ||
                                      'https://via.placeholder.com/400x300?text=No+Image+Available'
                                    }
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110"
                                    loading="lazy"
                                  />

                                  {/* Full resolution image */}
                                  <img
                                    src={
                                      detail.photoUrl ||
                                      'https://via.placeholder.com/400x300?text=No+Image+Available'
                                    }
                                    alt={`Original crack image ${index + 1}`}
                                    className={`w-full h-full object-cover transition-all duration-1000 ${
                                      imageLoadedStates[`original-${detail.crackDetailsId}`]
                                        ? 'opacity-100 filter blur-0'
                                        : 'opacity-0 filter blur-xl'
                                    }`}
                                    onLoad={() =>
                                      handleImageLoad(`original-${detail.crackDetailsId}`)
                                    }
                                    onError={() =>
                                      handleImageError(`original-${detail.crackDetailsId}`)
                                    }
                                    loading="lazy"
                                  />
                                </>
                              )}

                              {/* Error state */}
                              {visibleImages[`original-${detail.crackDetailsId}`] &&
                                imageErrorStates[`original-${detail.crackDetailsId}`] && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                    <div className="text-center p-4">
                                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Failed to load image
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                              AI Detected
                            </p>
                            <div
                              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative aspect-video bg-gray-100 dark:bg-gray-700"
                              ref={el => (imageRefs.current[`ai-${detail.crackDetailsId}`] = el)}
                              data-image-id={`ai-${detail.crackDetailsId}`}
                            >
                              {/* Progressive Image Loading */}
                              {visibleImages[`ai-${detail.crackDetailsId}`] && (
                                <>
                                  {/* Low quality blurred image (always visible) */}
                                  <img
                                    src={
                                      detail.aiDetectionUrl ||
                                      'https://via.placeholder.com/400x300?text=No+AI+Detection'
                                    }
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110"
                                    loading="lazy"
                                  />

                                  {/* Full resolution image */}
                                  <img
                                    src={
                                      detail.aiDetectionUrl ||
                                      'https://via.placeholder.com/400x300?text=No+AI+Detection'
                                    }
                                    alt={`AI detected crack image ${index + 1}`}
                                    className={`w-full h-full object-cover transition-all duration-1000 ${
                                      imageLoadedStates[`ai-${detail.crackDetailsId}`]
                                        ? 'opacity-100 filter blur-0'
                                        : 'opacity-0 filter blur-xl'
                                    }`}
                                    onLoad={() => handleImageLoad(`ai-${detail.crackDetailsId}`)}
                                    onError={() => handleImageError(`ai-${detail.crackDetailsId}`)}
                                    loading="lazy"
                                  />
                                </>
                              )}

                              {/* Error state */}
                              {visibleImages[`ai-${detail.crackDetailsId}`] &&
                                imageErrorStates[`ai-${detail.crackDetailsId}`] && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                    <div className="text-center p-4">
                                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Failed to load image
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                          <span>Uploaded: {formatDate(detail.createdAt)}</span>
                          <span>ID: {detail.crackDetailsId.substring(0, 8)}...</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-center mb-4">No crack images available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailCrack;
