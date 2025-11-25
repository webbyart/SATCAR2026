import React, { useState } from 'react';
import { Scanner } from './components/Scanner';
import { VehicleList } from './components/VehicleList';
import { EmployeeList } from './components/EmployeeList';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { ScanLine, Car, Users, FileText, Settings as SettingsIcon } from 'lucide-react';
import { COMPANY_NAME, SYSTEM_NAME } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const renderContent = () => {
    switch (activeTab) {
      case 0: return <Scanner />;
      case 1: return <VehicleList />;
      case 2: return <EmployeeList />;
      case 3: return <Reports />;
      case 4: return <Settings />;
      default: return <Scanner />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-600 shadow-xl rounded-b-[2rem]">
        <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
                    <Car className="text-white drop-shadow-md" size={28} />
                </div>
                <div className="text-white">
                    <h1 className="text-xs font-medium opacity-80 uppercase tracking-widest mb-0.5">{SYSTEM_NAME}</h1>
                    <p className="text-sm font-bold tracking-wide">{COMPANY_NAME}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,1)] animate-pulse"></div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-lg mx-auto md:shadow-2xl md:min-h-screen bg-slate-50">
        {renderContent()}
      </main>

      {/* Luxury Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-indigo-50 px-6 py-2 pb-6 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 max-w-lg mx-auto">
        <div className="flex justify-between items-center">
            <NavButton 
                icon={<ScanLine />} 
                label="สแกน" 
                active={activeTab === 0} 
                onClick={() => setActiveTab(0)} 
            />
            <NavButton 
                icon={<Car />} 
                label="ยานพาหนะ" 
                active={activeTab === 1} 
                onClick={() => setActiveTab(1)} 
            />
             <NavButton 
                icon={<Users />} 
                label="พนักงาน" 
                active={activeTab === 2} 
                onClick={() => setActiveTab(2)} 
            />
             <NavButton 
                icon={<FileText />} 
                label="รายงาน" 
                active={activeTab === 3} 
                onClick={() => setActiveTab(3)} 
            />
             <NavButton 
                icon={<SettingsIcon />} 
                label="ตั้งค่า" 
                active={activeTab === 4} 
                onClick={() => setActiveTab(4)} 
            />
        </div>
      </nav>
    </div>
  );
};

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 transition-all duration-300 w-16 group ${
            active ? 'transform -translate-y-3' : 'hover:opacity-70'
        }`}
    >
        <div className={`p-3 rounded-2xl transition-all duration-300 ${
            active 
            ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-300' 
            : 'bg-transparent text-slate-400 group-hover:bg-slate-50'
        }`}>
            {React.cloneElement(icon as React.ReactElement, { size: active ? 24 : 24, strokeWidth: active ? 2.5 : 2 })}
        </div>
        <span className={`text-[10px] font-bold transition-all duration-300 ${
            active ? 'text-indigo-600 opacity-100 scale-100' : 'text-slate-400 opacity-0 scale-0 h-0'
        }`}>
            {label}
        </span>
    </button>
);

export default App;