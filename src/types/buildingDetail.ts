import { BuildingResponse } from './index'

// Basic BuildingDetail interface
export interface BuildingDetail {
  buildingDetailId: string
  buildingId: string
  name: string
  total_apartments: number
  locationDetails: Array<{
    locationDetailId: string
    roomNumber: string
    floorNumber: number
    areaType: string
    description: string
  }>
  building?: {
    buildingId: string
    name: string
    description: string
    numberFloor: number
    Status: string
    area: {
      areaId: string
      name: string
      description: string
    }
  }
  createdAt?: string
  updatedAt?: string
  status?: string
}

// BuildingDetail with building information
export interface BuildingDetailWithBuilding extends BuildingDetail {
  building: BuildingResponse & {
    area: {
      areaId: string
      name: string
      description: string
      createdAt: string
      updatedAt: string
    }
  }
}

// Response for a single building detail
export interface BuildingDetailResponse {
  statusCode: number
  message: string
  data: BuildingDetailWithBuilding
}

// Response for all building details with pagination
export interface AllBuildingDetailsResponse {
  statusCode: number
  message: string
  data: Array<
    BuildingDetail & {
      building: BuildingResponse
      locationDetails?: Array<any>
    }
  >
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Request to create or update a building detail
export interface BuildingDetailRequest {
  buildingId: string
  name: string
  total_apartments: number
}

// Parameters for fetching building details
export interface BuildingDetailListParams {
  page?: number
  limit?: number
  search?: string
  buildingId?: string
}
