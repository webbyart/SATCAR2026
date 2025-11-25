import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Save, CheckCircle, AlertTriangle, Search, User, Bike, Zap } from 'lucide-react';
import { identifyLicensePlate } from '../services/geminiService';
import { searchVehicleByPlate, saveScanLog, getEmployees } from '../services/supabaseService';
import { Employee, Vehicle } from '../types';

export const Scanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ vehicle: Vehicle; employee: Employee } | null>(null);
  const [manualPlate, setManualPlate] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Win/Walk-in Mode
  const [showWinModal, setShowWinModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  const startCamera = async () => {
    setMessage(null);
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setMessage({ type: 'error', text: 'Browser requires HTTPS.' });
      return;
    }
    try {
      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'ไม่สามารถเปิดกล้องได้' });
    }
  };

  useEffect(() => {
    startCamera();
    getEmployees().then(setEmployees);
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    setResult(null);
    setMessage(null);

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.9).split(',')[1];
      
      try {
        const aiResult = await identifyLicensePlate(base64Image);
        if (aiResult?.plate) {
           setManualPlate(aiResult.plate);
           const dbResult = await searchVehicleByPlate(aiResult.plate);
           if (dbResult) {
             setResult(dbResult);
             setMessage({ type: 'success', text: `พบข้อมูล: ${dbResult.employee.first_name}` });
           } else {
             setMessage({ type: 'error', text: `ไม่พบรถทะเบียน ${aiResult.plate} ในระบบ (ลองค้นหาด้วยมือ)` });
           }
        } else {
            setMessage({ type: 'error', text: 'AI อ่านป้ายไม่ชัดเจน' });
        }
      } catch (err) {
          setMessage({ type: 'error', text: 'Error เชื่อมต่อ AI' });
      }
    }
    setScanning(false);
  };

  const handleManualSearch = async () => {
     if(!manualPlate) return;
     setScanning(true);
     // Auto-remove spaces for search stability
     const cleanPlate = manualPlate.replace(/\s+/g, '');
     
     const dbResult = await searchVehicleByPlate(cleanPlate);
     if (dbResult) {
        setResult(dbResult);
        setMessage({ type: 'success', text: 'พบข้อมูลพนักงาน' });
     } else {
        setMessage({ type: 'error', text: 'ไม่พบข้อมูลในระบบ' });
        setResult(null);
     }
     setScanning(false);
  }

  const handleSave = async () => {
      if(!result) return;
      try {
          await saveScanLog({
              vehicle_id: result.vehicle.id,
              employee_id: result.employee.id,
              timestamp: new Date().toISOString(),
              vehicle_type: result.vehicle.type
          });
          setMessage({ type: 'success', text: 'บันทึกสำเร็จ' });
          setResult(null);
          setManualPlate('');
          setTimeout(() => setMessage(null), 3000);
      } catch (e) {
          setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ' });
      }
  }

  const handleSaveWin = async () => {
      if(!selectedEmpId) return;
      try {
          await saveScanLog({
              vehicle_id: null as any, 
              employee_id: selectedEmpId,
              timestamp: new Date().toISOString(),
              vehicle_type: 'win'
          });
          setShowWinModal(false);
          setMessage({ type: 'success', text: 'บันทึก (วิน) เรียบร้อย' });
          setTimeout(() => setMessage(null), 3000);
      } catch (e) {
          setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ' });
      }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 space-y-4 pb-24 overflow-y-auto">
      {/* Camera */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-white/50 group">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        
        {scanning && (
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent animate-scan z-10 pointer-events-none border-b-2 border-indigo-400"></div>
        )}

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="w-64 h-32 border-2 border-white/80 rounded-xl relative">
                <div className="absolute -bottom-12 w-full text-center">
                    <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                        {scanning ? 'กำลังค้นหา...' : 'กรอบป้ายทะเบียน'}
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        onClick={captureAndScan}
        disabled={scanning}
        className={`w-full py-5 rounded-2xl text-white font-bold text-xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 ${
            scanning ? 'bg-slate-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}
      >
        {scanning ? 'Processing...' : <><Camera size={28} /> สแกนป้ายทะเบียน</>}
      </button>

      {/* Search & Win */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    value={manualPlate}
                    onChange={(e) => setManualPlate(e.target.value)}
                    placeholder="ค้นหาทะเบียน (เช่น 1กก1234)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
            </div>
            <button 
                onClick={handleManualSearch}
                className="bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl border border-indigo-100 hover:bg-indigo-100"
            >
                <Search size={24} />
            </button>
          </div>
          
          <button 
            onClick={() => setShowWinModal(true)}
            className="w-full py-3 bg-orange-50 text-orange-600 rounded-xl font-semibold flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-100"
          >
              <Bike size={20} /> บันทึก วิน/รถรับจ้าง
          </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in-up shadow-md ${
            message.type === 'success' ? 'bg-green-500 text-white' : 
            message.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}>
            {message.type === 'success' ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
            <span className="font-medium text-base">{message.text}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-3xl shadow-xl p-6 border-t-4 border-indigo-500 space-y-4 animate-slide-up">
            <div className="flex items-center gap-4">
                <img src={result.employee.photo_url || "https://picsum.photos/200"} className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-sm object-cover" />
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">{result.employee.first_name} {result.employee.last_name}</h3>
                    <p className="text-indigo-600 font-medium">{result.employee.department}</p>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">ทะเบียน</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${result.vehicle.type==='car'?'bg-blue-100 text-blue-600':'bg-orange-100 text-orange-600'}`}>
                        {result.vehicle.type === 'car' ? 'Car' : 'Moto'}
                    </span>
                </div>
                <div className="text-3xl font-black text-slate-800 tracking-tight">{result.vehicle.license_plate}</div>
                <div className="text-sm text-slate-500">{result.vehicle.make} {result.vehicle.model} - {result.vehicle.color}</div>
            </div>

            <button 
                onClick={handleSave}
                className="w-full bg-green-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-600 flex items-center justify-center gap-2 text-lg"
            >
                <Save size={24} /> ยืนยัน (Confirm)
            </button>
        </div>
      )}

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up">
                <h3 className="text-xl font-bold mb-4 text-slate-800">บันทึกวิน/รถรับจ้าง</h3>
                <div className="space-y-4">
                    <select 
                        className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-lg"
                        value={selectedEmpId}
                        onChange={(e) => setSelectedEmpId(e.target.value)}
                    >
                        <option value="">-- เลือกพนักงาน --</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                        ))}
                    </select>
                    <div className="flex gap-3">
                        <button onClick={() => setShowWinModal(false)} className="flex-1 py-4 text-slate-500 bg-slate-100 rounded-xl font-bold">ยกเลิก</button>
                        <button onClick={handleSaveWin} className="flex-1 py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg">บันทึก</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};