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
      {/* Sticky Luxurious Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-teal-600 to-cyan-500 shadow-lg rounded-b-3xl">
        <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Logo Placeholder */}
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                    <Car className="text-white" size={24} />
                </div>
                <div className="text-white">
                    <h1 className="text-sm font-light opacity-90">{SYSTEM_NAME}</h1>
                    <p className="text-xs font-bold tracking-wide">{COMPANY_NAME}</p>
                </div>
            </div>
            {/* Connection Dot */}
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-lg mx-auto md:shadow-2xl md:min-h-screen bg-slate-50">
        {renderContent()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 pb-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 max-w-lg mx-auto">
        <div className="flex justify-between items-center">
            <NavButton 
                icon={<ScanLine />} 
                label="สแกน" 
                active={activeTab === 0} 
                onClick={() => setActiveTab(0)} 
            />
            <NavButton 
                icon={<Car />} 
                label="รถยนต์" 
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
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            active ? 'text-teal-600 transform -translate-y-2' : 'text-slate-300 hover:text-slate-400'
        }`}
    >
        <div className={`p-2 rounded-2xl ${active ? 'bg-teal-50 shadow-md shadow-teal-100' : 'bg-transparent'}`}>
            {React.cloneElement(icon as React.ReactElement, { size: active ? 24 : 22, strokeWidth: active ? 2.5 : 2 })}
        </div>
        <span className={`text-[10px] font-medium ${active ? 'opacity-100' : 'opacity-0'}`}>
            {label}
        </span>
    </button>
);

export default App;
