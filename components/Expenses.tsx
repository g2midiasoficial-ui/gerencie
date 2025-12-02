import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, TrendingDown, Calendar, AlertCircle, Plus, Trash2, CheckCircle, Copy, RefreshCw, Image as ImageIcon, Music } from 'lucide-react';
import { Transaction, Mode, Category } from '../types';
import { db } from '../services/db';
import Modal from './Modal';

interface ExpensesProps {
    mode?: Mode;
}

const Expenses: React.FC<ExpensesProps> = ({ mode }) => {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Transaction | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'paid'|'pending'>('paid');

  // Recurrence State
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatCount, setRepeatCount] = useState('2');

  useEffect(() => {
    const load = async () => {
        const all = await db.transactions.getAll(mode);
        // Sort Descending (Newest first)
        const filtered = all
            .filter(t => t.type === 'expense')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setExpenses(filtered);
        
        const cats = await db.categories.getAll(mode);
        setCategories(cats.filter(c => c.type === 'expense' || !c.type));
    };
    load();
    window.addEventListener('db-change', load);
    return () => window.removeEventListener('db-change', load);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const numAmount = parseFloat(amount);
    const loops = isRecurring ? parseInt(repeatCount) : 1;
    const baseDate = new Date(date);

    for (let i = 0; i < loops; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setMonth(baseDate.getMonth() + i);
        
        // Fix JS date rollover issue
        if (currentDate.getDate() !== baseDate.getDate()) {
            currentDate.setDate(0);
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const descSuffix = loops > 1 ? ` (${i + 1}/${loops})` : '';

        await db.transactions.add({
            description: description + descSuffix,
            amount: numAmount,
            category,
            date: dateStr,
            status,
            type: 'expense',
            mode
        });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
      setDescription('');
      setAmount('');
      setCategory('');
      setStatus('paid');
      setIsRecurring(false);
      setRepeatCount('2');
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Excluir esta despesa?')) {
          await db.transactions.delete(id);
          setExpenses(prev => prev.filter(t => t.id !== id));
      }
  };

  const handleDuplicate = async (item: Transaction) => {
      if(window.confirm(`Duplicar "${item.description}"?`)) {
          const newItem = await db.transactions.add({
              description: `${item.description} (Cópia)`,
              amount: item.amount,
              category: item.category,
              date: new Date().toISOString().split('T')[0],
              status: 'pending',
              type: 'expense',
              mode: mode || item.mode // Ensure correct mode
          });

          if (newItem) {
            setExpenses(prev => [newItem, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          }
      }
  };

  const handleToggleStatus = async (item: Transaction) => {
      const newStatus = item.status === 'paid' ? 'pending' : 'paid';
      
      // Update local state immediately for instant feedback on totals
      setExpenses(prev => prev.map(t => t.id === item.id ? { ...t, status: newStatus } : t));
      
      await db.transactions.update(item.id, { status: newStatus });
  };

  const totalPaid = expenses.filter(t => t.status === 'paid').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalPending = expenses.filter(t => t.status === 'pending').reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-red-900 font-bold text-xl flex items-center gap-2">
             <ArrowDownCircle className="text-red-600" /> Despesas
           </h2>
           <p className="text-red-700/70 text-sm mt-1">Controle seus gastos e saídas.</p>
        </div>
        <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full sm:w-auto bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
        >
            <Plus size={20} /> Nova Despesa
        </button>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pago este Mês</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">A Pagar</p>
              <h3 className="text-2xl font-bold text-red-500 mt-2">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Previsto</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">R$ {(totalPaid + totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Histórico de Gastos</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Valor</th>
                        <th className="px-6 py-4">Anexo</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {expenses.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-800">{item.description}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-100 text-xs rounded-md font-medium">{item.category}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-sm flex items-center gap-2 whitespace-nowrap">
                                <Calendar size={14} /> {item.date}
                            </td>
                            <td className="px-6 py-4 font-bold text-red-600">
                                - R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4">
                                {item.attachment ? (
                                    <button 
                                        onClick={() => setSelectedAttachment(item)}
                                        className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                        title="Ver anexo"
                                    >
                                        {item.attachmentType === 'image' ? <ImageIcon size={16} /> : <Music size={16} />}
                                    </button>
                                ) : (
                                    <span className="text-gray-300">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(item); }}
                                    className={`px-2.5 py-1 text-xs rounded-full font-bold transition-all border ${
                                        item.status === 'paid' 
                                        ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-green-100 hover:text-green-700' 
                                        : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                    }`}
                                >
                                    {item.status === 'paid' ? 'Pago' : 'Pendente'}
                                </button>
                            </td>
                             <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                     <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleDuplicate(item); }} 
                                        className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg"
                                        title="Duplicar"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <TrendingDown size={40} className="opacity-20" />
                                    <p>Nenhuma despesa registrada ainda.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Despesa">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input 
                    type="text" 
                    required
                    placeholder="Ex: Aluguel, Supermercado" 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                    <input 
                        type="number" 
                        required
                        step="0.01"
                        placeholder="0,00" 
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input 
                        type="date" 
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <div className="relative">
                    <select 
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white appearance-none"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                    >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        <option value="Outros">Outros</option>
                    </select>
                </div>
            </div>

            {/* Repetição */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input 
                        type="checkbox" 
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <RefreshCw size={14} />
                        Repetir mensalmente?
                    </span>
                </label>
                
                {isRecurring && (
                    <div className="mt-2 pl-6 animate-fadeIn">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Quantos meses?</label>
                        <input 
                            type="number" 
                            min="2" 
                            max="60"
                            value={repeatCount}
                            onChange={e => setRepeatCount(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Serão criados {repeatCount} lançamentos.</p>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-4">
                    <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${status === 'paid' ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-200' : 'hover:bg-gray-50 border-gray-200'}`}>
                        <input type="radio" name="status" value="paid" checked={status === 'paid'} onChange={() => setStatus('paid')} className="hidden"/>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Pago
                    </label>
                    <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${status === 'pending' ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200' : 'hover:bg-gray-50 border-gray-200'}`}>
                        <input type="radio" name="status" value="pending" checked={status === 'pending'} onChange={() => setStatus('pending')} className="hidden"/>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Pendente
                    </label>
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 mt-2"
            >
                Salvar Despesa
            </button>
        </form>
      </Modal>

      {/* Attachment Modal */}
      <Modal isOpen={!!selectedAttachment} onClose={() => setSelectedAttachment(null)} title="Anexo da Transação">
            {selectedAttachment && (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-center mb-2">
                         <h4 className="font-bold text-gray-800">{selectedAttachment.description}</h4>
                         <p className="text-sm text-gray-500">{selectedAttachment.date}</p>
                    </div>
                    {selectedAttachment.attachmentType === 'image' ? (
                        <img 
                            src={selectedAttachment.attachment} 
                            alt="Comprovante" 
                            className="max-w-full rounded-lg shadow-sm max-h-[60vh] object-contain"
                        />
                    ) : (
                        <div className="w-full bg-gray-50 p-6 rounded-xl flex flex-col items-center gap-4">
                             <div className="p-4 bg-red-100 rounded-full text-red-600">
                                <Music size={32} />
                             </div>
                             <audio controls src={selectedAttachment.attachment} className="w-full" />
                        </div>
                    )}
                    <button 
                        onClick={() => setSelectedAttachment(null)}
                        className="mt-4 text-gray-500 hover:text-gray-800 text-sm font-medium"
                    >
                        Fechar Visualização
                    </button>
                </div>
            )}
      </Modal>
    </div>
  );
};

export default Expenses;