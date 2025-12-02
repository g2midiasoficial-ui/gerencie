import React, { useState, useEffect } from 'react';
import { MaintenanceItem, Mode } from '../types';
import { CheckCircle2, AlertTriangle, Wrench, Eye, Trash } from 'lucide-react';
import { db } from '../services/db';
import Modal from './Modal';

interface VehicleManagerProps {
    mode?: Mode;
}

const VehicleManager: React.FC<VehicleManagerProps> = ({ mode }) => {
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [system, setSystem] = useState('');
  const [dueIn, setDueIn] = useState('');
  const [status, setStatus] = useState<'Atrasada' | 'Pendente' | 'Em Dia'>('Pendente');

  useEffect(() => {
    const load = async () => {
        setMaintenances(await db.maintenance.getAll(mode));
    }
    load();
    window.addEventListener('db-change', load);
    return () => window.removeEventListener('db-change', load);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await db.maintenance.add({
          name,
          system,
          dueIn,
          status,
          mode
      });
      setIsModalOpen(false);
      setName('');
      setSystem('');
      setDueIn('');
  };

  const handleComplete = async (item: MaintenanceItem) => {
      await db.maintenance.update(item.id, { status: 'Em Dia', dueIn: 'Recém realizada' });
  };

  const handleDelete = async (id: string) => {
      if(confirm('Remover este item de manutenção?')) {
          await db.maintenance.delete(id);
      }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                     <div className="bg-red-100 p-2 rounded-lg">
                        <AlertTriangle className="text-red-600" size={24} />
                     </div>
                    <div>
                        <h2 className="font-bold text-xl text-gray-800">Manutenções Pendentes</h2>
                        <p className="text-sm text-gray-500">Gerencie a saúde da sua frota ou veículo pessoal</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-red-200"
                >
                    <Wrench size={18} />
                    Registrar Manutenção
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50">
                        <tr className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6">Tipo de Manutenção</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Vencimento</th>
                            <th className="py-4 px-6 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {maintenances.map((item) => (
                            <tr key={item.id} className="group hover:bg-red-50/30 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="font-semibold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-400 mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">
                                        {item.system}
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold border ${item.status === 'Em Dia' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-gray-600 text-sm font-medium">
                                    Em {item.dueIn}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {item.status !== 'Em Dia' && (
                                            <button 
                                                onClick={() => handleComplete(item)}
                                                className="border border-green-200 text-green-700 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all"
                                            >
                                                <CheckCircle2 size={14} />
                                                Concluir
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Manutenção">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Manutenção</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Ex: Troca de Pneus"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sistema</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Ex: Freios, Motor, Suspensão"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        value={system}
                        onChange={e => setSystem(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento (Estimativa)</label>
                    <input 
                        type="text" 
                        required
                        placeholder="Ex: 5.000 km ou 3 meses"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        value={dueIn}
                        onChange={e => setDueIn(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Inicial</label>
                    <select 
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                    >
                        <option value="Pendente">Pendente</option>
                        <option value="Atrasada">Atrasada</option>
                        <option value="Em Dia">Em Dia</option>
                    </select>
                </div>
                <button 
                    type="submit"
                    className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 mt-2"
                >
                    Salvar Manutenção
                </button>
            </form>
        </Modal>
    </div>
  );
};

export default VehicleManager;