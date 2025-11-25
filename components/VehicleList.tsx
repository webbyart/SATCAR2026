import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Car, Bike, Camera, X } from 'lucide-react';
import { getVehicles, getEmployees, createVehicle } from '../services/supabaseService';
import { identifyLicensePlate } from '../services/geminiService';
import { Vehicle, Employee } from '../types';

export const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<(Vehicle & { employee?: Employee })[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({ type: 'car' });
  const [selectedEmp, setSelectedEmp] = useState('');
  
  // Camera for Reg
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [vData, eData] = await Promise.all([getVehicles(), getEmployees()]);
    setVehicles(vData);
    setEmployees(eData);
    setLoading(false);
  };

  const handleScanPlate = async () => {
    if (!videoRef.current) return;
    setScanning(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    try {
        const result = await identifyLicensePlate(base64);
        if (result) {
            setFormData(prev => ({ ...prev, license_plate: result.plate, province: result.province }));
            setShowCamera(false);
        } else {
            alert("AI มองไม่เห็นเลขทะเบียนที่ชัดเจน กรุณาลองใหม่");
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาด");
    }
    setScanning(false);
  };

  const startCamera = async () => {
      setShowCamera(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1920 } } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
          alert("ไม่สามารถเปิดกล้องได้");
          setShowCamera(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !formData.license_plate) return;

    await createVehicle({
        employee_id: selectedEmp,
        license_plate: formData.license_plate || '',
        province: formData.province || 'กรุงเทพมหานคร',
        type: formData.type || 'car',
        make: formData.make || '',
        model: formData.model || '',
        color: formData.color || '',
        photo_url: 'https://picsum.photos/400/300' // Placeholder
    });
    
    setShowModal(false);
    setFormData({ type: 'car' }); // Reset
    loadData();
  };

  return (
    <div className="p-4 pb-24 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">ทะเบียนรถทั้งหมด</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-teal-500 text-white p-2 rounded-full shadow-lg hover:bg-teal-600 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
          {loading ? <p className="text-center text-slate-400">กำลังโหลดข้อมูล...</p> : 
           vehicles.map(v => (
              <div key={v.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${v.type === 'car' ? 'bg-blue-100 text-blue-500' : 'bg-orange-100 text-orange-500'}`}>
                      {v.type === 'car' ? <Car size={24}/> : <Bike size={24}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-slate-800 text-lg">{v.license_plate}</h4>
                        <span className="text-xs text-slate-400 truncate ml-2">{v.province}</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{v.make} {v.model} • {v.color}</p>
                      <p className="text-xs text-teal-600 mt-1 font-medium truncate">เจ้าของ: {v.employee?.first_name} {v.employee?.last_name}</p>
                  </div>
              </div>
           ))
          }
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">ลงทะเบียนรถใหม่</h3>
                    <button onClick={() => setShowModal(false)}><X className="text-slate-400"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-500 mb-1">เจ้าของรถ</label>
                        <div className="relative">
                            <select 
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 appearance-none"
                                value={selectedEmp}
                                onChange={e => setSelectedEmp(e.target.value)}
                                required
                            >
                                <option value="">เลือกพนักงาน...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                                ))}
                            </select>
                             <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <div 
                           onClick={() => setFormData({...formData, type: 'car'})}
                           className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${formData.type === 'car' ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}
                         >
                            <Car className={formData.type === 'car' ? 'text-teal-600' : 'text-slate-400'} />
                            <span className={`text-sm font-medium ${formData.type === 'car' ? 'text-teal-700' : 'text-slate-500'}`}>รถยนต์</span>
                         </div>
                         <div 
                           onClick={() => setFormData({...formData, type: 'motorcycle'})}
                           className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${formData.type === 'motorcycle' ? 'border-teal-500 bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}
                         >
                            <Bike className={formData.type === 'motorcycle' ? 'text-teal-600' : 'text-slate-400'} />
                            <span className={`text-sm font-medium ${formData.type === 'motorcycle' ? 'text-teal-700' : 'text-slate-500'}`}>มอเตอร์ไซค์</span>
                         </div>
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="เลขทะเบียน (เช่น 1กข1234)"
                            className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200"
                            value={formData.license_plate || ''}
                            onChange={e => setFormData({...formData, license_plate: e.target.value})}
                            required
                        />
                        <button type="button" onClick={startCamera} className="bg-teal-100 p-3 rounded-xl text-teal-700 hover:bg-teal-200">
                            <Camera size={24} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <input 
                            type="text" 
                            placeholder="ยี่ห้อ (เช่น Toyota)" 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200"
                            value={formData.make || ''}
                            onChange={e => setFormData({...formData, make: e.target.value})}
                        />
                        <input 
                            type="text" 
                            placeholder="รุ่น" 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200"
                            value={formData.model || ''}
                            onChange={e => setFormData({...formData, model: e.target.value})}
                        />
                    </div>
                    <input 
                        type="text" 
                        placeholder="สีรถ" 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200"
                        value={formData.color || ''}
                        onChange={e => setFormData({...formData, color: e.target.value})}
                    />

                    <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg mt-2 active:scale-95 transition-transform">
                        บันทึกข้อมูล
                    </button>
                </form>

                {showCamera && (
                    <div className="absolute inset-0 bg-black rounded-3xl overflow-hidden flex flex-col z-10">
                        <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover"/>
                        <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
                            <button 
                                onClick={handleScanPlate} 
                                disabled={scanning}
                                className="w-full bg-white text-black py-4 rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2"
                            >
                                {scanning ? 'กำลังอ่าน...' : <><Camera size={20}/> ถ่ายภาพทะเบียน</>}
                            </button>
                             <button onClick={() => setShowCamera(false)} className="w-full bg-white/20 text-white py-3 rounded-xl backdrop-blur-md">
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};