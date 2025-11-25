import React, { useState, useEffect } from 'react';
import { Plus, User, MapPin, Briefcase } from 'lucide-react';
import { getEmployees, getVehiclesByEmployee, createEmployee } from '../services/supabaseService';
import { Employee, Vehicle } from '../types';

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<(Employee & { vehicleCount?: number })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const emps = await getEmployees();
    
    // Enrich with vehicle count (inefficient for large datasets but ok for demo)
    const enriched = await Promise.all(emps.map(async (e) => {
        const vehicles = await getVehiclesByEmployee(e.id);
        return { ...e, vehicleCount: vehicles.length };
    }));
    
    setEmployees(enriched);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await createEmployee({
          employee_id: newEmp.employee_id || Math.random().toString(36).substr(2, 6),
          first_name: newEmp.first_name || '',
          last_name: newEmp.last_name || '',
          department: newEmp.department || '',
          position: newEmp.position || '',
          photo_url: 'https://picsum.photos/200'
      });
      setShowModal(false);
      loadData();
  }

  return (
    <div className="p-4 pb-24 bg-slate-50 min-h-screen">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">พนักงาน</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-teal-500 text-white p-2 rounded-full shadow-lg hover:bg-teal-600"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? <p className="text-center text-slate-400">Loading...</p> : employees.map(emp => (
            <div key={emp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <img src={emp.photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-teal-50" />
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{emp.first_name} {emp.last_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Briefcase size={12}/> {emp.position}
                    </div>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={12}/> {emp.department}
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-50 p-2 rounded-lg min-w-[60px]">
                    <span className="text-2xl font-bold text-teal-600">{emp.vehicleCount}</span>
                    <span className="text-[10px] text-slate-400">ยานพาหนะ</span>
                </div>
            </div>
        ))}
      </div>

      {/* Simplified Add Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4">เพิ่มพนักงานใหม่</h3>
                  <form onSubmit={handleSubmit} className="space-y-3">
                      <input className="w-full p-3 bg-slate-50 rounded-xl" placeholder="ชื่อ" required onChange={e => setNewEmp({...newEmp, first_name: e.target.value})}/>
                      <input className="w-full p-3 bg-slate-50 rounded-xl" placeholder="นามสกุล" required onChange={e => setNewEmp({...newEmp, last_name: e.target.value})}/>
                      <input className="w-full p-3 bg-slate-50 rounded-xl" placeholder="แผนก" onChange={e => setNewEmp({...newEmp, department: e.target.value})}/>
                      <input className="w-full p-3 bg-slate-50 rounded-xl" placeholder="ตำแหน่ง" onChange={e => setNewEmp({...newEmp, position: e.target.value})}/>
                      <button className="w-full bg-teal-500 text-white py-3 rounded-xl font-bold mt-2">บันทึก</button>
                      <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 py-2">ยกเลิก</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
