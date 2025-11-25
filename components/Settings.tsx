import React, { useState, useEffect } from 'react';
import { Database, Code, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { generateSQL, testConnection, getSettings, saveSettings } from '../services/supabaseService';
import { AppSettings } from '../types';

export const Settings: React.FC = () => {
  const [sql, setSql] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [settings, setLocalSettings] = useState<AppSettings>(getSettings());

  useEffect(() => {
    setSql(generateSQL());
  }, []);

  const handleTestDb = async () => {
    setDbStatus('idle');
    const success = await testConnection();
    setDbStatus(success ? 'success' : 'error');
  };

  const handleSaveSettings = () => {
      saveSettings(settings);
      alert("บันทึกการตั้งค่าเรียบร้อย");
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">ตั้งค่าระบบ</h2>

      {/* Pricing Settings */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><DollarSignIcon/> กำหนดราคาค่าเดินทาง</h3>
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <label className="text-slate-600">รถยนต์ (บาท/วัน)</label>
                  <input 
                    type="number" 
                    value={settings.car_rate}
                    onChange={(e) => setLocalSettings({...settings, car_rate: Number(e.target.value)})}
                    className="w-24 p-2 bg-slate-50 border rounded-lg text-right font-bold text-slate-800"
                  />
              </div>
               <div className="flex justify-between items-center">
                  <label className="text-slate-600">มอเตอร์ไซค์ (บาท/วัน)</label>
                  <input 
                    type="number" 
                    value={settings.motorcycle_rate}
                    onChange={(e) => setLocalSettings({...settings, motorcycle_rate: Number(e.target.value)})}
                    className="w-24 p-2 bg-slate-50 border rounded-lg text-right font-bold text-slate-800"
                  />
              </div>
               <div className="flex justify-between items-center">
                  <label className="text-slate-600">วิน/รถรับจ้าง (บาท/วัน)</label>
                  <input 
                    type="number" 
                    value={settings.win_rate}
                    onChange={(e) => setLocalSettings({...settings, win_rate: Number(e.target.value)})}
                    className="w-24 p-2 bg-slate-50 border rounded-lg text-right font-bold text-slate-800"
                  />
              </div>
              <button onClick={handleSaveSettings} className="w-full bg-teal-500 text-white py-2 rounded-xl mt-2 flex justify-center gap-2">
                  <Save size={18}/> บันทึกราคา
              </button>
          </div>
      </div>

      {/* Database Tools */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Database size={20}/> ฐานข้อมูล</h3>
           
           <div className="flex gap-2 mb-4">
               <button onClick={handleTestDb} className="flex-1 bg-sky-50 text-sky-600 py-3 rounded-xl font-semibold hover:bg-sky-100 transition-colors">
                   ทดสอบการเชื่อมต่อ
               </button>
               <button onClick={() => setShowSql(!showSql)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                   <Code size={20}/> {showSql ? 'ซ่อน SQL' : 'ดู SQL'}
               </button>
           </div>

           {dbStatus !== 'idle' && (
               <div className={`p-4 rounded-xl flex items-center gap-3 mb-4 ${dbStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                   {dbStatus === 'success' ? <CheckCircle/> : <AlertCircle/>}
                   {dbStatus === 'success' ? 'เชื่อมต่อ Supabase สำเร็จ' : 'ไม่สามารถเชื่อมต่อได้ ตรวจสอบ URL/Key'}
               </div>
           )}

           {showSql && (
               <div className="relative">
                   <textarea 
                    readOnly 
                    value={sql} 
                    className="w-full h-64 p-4 bg-slate-800 text-green-400 text-xs font-mono rounded-xl resize-none"
                   />
                   <button 
                    onClick={() => navigator.clipboard.writeText(sql)}
                    className="absolute top-2 right-2 bg-white/20 text-white text-xs px-2 py-1 rounded hover:bg-white/30"
                   >
                       Copy
                   </button>
               </div>
           )}
      </div>
    </div>
  );
};

// Helper icon
const DollarSignIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
)
