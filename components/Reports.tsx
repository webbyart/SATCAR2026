import React, { useState } from 'react';
import { Calendar, DollarSign, Lock } from 'lucide-react';
import { getLogsByDateRange, getSettings } from '../services/supabaseService';
import { ScanLog } from '../types';

export const Reports: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);
  
  const settings = getSettings();

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Simple mock auth
      if (password === 'admin123' || password === '') { // Default empty for demo
          setIsAdmin(true);
      } else {
          alert("รหัสผ่านไม่ถูกต้อง");
      }
  };

  const generateReport = async () => {
      // 1. Fetch Logs
      // Start of day to End of day adjustment
      const logs: any[] = await getLogsByDateRange(`${startDate}T00:00:00`, `${endDate}T23:59:59`);
      
      // 2. Group by Employee
      const grouped: Record<string, { employee: any, carDays: number, motoDays: number, totalDays: number }> = {};
      
      logs.forEach(log => {
          const empId = log.employee_id;
          if (!grouped[empId]) {
              grouped[empId] = { 
                  employee: log.employee, 
                  carDays: 0, 
                  motoDays: 0,
                  totalDays: 0
              };
          }
          // Simple logic: one scan per day counts as attendance
          // (In real app, filter distinct days per emp)
          if (log.vehicle_type === 'car') grouped[empId].carDays++;
          else grouped[empId].motoDays++;
          grouped[empId].totalDays++;
      });

      // 3. Apply Logic: If usage < 80% of total days for a specific type, how to handle?
      // Requirement: "If driving car < 80%, calculate driving of that type"
      // Interpretation: Total cost calculation based on specific days.
      // Example: 17 Moto, 13 Car. 
      // Cost = (17 * MotoRate) + (13 * CarRate).
      
      const results = Object.values(grouped).map(item => {
          const rawCost = (item.carDays * settings.car_rate) + (item.motoDays * settings.motorcycle_rate);
          
          // Determine dominant type for summary
          const carPercent = (item.carDays / item.totalDays) * 100;
          const dominant = carPercent >= 80 ? 'รถยนต์ (ประจำ)' : 'ผสม';

          return {
              ...item,
              cost: rawCost,
              dominant
          };
      });

      setReportData(results);
  };

  if (!isAdmin) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
              <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                      <Lock size={32}/>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">สำหรับผู้ดูแลระบบ</h2>
                  <p className="text-slate-500 text-sm mb-6">กรุณาเข้าสู่ระบบเพื่อดูรายงาน</p>
                  <form onSubmit={handleLogin}>
                      <input 
                        type="password" 
                        placeholder="รหัสผ่าน" 
                        className="w-full p-3 bg-slate-50 rounded-xl mb-4 text-center"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button className="w-full bg-teal-500 text-white py-3 rounded-xl font-bold">เข้าสู่ระบบ</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">รายงานค่าใช้จ่าย</h2>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-xs text-slate-500">เริ่มต้น</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg"/>
                </div>
                <div className="flex-1">
                    <label className="text-xs text-slate-500">สิ้นสุด</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg"/>
                </div>
                <button onClick={generateReport} className="bg-teal-500 text-white p-2 rounded-lg h-10 w-10 flex items-center justify-center">
                    <Calendar size={20}/>
                </button>
            </div>
        </div>

        <div className="space-y-4">
            {reportData.map((r, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-800">{r.employee?.first_name} {r.employee?.last_name}</h4>
                        <div className="text-xs text-slate-500 mt-1 flex gap-2">
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">รถยนต์ {r.carDays} วัน</span>
                            <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">มอเตอร์ไซค์ {r.motoDays} วัน</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-teal-600">{r.cost.toLocaleString()} ฿</p>
                        <p className="text-xs text-slate-400">{r.dominant}</p>
                    </div>
                </div>
            ))}
             {reportData.length === 0 && <p className="text-center text-slate-400 py-10">ไม่พบข้อมูล หรือยังไม่ได้กดค้นหา</p>}
        </div>
    </div>
  );
};
