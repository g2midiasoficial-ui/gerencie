import React, { useState, useEffect } from 'react';
import { Wallet, AlertOctagon, TrendingDown, CheckCircle, Plus, Trash2, DollarSign } from 'lucide-react';
import { Debt, Mode } from '../types';
import { db } from '../services/db';
import Modal from './Modal';

interface DebtsProps {
    mode?: Mode;
}

const Debts: React.FC<DebtsProps> = ({ mode }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  // Form New Debt
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [interestRate, setInterestRate] = useState('');

  // Form Pay
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const load = async () => setDebts(await db.debts.getAll(mode));
    load();
    window.addEventListener('db-change', load);
    return () => window.removeEventListener('db-change', load);
  }, [mode]);

  const totalDebt = debts.reduce((acc, curr) => acc + Number(curr.remainingAmount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const valTotal = parseFloat(totalAmount) || 0;
      const valInterest = parseFloat(interestRate) || 0;

      await db.debts.add({
          name,
          totalAmount: valTotal,
          remainingAmount: valTotal, // Starts full
          dueDate,
          interestRate: valInterest,
          mode
      });
      setIsModalOpen(false);
      setName('');
      setTotalAmount('');
      setDueDate('');
      setInterestRate('');
  };

  const handleDelete = async (id: string) => {
      if(confirm('Tem certeza que deseja excluir este registro de dívida?')) {
          await db.debts.delete(id);
      }
  };

  const openPayModal = (debt: Debt) => {
      setSelectedDebt(debt);
      setPaymentAmount('');
      setPayModalOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedDebt || !paymentAmount) return;
      
      const val = parseFloat(paymentAmount) || 0;
      const newRemaining = Math.max(0, selectedDebt.remainingAmount - val);

      await db.debts.update(selectedDebt.id, { remainingAmount: newRemaining });

      // Opcional: Registrar saída no fluxo de caixa
      if(confirm('Deseja registrar esse pagamento como uma Despesa?')) {
          await db.transactions.add({
              description: `Pagamento Dívida: ${selectedDebt.name}`,
              amount: val,
              category: 'Dívidas',
              date: new Date().toISOString().split('T')[0],
              type: 'expense',
              status: 'paid',
              mode
          });
      }

      setPayModalOpen(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-red-600 rounded-2xl p-8 text-white shadow-lg shadow-red-200 relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h2 className="text-red-100 font-medium text-lg flex items-center gap-2">
                        <Wallet size={20} /> Total em Dívidas
                    </h2>
                    <h1 className="text-4xl font-bold mt-2">R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h1>
                    <p className="text-red-200 text-sm mt-2">Valor total restante para quitação</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <TrendingDown size={32} className="text-white" />
                </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-10 left-1/2 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debts.map(debt => {
                const total = Number(debt.totalAmount) || 1; // Prevent divide by zero
                const remaining = Number(debt.remainingAmount) || 0;
                const progress = ((total - remaining) / total) * 100;
                const isPaid = remaining <= 0;

                return (
                    <div key={debt.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all group ${isPaid ? 'border-green-200 bg-green-50/30' : 'border-red-50 hover:border-red-200'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg transition-colors ${isPaid ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
                                <AlertOctagon size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-semibold">Vencimento</p>
                                <p className="text-sm font-bold text-gray-800">{debt.dueDate}</p>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{debt.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Juros: <span className="text-red-600 font-bold">{debt.interestRate}% a.m.</span>
                        </p>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Pago: {progress.toFixed(0)}%</span>
                                <span className="font-bold text-gray-800">R$ {remaining.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isPaid ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => openPayModal(debt)}
                                disabled={isPaid}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isPaid ? 'bg-green-100 text-green-700 cursor-default' : 'bg-red-600 text-white hover:bg-red-700'}`}
                            >
                                {isPaid ? <CheckCircle size={16}/> : <DollarSign size={16}/>}
                                {isPaid ? 'Quitada' : 'Pagar'}
                            </button>
                            <button 
                                onClick={() => handleDelete(debt.id)}
                                className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                )
            })}
            
            {/* Add New Debt Card */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50/50 transition-all min-h-[280px] group"
            >
                <div className="p-4 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition-colors shadow-sm">
                    <Plus size={32} />
                </div>
                <span className="font-semibold">Adicionar Nova Dívida</span>
            </button>
        </div>

        {/* Modal Create */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Dívida">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Dívida</label>
                    <input type="text" required placeholder="Ex: Cartão de Crédito" className="w-full p-3 border rounded-xl" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
                        <input type="number" required step="0.01" placeholder="0.00" className="w-full p-3 border rounded-xl" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Juros (% a.m)</label>
                        <input type="number" step="0.1" placeholder="0.0" className="w-full p-3 border rounded-xl" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                    <input type="date" required className="w-full p-3 border rounded-xl" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 mt-2">Salvar Dívida</button>
            </form>
        </Modal>

        {/* Modal Pay */}
        <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title={`Amortizar: ${selectedDebt?.name}`}>
            <form onSubmit={handlePayment} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Devedor Atual</label>
                    <div className="text-2xl font-bold text-red-600 mb-4">
                        R$ {selectedDebt?.remainingAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Pagamento (R$)</label>
                    <input 
                        type="number" 
                        required 
                        autoFocus
                        step="0.01"
                        placeholder="0.00" 
                        className="w-full p-3 border rounded-xl text-xl font-bold text-center text-green-700" 
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(e.target.value)} 
                    />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 mt-2">Confirmar Pagamento</button>
            </form>
        </Modal>
    </div>
  );
};

export default Debts;