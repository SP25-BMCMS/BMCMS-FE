export interface TaskEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'cancel' | 'inprogress';
  description?: string;
  assignedTo?: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high';
  schedule_type?: string;
  buildingId?: string[];
  buildingDetailIds?: string[];
  schedule_job?: ScheduleJob[];
  cycle_id?: string;
}

export interface ScheduleJob {
  building_id: string;
  status: 'InProgress' | 'Completed' | 'Cancel';
  schedule_job_id: string;
  schedule_id: string;
  run_date: string;
  created_at: string;
  updated_at: string;
}

export interface ApiSchedule {
  schedule_id: string;
  schedule_name: string;
  schedule_type: string;
  description: string;
  start_date: string;
  end_date: string;
  buildingId?: string[];
  buildingDetailIds?: string[];
  cycle_id?: string;
  schedule_job?: ScheduleJob[];
  created_at: string;
  updated_at: string;
  schedule_status?: 'Pending' | 'InProgress' | 'Completed' | 'Cancel';
}
