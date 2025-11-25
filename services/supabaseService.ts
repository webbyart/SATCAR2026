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
-- Enable UUID extension (Required for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE INDEX IF NOT EXISTS idx_vehicle_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON scan_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_employee ON scan_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_logs_vehicle ON scan_logs(vehicle_id);
  `;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    // Check if employees table exists by selecting 0 rows
    const { error } = await supabase.from('employees').select('*', { count: 'exact', head: true });
    if (error) {
      console.error("Database connection failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Unexpected error testing connection:", e);
    return false;
  }
};

// --- Data Methods ---

export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase.from('employees').select('*').order('first_name');
  if (error) {
    console.error("Error fetching employees:", error.message);
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
    console.error("Error fetching vehicles:", error.message);
    return [];
  }
  return data as any;
};

export const getVehiclesByEmployee = async (employeeId: string): Promise<Vehicle[]> => {
    const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('employee_id', employeeId);
    
    if (error) {
        console.error("Error fetching vehicles by employee:", error.message);
        return [];
    }
    return data as Vehicle[];
}

// Improved Fuzzy Search Logic
export const searchVehicleByPlate = async (plate: string): Promise<{ vehicle: Vehicle, employee: Employee } | null> => {
  // 1. Clean the input (remove spaces, dashes)
  const cleanInput = plate.replace(/[\s-]/g, '');

  if (!cleanInput) return null;

  // 2. Fetch all vehicles to perform robust matching in-memory
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, employee:employees(*)');

  if (error || !data) {
      console.error("Error searching vehicle:", error?.message);
      return null;
  }

  // 3. Find match with fuzzy logic
  const match = data.find((v: any) => {
      // Clean DB plate
      const dbPlate = v.license_plate.replace(/[\s-]/g, '');
      
      // A. Exact Match
      if (dbPlate === cleanInput) return true;
      
      // B. Input Contains DB Plate (e.g., input "5กฉ191กรุงเทพ", db "5กฉ191")
      if (cleanInput.includes(dbPlate) && dbPlate.length > 3) return true;
      
      return false;
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
  const { data, error } = await supabase.from('employees').insert(employee).select();
  if (error) console.error("Error creating employee:", error.message);
  return { data, error };
};

export const createVehicle = async (vehicle: Omit<Vehicle, 'id' | 'created_at'>) => {
  // Enforce no spaces in license plate storage for consistency
  const cleanVehicle = {
      ...vehicle,
      license_plate: vehicle.license_plate.replace(/\s/g, '')
  };
  const { data, error } = await supabase.from('vehicles').insert(cleanVehicle).select();
  if (error) console.error("Error creating vehicle:", error.message);
  return { data, error };
};

export const saveScanLog = async (log: Omit<ScanLog, 'id'>) => {
  const { data, error } = await supabase.from('scan_logs').insert(log);
  if (error) console.error("Error saving log:", error.message);
  return { data, error };
};

export const getLogsByDateRange = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('scan_logs')
    .select('*, employee:employees(first_name, last_name, department), vehicle:vehicles(license_plate, type)')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: false });
    
    if (error) {
        console.error("Error fetching logs:", error.message);
        return [];
    }
    return data;
};

export const getVehicleScanHistory = async (vehicleId: string) => {
    const { data, error } = await supabase
        .from('scan_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: false });
    
    if (error) {
        console.error("Error fetching history:", error.message);
        return [];
    }
    return data as ScanLog[];
};

export const getEmployeeScanStats = async () => {
    const { data, error } = await supabase
        .from('scan_logs')
        .select('employee_id, vehicle_type');
    
    if (error) {
        // If table doesn't exist yet, just return empty stats rather than crashing
        console.warn("Could not fetch stats (Scan logs table might be empty or missing):", error.message);
        return {};
    }
    
    const stats: Record<string, { car: number, motorcycle: number, win: number }> = {};
    
    data.forEach((log: any) => {
        if (!log.employee_id) return;
        
        if (!stats[log.employee_id]) {
            stats[log.employee_id] = { car: 0, motorcycle: 0, win: 0 };
        }
        
        const type = log.vehicle_type?.toLowerCase();
        
        if (type === 'car') stats[log.employee_id].car++;
        else if (type === 'motorcycle' || type === 'bike') stats[log.employee_id].motorcycle++;
        else stats[log.employee_id].win++;
    });
    
    return stats;
};