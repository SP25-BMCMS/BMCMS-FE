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
export type Residents ={
    id: string,
    name: string,
    createdDate: string,
    status: 'active' | 'inactive';
}
export type Staff ={
    id:string,
    name: string,
    createdDate: string,
    status: 'active' | 'inactive',
    role: 'Staff' | 'Leader' | 'Manager';
}

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
export type Crack = {
    id: string;
    reportDescription: string;
    createdDate: string;
    status: 'pending' | 'in_progress' | 'resolved';
    residentId: string;
    residentName: string;
    location: string;
    description: string;
    originalImage?: string;
    originalImage2?: string;
    aiDetectedImage?: string;
    aiDetectedImage2?: string;
  };
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