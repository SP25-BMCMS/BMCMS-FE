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

export type Building ={
    id: string,
    name: string,
    createdDate: string;
    status: 'under_construction' | 'operational';
}
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

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  createdAt: string;
}