import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { Employee, Vehicle, ScanLog, AppSettings, DEFAULT_SETTINGS } from '../types';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Settings (LocalStorage for demo, but structure allows DB migration) ---
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
    vehicle_id UUID REFERENCES vehicles(id),
    employee_id UUID REFERENCES employees(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_url TEXT,
    vehicle_type TEXT
);

-- Indexes for performance
CREATE INDEX idx_vehicle_plate ON vehicles(license_plate);
CREATE INDEX idx_logs_timestamp ON scan_logs(timestamp);
  `;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('employees').select('count', { count: 'exact', head: true });
    return !error; // If table doesn't exist, it might error, but connection works if we get a response
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
  return data as any; // Supabase joins can be tricky with Typescript
};

export const getVehiclesByEmployee = async (employeeId: string): Promise<Vehicle[]> => {
    const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('employee_id', employeeId);
    
    if (error) return [];
    return data as Vehicle[];
}

export const searchVehicleByPlate = async (plate: string): Promise<{ vehicle: Vehicle, employee: Employee } | null> => {
  // Normalize plate: remove spaces
  const cleanPlate = plate.replace(/\s+/g, '');
  
  // Try to find exact match or partial match (Supabase generic search)
  // Note: For real robustness, you'd want a specialized function or text search
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, employee:employees(*)')
    .ilike('license_plate', `%${cleanPlate}%`)
    .limit(1)
    .single();

  if (error || !data) return null;
  
  return {
    vehicle: data as Vehicle,
    employee: data.employee as unknown as Employee
  };
};

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>) => {
  return await supabase.from('employees').insert(employee).select();
};

export const createVehicle = async (vehicle: Omit<Vehicle, 'id' | 'created_at'>) => {
  return await supabase.from('vehicles').insert(vehicle).select();
};

export const saveScanLog = async (log: Omit<ScanLog, 'id'>) => {
  return await supabase.from('scan_logs').insert(log);
};

export const getLogsByDateRange = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('scan_logs')
    .select('*, employee:employees(first_name, last_name, department), vehicle:vehicles(license_plate, type)')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate);
    
    if (error) return [];
    return data;
};
