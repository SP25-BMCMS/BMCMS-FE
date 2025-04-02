export type LoginUserAPIResponse = {
    accessToken: string,
    refreshToken: string,
    userId: string,
    username:string
}
export type GetCurrentUserAPIResponse ={
    userId: string,
    username: string,
    email: string,
}

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
}
export type SeverityOption= {
  value: string;
  label: string;
}

export type SeverityFilterProps = {
  options: SeverityOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  label?: string;
  className?: string;
}
//residents
export type Residents = {
  userId: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  accountStatus: 'Active' | 'Inactive'; // Thêm trường này
  gender: string;
  createdDate: string;
  apartments?: {
    apartmentName: string;
    buildingId: string;
  }[];
};

export type ResidentsApiResponse = {
  success: boolean;
  data: Residents[];
};

//Staff
export interface StaffResponse {
  isSuccess: boolean;
  message: string;
  data: StaffData[];
}

export interface StaffData {
  userId: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  dateOfBirth: string;
  gender: string;
}
export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Staff' | 'Leader' | 'Manager' | 'Admin';
  dateOfBirth: string;
  gender: string;
  createdDate: string;
};

//building
export interface BuildingResponse {
  buildingId: string;
  name: string;
  description: string;
  numberFloor: number;
  imageCover: string;
  areaId: string;
  createdAt: string;
  construction_date:string;
  completion_date:string;
  Status: string;
  updatedAt: string;
}
export interface BuildingsListResponse {
  statusCode: number;
  message: string;
  data: BuildingResponse[];
}
export interface AddBuildingRequest {
  name: string;
  description: string;
  numberFloor: number;
  imageCover: string;
  areaId: string;
  construction_date: string;
  completion_date: string;
  status: 'operational' | 'under_construction';
}
//crack
export type CrackDetailsResponse = {
  crackDetailsId: string;
  crackReportId: string;
  photoUrl: string;
  severity: 'Low' | 'Medium' | 'High';
  aiDetectionUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type CrackReportResponse = {
  crackReportId: string;
  buildingDetailId: string;
  description: string;
  isPrivatesAsset: boolean;
  position: string | null;
  status: 'Pending' | 'InProgress' | 'Resolved';
  reportedBy: {
    userId: string;
    username: string;
  };
  verifiedBy: {
    userId: string;
    username: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  crackDetails: CrackDetailsResponse[];
}

export type CrackListPaginationResponse = {
  data: CrackReportResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type CrackListParams = {
  page?: number;
  limit?: number;
  search?: string;
  severityFilter?: 'Low' | 'Medium' | 'High';
  status?: 'Pending' | 'InProgress' | 'Resolved';
}
//task
export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  createdAt: string;
}
//area
export type Area = {
    areaId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  export interface AddAreaRequest {
    name: string;
    description: string;
  }

export type Crack = {
  id: string;
  reportDescription: string;
  createdDate: string;
  status: 'pending' | 'InProgress' | 'resolved';
  residentId: string;
  residentName?: string;
  location?: string;
  description: string;
  originalImage?: string;
  originalImage2?: string;
  aiDetectedImage?: string;
  aiDetectedImage2?: string;
};