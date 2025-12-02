import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, 
  Wallet, Tag, FileText, Target, ShoppingCart, Car, User, LogOut,
  Briefcase,
  RefreshCw,
  Database,
  Bot,
  X
} from 'lucide-react';
import { db } from '../services/db';
import DatabaseConfig from './DatabaseConfig';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Bot size={20} />, label: 'Agente IA', path: '/agent' },
    { icon: <ArrowUpCircle size={20} />, label: 'Receitas', path: '/income' },
    { icon: <ArrowDownCircle size={20} />, label: 'Despesas', path: '/expenses' },
    { icon: <ArrowLeftRight size={20} />, label: 'Transações', path: '/transactions' },
    { icon: <Wallet size={20} />, label: 'Dívidas', path: '/debts' },
    { icon: <Tag size={20} />, label: 'Categorias', path: '/categories' },
    { icon: <FileText size={20} />, label: 'Relatórios', path: '/reports' },
    { icon: <Target size={20} />, label: 'Metas', path: '/goals' },
    { icon: <ShoppingCart size={20} />, label: 'Mercado', path: '/market' },
    { icon: <Car size={20} />, label: 'Veículos', path: '/vehicles' },
    { icon: <User size={20} />, label: 'Perfil', path: '/profile' },
  ];

  const handleReset = () => {
      if (confirm('ATENÇÃO: Isso irá apagar todos os seus dados e restaurar os exemplos iniciais. Continuar?')) {
          db.reset();
          window.location.reload();
      }
  };

  return (
    <>
    {/* Mobile Overlay */}
    {isOpen && (
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
    )}

    {/* Sidebar Container */}
    <div className={`
      fixed left-0 top-0 bottom-0
      w-64 bg-white border-r border-red-100 flex flex-col z-50 overflow-y-auto font-sans
      transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg shadow-lg shadow-red-200 text-white">
             <Briefcase size={22} />
          </div>
          <div>
              <h1 className="text-xl font-bold text-red-700 tracking-tight leading-none">Gerencie</h1>
              <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">Suas Finanças</span>
          </div>
        </div>
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-red-600">
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 768) onClose();
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-red-600 text-white shadow-md shadow-red-200 translate-x-1'
                : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-red-50 space-y-1">
         <button onClick={() => setIsConfigOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            <Database size={20} />
            Conexão Nuvem
         </button>
         <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <RefreshCw size={20} />
            Resetar Dados
         </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </div>
    <DatabaseConfig isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};

export default Sidebar;