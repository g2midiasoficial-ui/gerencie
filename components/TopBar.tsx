import React from 'react';
import { Mode } from '../types';
import { Building2, User, Menu } from 'lucide-react';

interface TopBarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ mode, setMode, onMenuClick }) => {
  return (
    <div className="bg-white px-4 md:px-8 py-4 flex justify-between items-center shadow-sm border-b border-red-50 sticky top-0 z-20">
      
      {/* Botão Menu Mobile */}
      <div className="flex items-center gap-3 md:hidden">
        <button 
          onClick={onMenuClick}
          className="p-2 text-gray-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <span className="font-bold text-red-700 text-sm">Gerencie</span>
      </div>
      
      <div className="flex-1 hidden md:block"></div> {/* Spacer desktop */}
      
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex bg-red-50 rounded-lg p-1 border border-red-100">
          <button
            onClick={() => setMode(Mode.PERSONAL)}
            className={`flex items-center gap-1 md:gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
              mode === Mode.PERSONAL
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-700 hover:bg-red-100/50'
            }`}
          >
            <User size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Pessoal</span>
            <span className="sm:hidden">Eu</span>
          </button>
          <button
            onClick={() => setMode(Mode.BUSINESS)}
            className={`flex items-center gap-1 md:gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
              mode === Mode.BUSINESS
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-700 hover:bg-red-100/50'
            }`}
          >
            <Building2 size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Empresarial</span>
            <span className="sm:hidden">Emp</span>
          </button>
        </div>

        <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-100">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-700">João Wilson</p>
                <p className="text-xs text-gray-400">Premium</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-bold shadow-lg shadow-red-200 border-2 border-white cursor-pointer hover:scale-105 transition-transform text-xs md:text-base">
            JW
            </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;