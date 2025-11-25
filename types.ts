export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
  photo_url: string;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  employee_id: string;
  license_plate: string;
  province: string;
  type: 'car' | 'motorcycle';
  make: string;
  model: string;
  color: string;
  photo_url?: string;
  created_at?: string;
}

export interface ScanLog {
  id: string;
  vehicle_id: string;
  employee_id: string; // denormalized for easier reporting
  timestamp: string;
  image_url?: string;
  vehicle_type: 'car' | 'motorcycle' | 'win'; // 'win' for manual entry if needed
}

export interface AppSettings {
  car_rate: number;
  motorcycle_rate: number;
  win_rate: number;
  admin_password?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  car_rate: 90,
  motorcycle_rate: 70,
  win_rate: 70,
};
