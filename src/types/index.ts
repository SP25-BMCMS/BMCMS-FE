export type LoginUserAPIResponse = {
  accessToken: string,
  refreshToken: string,
  userId: string,
  username: string
}
export type GetCurrentUserAPIResponse = {
  userId: string,
  username: string,
  email: string,
  role: 'admin' | 'manager'
}

export type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
  className?: string
}
export type SeverityOption = {
  value: string
  label: string
}

export type SeverityFilterProps = {
  options: SeverityOption[]
  selectedValue: string
  onSelect: (value: string) => void
  label?: string
  className?: string
}
//residents
export type Residents = {
  userId: string
  username: string
  email: string
  phone: string
  dateOfBirth: string
  accountStatus: 'Active' | 'Inactive' // Thêm trường này
  gender: string
  createdDate: string
  apartments?: {
    apartmentName: string
    buildingId: string
  }[]
}

export type ResidentsApiResponse = {
  success: boolean
  data: Residents[]
}

// Resident apartment types
export interface ResidentApartmentResponse {
  isSuccess: boolean
  message: string
  data: ResidentApartment[]
}

export interface ResidentApartment {
  apartmentId: string
  apartmentName: string
  buildingDetails: {
    buildingDetailId: string
    name: string
    building: {
      buildingId: string
      name: string
      description: string
      numberFloor: number
      imageCover: string
      areaId: string
      Status: string
      area: {
        areaId: string
        name: string
        description: string
        createdAt: string
        updatedAt: string
      }
    }
  }
}


//Staff
export interface StaffResponse {
  isSuccess: boolean
  message: string
  data: StaffData[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface StaffData {
  userId: string
  username: string
  email: string
  phone: string
  role: string
  dateOfBirth: string
  gender: string
}

export interface StaffDetailResponse {
  isSuccess: boolean
  message: string
  data: StaffDetailData
}

export interface StaffDetailData {
  userId: string
  username: string
  email: string
  phone: string
  role: string
  dateOfBirth: string
  gender: string
  accountStatus: string
  userDetails?: {
    positionId: string
    departmentId: string
    position: {
      positionId: string
      positionName: string
      description: string
    }
    department: {
      departmentId: string
      departmentName: string
      description: string
      area: string
    }
  }
}

export type Staff = {
  id: string
  name: string
  email: string
  phone: string
  role: 'Staff' | 'Leader' | 'Manager' | 'Admin'
  dateOfBirth: string
  gender: string
  createdDate: string
}

//building
export interface BuildingResponse {
  buildingId: string
  name: string
  description: string
  numberFloor: number
  imageCover: string
  areaId: string
  createdAt: string
  construction_date: string
  completion_date: string
  Status: string
  updatedAt: string
}
export interface BuildingsListResponse {
  statusCode: number
  message: string
  data: BuildingResponse[]
}
export interface AddBuildingRequest {
  name: string
  description: string
  numberFloor: number
  imageCover: string
  areaId: string
  construction_date: string
  completion_date: string
  status: 'operational' | 'under_construction'
}
//crack
export type CrackDetailsResponse = {
  crackDetailsId: string
  crackReportId: string
  photoUrl: string
  severity: 'Low' | 'Medium' | 'High'
  aiDetectionUrl: string
  createdAt: string
  updatedAt: string
}

export type CrackReportResponse = {
  crackReportId: string
  buildingDetailId: string
  description: string
  isPrivatesAsset: boolean
  position: string | null
  status: 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing'
  reportedBy: {
    userId: string
    username: string
  }
  verifiedBy: {
    userId: string
    username: string
  } | null
  createdAt: string
  updatedAt: string
  crackDetails: CrackDetailsResponse[]
}

export type CrackListPaginationResponse = {
  data: CrackReportResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type CrackListParams = {
  page?: number
  limit?: number
  search?: string
  severityFilter?: 'Low' | 'Medium' | 'High'
  status?: 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing'
}
//task
export interface TaskResponse {
  task_id: string
  description: string
  status: string
  created_at: string
  updated_at: string
  crack_id: string
  schedule_job_id: string
  crackInfo?: {
    isSuccess: boolean
    message: string
    data: {
      crackReportId: string
      buildingDetailId: string
      description: string
      isPrivatesAsset: boolean
      position: string
      status: 'Pending' | 'InProgress' | 'Resolved' | 'Reviewing'
      reportedBy: {
        userId: string
        username: string
      }
      verifiedBy?: {
        userId: string
        username: string
      }
      createdAt: string
      updatedAt: string
      crackDetails: {
        crackDetailsId: string
        crackReportId: string
        photoUrl: string
        severity: string
        aiDetectionUrl: string
        createdAt: string
        updatedAt: string
      }[]
    }[]
  }
}

export interface TaskListPaginationResponse {
  statusCode: number
  message: string
  data: TaskResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface TaskListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}
//area
export type Area = {
  areaId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}
export interface AddAreaRequest {
  name: string
  description: string
}

export type Crack = {
  id: string
  reportDescription: string
  createdDate: string
  status: 'pending' | 'InProgress' | 'resolved' | 'Reviewing'
  residentId: string
  residentName?: string
  location?: string
  description: string
  originalImage?: string
  originalImage2?: string
  aiDetectedImage?: string
  aiDetectedImage2?: string
}

// Task Assignment types
export interface TaskAssignment {
  assignment_id: string
  task_id: string
  employee_id: string
  description: string
  status: 'Confirmed' | 'Reassigned' | 'InFixing' | 'Fixed'
  created_at: string
  updated_at: string
}

export interface TaskAssignmentResponse {
  statusCode: number
  message: string
  data: {
    task_id: string
    description: string
    status: string
    created_at: string
    updated_at: string
    crack_id?: string
    schedule_job_id?: string
    taskAssignments: TaskAssignment[]
  }
}

export interface TaskAssignmentDetailResponse {
  success: boolean
  message: string
  data: {
    assignment_id: string
    task_id: string
    description: string
    employee: {
      employee_id: string
      username: string
    }
    status: string
    created_at: string
    updated_at: string
    task: {
      task_id: string
      description: string
      status: string
      created_at: string
      updated_at: string
      crack_id?: string
      schedule_job_id?: string
    }
    crackInfo?: {
      isSuccess: boolean
      message: string
      data: {
        crackReportId: string
        buildingDetailId: string
        description: string
        isPrivatesAsset: boolean
        position: string
        status: string
        reportedBy: {
          userId: string
          username: string
        }
        verifiedBy?: {
          userId: string
          username: string
        }
        createdAt: string
        updatedAt: string
      }[]
    }
  }
}

export interface Inspection {
  inspection_id: string
  task_assignment_id: string
  inspected_by: string
  image_urls: string[]
  description: string
  created_at: string
  updated_at: string
  total_cost: string
}

export interface InspectionResponse {
  statusCode: number
  message: string
  data: Inspection[]
}