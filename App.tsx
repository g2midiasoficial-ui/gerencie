import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import VehicleManager from './components/VehicleManager';
import MarketList from './components/MarketList';
import Income from './components/Income';
import Expenses from './components/Expenses';
import Transactions from './components/Transactions';
import Debts from './components/Debts';
import Categories from './components/Categories';
import Reports from './components/Reports';
import Goals from './components/Goals';
import Agent from './components/Agent';
import { Mode } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.PERSONAL);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    db.init();
  }, []);

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
        {/* Passa o estado de abertura para a Sidebar */}
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Ajuste de margem esquerda: ml-0 no mobile, ml-64 no desktop */}
        <div className="flex-1 flex flex-col h-screen w-full transition-all duration-300 md:ml-64">
          <TopBar 
            mode={mode} 
            setMode={setMode} 
            onMenuClick={() => setIsMobileMenuOpen(true)} 
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fef2f2]">
            <div className="max-w-7xl mx-auto pb-20">
              <Routes>
                <Route path="/" element={<Dashboard mode={mode} />} />
                <Route path="/agent" element={<Agent mode={mode} />} />
                <Route path="/income" element={<Income mode={mode} />} />
                <Route path="/expenses" element={<Expenses mode={mode} />} />
                <Route path="/transactions" element={<Transactions mode={mode} />} />
                <Route path="/debts" element={<Debts mode={mode} />} />
                <Route path="/categories" element={<Categories mode={mode} />} />
                <Route path="/reports" element={<Reports mode={mode} />} />
                <Route path="/goals" element={<Goals mode={mode} />} />
                <Route path="/vehicles" element={<VehicleManager mode={mode} />} />
                <Route path="/market" element={<MarketList mode={mode} />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;