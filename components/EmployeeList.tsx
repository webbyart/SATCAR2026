import React, { useState, useEffect } from 'react';
import { Plus, User, MapPin, Briefcase, Car, Bike, Trophy, TrendingUp, AlertCircle, Database } from 'lucide-react';
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
    try {
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
    } catch (e) {
        console.error("Failed to load employee data", e);
    } finally {
        setLoading(false);
    }
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
      setNewEmp({});
      loadData();
  }

  return (
    <div className="p-4 pb-24 bg-slate-50 min-h-screen">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">รายชื่อพนักงาน</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-indigo-500/50 transition-all active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
            <p className="text-center text-slate-400 animate-pulse mt-10">กำลังโหลดข้อมูล...</p>
        ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                    <Database size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">ไม่พบข้อมูลพนักงาน</h3>
                <p className="text-slate-500 text-sm mb-6">อาจยังไม่มีการสร้างตารางฐานข้อมูล หรือยังไม่ได้เพิ่มพนักงาน</p>
                <div className="bg-orange-50 text-orange-700 text-xs p-3 rounded-xl border border-orange-100 max-w-xs">
                    ไปที่เมนู <span className="font-bold">"ตั้งค่า"</span> และกด <span className="font-bold">"ดู SQL"</span> เพื่อนำโค้ดไปสร้างตารางใน Supabase
                </div>
            </div>
        ) : (
            employees.map(emp => (
            <div key={emp.id} className="bg-white p-4 rounded-3xl shadow-md border border-slate-100 flex flex-col gap-4 transition-all hover:shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={emp.photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-4 border-slate-50 shadow-md" />
                        <div className="absolute -bottom-1 -right-1 bg-green-400 w-4 h-4 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-extrabold text-slate-800 text-lg">{emp.first_name} {emp.last_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                            <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-indigo-100">{emp.department}</span>
                            <span className="text-xs text-slate-500 flex items-center bg-slate-50 px-2 rounded-lg">{emp.position}</span>
                        </div>
                    </div>
                </div>
                
                {/* Stats Row - Vibrant Design */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1 opacity-10 transform translate-x-2 -translate-y-2">
                            <Car size={48} className="text-blue-600"/>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-700 mb-0.5 z-10">
                            <Car size={16} className="fill-blue-200"/> 
                            <span className="text-[10px] font-bold uppercase tracking-widest">รถยนต์</span>
                        </div>
                        <span className="text-3xl font-black text-blue-800 z-10 tracking-tight">{emp.stats?.car}</span>
                        <span className="text-[10px] text-blue-600 font-medium z-10 bg-white/50 px-2 py-0.5 rounded-full mt-1">รายการ</span>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-1 opacity-10 transform translate-x-2 -translate-y-2">
                            <Bike size={48} className="text-orange-600"/>
                        </div>
                        <div className="flex items-center gap-1.5 text-orange-700 mb-0.5 z-10">
                            <Bike size={16} className="fill-orange-200"/> 
                            <span className="text-[10px] font-bold uppercase tracking-widest">มอเตอร์ไซค์</span>
                        </div>
                        <span className="text-3xl font-black text-orange-800 z-10 tracking-tight">{emp.stats?.motorcycle}</span>
                        <span className="text-[10px] text-orange-600 font-medium z-10 bg-white/50 px-2 py-0.5 rounded-full mt-1">รายการ</span>
                    </div>
                </div>
            </div>
        )))}
      </div>

      {/* Add Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in-up border border-white/20">
                  <h3 className="text-2xl font-bold mb-6 text-slate-800">เพิ่มพนักงานใหม่</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">ชื่อ</label>
                            <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all" placeholder="สมชาย" required onChange={e => setNewEmp({...newEmp, first_name: e.target.value})}/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">นามสกุล</label>
                            <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all" placeholder="ใจดี" required onChange={e => setNewEmp({...newEmp, last_name: e.target.value})}/>
                        </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">แผนก</label>
                          <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all" placeholder="IT / HR / Production" onChange={e => setNewEmp({...newEmp, department: e.target.value})}/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">ตำแหน่ง</label>
                          <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all" placeholder="Manager / Staff" onChange={e => setNewEmp({...newEmp, position: e.target.value})}/>
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 text-slate-500 bg-slate-100 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">ยกเลิก</button>
                        <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">บันทึก</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};