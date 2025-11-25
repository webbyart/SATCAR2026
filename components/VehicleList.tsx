import React, { useState, useEffect, useRef } from 'react';
import { Plus, Car, Bike, Camera, X, Clock, Calendar } from 'lucide-react';
import { getVehicles, getEmployees, createVehicle, getVehicleScanHistory } from '../services/supabaseService';
import { identifyLicensePlate } from '../services/geminiService';
import { Vehicle, Employee, ScanLog } from '../types';

export const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<(Vehicle & { employee?: Employee })[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<(Vehicle & { employee?: Employee }) | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ScanLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({ type: 'car' });
  const [selectedEmp, setSelectedEmp] = useState('');
  
  // Camera
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

  const handleVehicleClick = async (vehicle: Vehicle & { employee?: Employee }) => {
      setSelectedVehicle(vehicle);
      setShowHistoryModal(true);
      setHistoryLoading(true);
      const logs = await getVehicleScanHistory(vehicle.id);
      setHistoryLogs(logs);
      setHistoryLoading(false);
  };

  // ... (Camera and Form logic remains similar but uses new styles) ...
  const startCamera = async () => {
      setShowCamera(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1920 } } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
          console.error(e);
          alert("Error opening camera");
          setShowCamera(false);
      }
  };

  const handleScanPlate = async () => {
    if (!videoRef.current) return;
    setScanning(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    
    try {
        const result = await identifyLicensePlate(base64);
        if (result) {
            setFormData(prev => ({ 
                ...prev, 
                license_plate: result.plate, 
                province: result.province,
                make: result.make || prev.make,
                color: result.color || prev.color
            }));
            closeCamera();
        } else {
            alert("AI could not read plate. Please try again.");
        }
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  const closeCamera = () => {
      if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      setShowCamera(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !formData.license_plate) return;

    await createVehicle({
        employee_id: selectedEmp,
        license_plate: formData.license_plate,
        province: formData.province || 'ไม่ระบุ',
        type: formData.type || 'car',
        make: formData.make || '',
        model: formData.model || '',
        color: formData.color || '',
        photo_url: 'https://picsum.photos/400/300'
    });
    
    setShowAddModal(false);
    setFormData({ type: 'car' });
    loadData();
  };

  return (
    <div className="p-4 pb-24 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">ยานพาหนะ</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Vehicle List */}
      <div className="space-y-4">
          {loading ? <p className="text-center text-slate-400">Loading...</p> : 
           vehicles.map(v => (
              <div 
                key={v.id} 
                onClick={() => handleVehicleClick(v)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 active:scale-98 transition-transform cursor-pointer"
              >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${v.type === 'car' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                      {v.type === 'car' ? <Car size={24}/> : <Bike size={24}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-slate-800 text-lg">{v.license_plate}</h4>
                        <span className="text-xs text-slate-400 truncate ml-2">{v.province}</span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{v.make} {v.model} • {v.color}</p>
                      <p className="text-xs text-indigo-500 mt-1 font-medium truncate">Owner: {v.employee?.first_name} {v.employee?.last_name}</p>
                  </div>
              </div>
           ))
          }
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedVehicle && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col animate-slide-up">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                      <div>
                          <h3 className="text-2xl font-bold text-slate-800">{selectedVehicle.license_plate}</h3>
                          <p className="text-sm text-slate-500">ประวัติการเข้า-ออก</p>
                      </div>
                      <button onClick={() => setShowHistoryModal(false)} className="bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      {historyLoading ? (
                          <p className="text-center text-slate-400 mt-10">กำลังโหลดประวัติ...</p>
                      ) : historyLogs.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                              <Clock size={48} className="mb-2 opacity-20"/>
                              <p>ยังไม่มีประวัติการบันทึก</p>
                          </div>
                      ) : (
                          historyLogs.map((log) => (
                              <div key={log.id} className="flex gap-4 relative pl-4">
                                  {/* Timeline Line */}
                                  <div className="absolute left-0 top-2 bottom-0 w-0.5 bg-slate-200"></div>
                                  <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                                  
                                  <div className="flex-1 pb-6">
                                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                          <div className="flex items-center gap-2 mb-1">
                                              <Calendar size={14} className="text-indigo-400"/>
                                              <span className="text-sm font-bold text-slate-700">
                                                  {new Date(log.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <Clock size={14} className="text-indigo-400"/>
                                              <span className="text-2xl font-mono font-medium text-slate-800">
                                                  {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">ลงทะเบียนรถใหม่</h3>
                    <button onClick={() => setShowAddModal(false)}><X className="text-slate-400"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                        value={selectedEmp}
                        onChange={e => setSelectedEmp(e.target.value)}
                        required
                    >
                        <option value="">เจ้าของรถ...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                         <div 
                           onClick={() => setFormData({...formData, type: 'car'})}
                           className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 ${formData.type === 'car' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}
                         >
                            <Car/> <span className="text-sm font-bold">รถยนต์</span>
                         </div>
                         <div 
                           onClick={() => setFormData({...formData, type: 'motorcycle'})}
                           className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 ${formData.type === 'motorcycle' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-400'}`}
                         >
                            <Bike/> <span className="text-sm font-bold">มอเตอร์ไซค์</span>
                         </div>
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="เลขทะเบียน (เช่น 1กข1234)"
                            className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                            value={formData.license_plate || ''}
                            onChange={e => setFormData({...formData, license_plate: e.target.value})}
                            required
                        />
                        <button type="button" onClick={startCamera} className="bg-indigo-100 p-3 rounded-xl text-indigo-700">
                            <Camera size={24} />
                        </button>
                    </div>
                    
                    <input type="text" placeholder="ยี่ห้อ (Toyota)" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" value={formData.make||''} onChange={e=>setFormData({...formData, make:e.target.value})}/>
                    <input type="text" placeholder="สีรถ" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" value={formData.color||''} onChange={e=>setFormData({...formData, color:e.target.value})}/>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg">
                        บันทึกข้อมูล
                    </button>
                </form>

                {showCamera && (
                    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
                        <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover"/>
                        <div className="p-6 bg-black flex flex-col gap-4">
                             <button onClick={handleScanPlate} disabled={scanning} className="w-full py-4 bg-white rounded-2xl font-bold text-lg">
                                {scanning ? 'Scanning...' : 'ถ่ายภาพ'}
                            </button>
                             <button onClick={closeCamera} className="w-full text-white py-3">ยกเลิก</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};