import React, { useState, useEffect } from 'react';
import { Target, Trophy, Plane, Car, Home, Plus, Trash } from 'lucide-react';
import { Goal, Mode } from '../types';
import { db } from '../services/db';
import Modal from './Modal';

interface GoalsProps {
    mode?: Mode;
}

const Goals: React.FC<GoalsProps> = ({ mode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Create Form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('trophy');

  // Deposit Form
  const [depositValue, setDepositValue] = useState('');

  useEffect(() => {
     const load = async () => setGoals(await db.goals.getAll(mode));
     load();
     window.addEventListener('db-change', load);
     return () => window.removeEventListener('db-change', load);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await db.goals.add({
          name,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          deadline,
          icon,
          mode
      });
      setIsModalOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
  };

  const handleOpenDeposit = (goal: Goal) => {
      setSelectedGoal(goal);
      setDepositModalOpen(true);
      setDepositValue('');
  };

  const handleDeposit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedGoal && depositValue) {
          const val = parseFloat(depositValue);
          await db.goals.update(selectedGoal.id, {
              currentAmount: Number(selectedGoal.currentAmount) + val
          });
          
          // Optionally add an expense transaction for this deposit
          if(confirm('Deseja registrar esse depósito como uma despesa?')) {
              await db.transactions.add({
                  description: `Depósito Meta: ${selectedGoal.name}`,
                  amount: val,
                  type: 'expense',
                  status: 'paid',
                  date: new Date().toISOString().split('T')[0],
                  category: 'Investimento',
                  mode: mode
              });
          }

          setDepositModalOpen(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm('Tem certeza que deseja excluir esta meta?')) {
          await db.goals.delete(id);
      }
  };

  const getIcon = (type?: string) => {
      switch(type) {
          case 'plane': return <Plane className="text-blue-500" size={24} />;
          case 'car': return <Car className="text-red-500" size={24} />;
          case 'home': return <Home className="text-green-500" size={24} />;
          default: return <Trophy className="text-yellow-500" size={24} />;
      }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Target className="text-red-600" /> Metas Financeiras
                </h2>
                <p className="text-gray-500 text-sm">Defina objetivos e acompanhe seu progresso</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
            >
                <Plus size={18} /> Nova Meta
            </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {goals.map(goal => {
                const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const isComplete = percentage >= 100;

                return (
                    <div key={goal.id} className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 flex flex-col md:flex-row items-center gap-6 group">
                         <div className={`p-4 rounded-full ${isComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
                             {getIcon(goal.icon)}
                         </div>
                         
                         <div className="flex-1 w-full">
                             <div className="flex justify-between items-end mb-2">
                                 <div>
                                     <h3 className="font-bold text-lg text-gray-800">{goal.name}</h3>
                                     <p className="text-sm text-gray-500">Meta: {goal.deadline}</p>
                                 </div>
                                 <div className="text-right">
                                     <span className="text-sm font-semibold text-gray-500">R$ {goal.currentAmount.toLocaleString()} de </span>
                                     <span className="text-lg font-bold text-gray-800">R$ {goal.targetAmount.toLocaleString()}</span>
                                 </div>
                             </div>
                             
                             <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-green-500' : 'bg-red-500'}`} 
                                    style={{ width: `${percentage}%` }}
                                 ></div>
                             </div>
                         </div>

                         <div className="w-full md:w-auto flex flex-col items-center">
                             <span className={`text-2xl font-bold ${isComplete ? 'text-green-600' : 'text-gray-800'}`}>
                                 {percentage.toFixed(0)}%
                             </span>
                             {isComplete ? (
                                 <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded">Concluída</span>
                             ) : (
                                 <span className="text-xs text-gray-400">Em andamento</span>
                             )}
                         </div>
                         
                         <div className="w-full md:w-auto flex flex-col gap-2">
                            <button 
                                onClick={() => handleOpenDeposit(goal)}
                                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                            >
                                Depositar
                            </button>
                            <button 
                                onClick={() => handleDelete(goal.id)}
                                className="w-full border border-gray-200 text-gray-400 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-500 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash size={14} /> Excluir
                            </button>
                         </div>
                    </div>
                )
            })}
        </div>

        {/* Create Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Meta">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Meta</label>
                    <input type="text" required placeholder="Ex: Comprar Carro" className="w-full p-3 border rounded-xl" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Alvo (R$)</label>
                        <input type="number" required placeholder="0.00" className="w-full p-3 border rounded-xl" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Inicial (R$)</label>
                        <input type="number" placeholder="0.00" className="w-full p-3 border rounded-xl" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                    <input type="date" required className="w-full p-3 border rounded-xl" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                    <select value={icon} onChange={e => setIcon(e.target.value)} className="w-full p-3 border rounded-xl bg-white">
                        <option value="trophy">Troféu (Geral)</option>
                        <option value="car">Carro</option>
                        <option value="home">Casa</option>
                        <option value="plane">Viagem</option>
                    </select>
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 mt-2">Criar Meta</button>
            </form>
        </Modal>

        {/* Deposit Modal */}
        <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title={`Depositar em: ${selectedGoal?.name}`}>
            <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quanto deseja depositar?</label>
                    <input 
                        type="number" 
                        required 
                        autoFocus
                        placeholder="0.00" 
                        className="w-full p-3 border rounded-xl text-xl font-bold text-center" 
                        value={depositValue} 
                        onChange={e => setDepositValue(e.target.value)} 
                    />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 mt-2">Confirmar Depósito</button>
            </form>
        </Modal>
    </div>
  );
};

export default Goals;