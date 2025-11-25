import React, { useState, useEffect } from 'react';
import { Plus, User, MapPin, Briefcase, Car, Bike } from 'lucide-react';
import { getEmployees, getEmployeeScanStats, createEmployee } from '../services/supabaseService';
import { Employee } from '../types';

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<(Employee & { stats?: { car: number, motorcycle: number, win: number } })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [emps, stats] = await Promise.all([
        getEmployees(),
        getEmployeeScanStats()
    ]);
    
    // Merge stats
    const enriched = emps.map(e => ({
        ...e,
        stats: stats[e.id] || { car: 0, motorcycle: 0, win: 0 }
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
        <h2 className="text-2xl font-bold text-slate-800">รายชื่อพนักงาน</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? <p className="text-center text-slate-400">Loading...</p> : employees.map(emp => (
            <div key={emp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                    <img src={emp.photo_url} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-lg">{emp.first_name} {emp.last_name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">{emp.department}</span>
                            <span>{emp.position}</span>
                        </div>
                    </div>
                </div>
                
                {/* Stats Row */}
                <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <div className="flex-1 bg-blue-50 rounded-xl p-2 flex items-center justify-between px-3">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Car size={16}/> <span className="text-xs font-bold">รถยนต์</span>
                        </div>
                        <span className="font-bold text-blue-700">{emp.stats?.car}</span>
                    </div>
                    <div className="flex-1 bg-orange-50 rounded-xl p-2 flex items-center justify-between px-3">
                        <div className="flex items-center gap-2 text-orange-600">
                            <Bike size={16}/> <span className="text-xs font-bold">มอเตอร์ไซค์</span>
                        </div>
                        <span className="font-bold text-orange-700">{emp.stats?.motorcycle}</span>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                  <h3 className="text-xl font-bold mb-4">เพิ่มพนักงานใหม่</h3>
                  <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="ชื่อ" required onChange={e => setNewEmp({...newEmp, first_name: e.target.value})}/>
                        <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="นามสกุล" required onChange={e => setNewEmp({...newEmp, last_name: e.target.value})}/>
                      </div>
                      <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="แผนก (Department)" onChange={e => setNewEmp({...newEmp, department: e.target.value})}/>
                      <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="ตำแหน่ง (Position)" onChange={e => setNewEmp({...newEmp, position: e.target.value})}/>
                      
                      <div className="pt-2">
                        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">บันทึก</button>
                        <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 py-3 mt-1 hover:text-slate-600">ยกเลิก</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};