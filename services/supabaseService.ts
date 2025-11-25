import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { Employee, Vehicle, ScanLog, AppSettings, DEFAULT_SETTINGS } from '../types';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Settings ---
export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('app_settings');
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem('app_settings', JSON.stringify(settings));
};

// --- SQL Generator ---
export const generateSQL = () => {
  return `
-- Create Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    department TEXT,
    position TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL,
    province TEXT,
    type TEXT CHECK (type IN ('car', 'motorcycle')),
    make TEXT,
    model TEXT,
    color TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Scan Logs Table
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id), -- Nullable for 'win'
    employee_id UUID REFERENCES employees(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_url TEXT,
    vehicle_type TEXT
);

-- Indexes for performance
CREATE INDEX idx_vehicle_plate ON vehicles(license_plate);
CREATE INDEX idx_logs_timestamp ON scan_logs(timestamp);
CREATE INDEX idx_logs_employee ON scan_logs(employee_id);
CREATE INDEX idx_logs_vehicle ON scan_logs(vehicle_id);
  `;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('employees').select('count', { count: 'exact', head: true });
    return !error;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// --- Data Methods ---

export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase.from('employees').select('*').order('first_name');
  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
  return data as Employee[];
};

export const getVehicles = async (): Promise<(Vehicle & { employee?: Employee })[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, employee:employees(*)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
  return data as any;
};

export const getVehiclesByEmployee = async (employeeId: string): Promise<Vehicle[]> => {
    const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('employee_id', employeeId);
    
    if (error) return [];
    return data as Vehicle[];
}

// Fixed Search Logic: Handles spaces intelligently
export const searchVehicleByPlate = async (plate: string): Promise<{ vehicle: Vehicle, employee: Employee } | null> => {
  // 1. Clean the input (remove spaces, dashes)
  const cleanInput = plate.replace(/[\s-]/g, '');

  // 2. Fetch all vehicles (For a small app this is fine, for large scale use RPC or Text Search)
  // We fetch all because we need to clean the DB values to compare accurately if they aren't normalized in DB.
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, employee:employees(*)');

  if (error || !data) return null;

  // 3. Find match in JS
  const match = data.find((v: any) => {
      const dbPlate = v.license_plate.replace(/[\s-]/g, '');
      return dbPlate === cleanInput;
  });

  if (match) {
    return {
      vehicle: match as Vehicle,
      employee: match.employee as unknown as Employee
    };
  }
  
  return null;
};

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>) => {
  return await supabase.from('employees').insert(employee).select();
};

export const createVehicle = async (vehicle: Omit<Vehicle, 'id' | 'created_at'>) => {
  // Enforce no spaces in license plate storage for consistency
  const cleanVehicle = {
      ...vehicle,
      license_plate: vehicle.license_plate.replace(/\s/g, '')
  };
  return await supabase.from('vehicles').insert(cleanVehicle).select();
};

export const saveScanLog = async (log: Omit<ScanLog, 'id'>) => {
  return await supabase.from('scan_logs').insert(log);
};

export const getLogsByDateRange = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('scan_logs')
    .select('*, employee:employees(first_name, last_name, department), vehicle:vehicles(license_plate, type)')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: false });
    
    if (error) return [];
    return data;
};

// New: Get Scan History for a specific Vehicle
export const getVehicleScanHistory = async (vehicleId: string) => {
    const { data, error } = await supabase
        .from('scan_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: false });
    
    if (error) return [];
    return data as ScanLog[];
};

// New: Get Employee Scan Stats
export const getEmployeeScanStats = async () => {
    const { data, error } = await supabase
        .from('scan_logs')
        .select('employee_id, vehicle_type');
    
    if (error) return {};
    
    // Aggregation
    const stats: Record<string, { car: number, motorcycle: number, win: number }> = {};
    
    data.forEach((log: any) => {
        if (!stats[log.employee_id]) {
            stats[log.employee_id] = { car: 0, motorcycle: 0, win: 0 };
        }
        if (log.vehicle_type === 'car') stats[log.employee_id].car++;
        else if (log.vehicle_type === 'motorcycle') stats[log.employee_id].motorcycle++;
        else stats[log.employee_id].win++;
    });
    
    return stats;
};