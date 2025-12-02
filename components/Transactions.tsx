import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, Download, Trash, AlertCircle, CheckCircle, XCircle, Copy, Paperclip, Music, Image as ImageIcon, Calendar } from 'lucide-react';
import { Transaction, Mode } from '../types';
import { db } from '../services/db';
import Modal from './Modal';

interface TransactionsProps {
    mode?: Mode;
}

const Transactions: React.FC<TransactionsProps> = ({ mode }) => {
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, 7days, 30days, month, specific
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Transaction | null>(null);

  const loadTransactions = async () => {
      try {
        const data = await db.transactions.getAll(mode);
        // Sort by date desc
        setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
          console.error("Erro ao carregar transações", e);
      }
  };

  useEffect(() => {
    loadTransactions();
    window.addEventListener('db-change', loadTransactions);
    return () => window.removeEventListener('db-change', loadTransactions);
  }, [mode]);

  const handleDelete = async (id: string) => {
      if (!id) return;
      if (window.confirm('Tem certeza que deseja excluir esta transação permanentemente?')) {
          await db.transactions.delete(id);
          setTransactions(prev => prev.filter(t => t.id !== id));
      }
  }

  const handleDuplicate = async (item: Transaction) => {
      if(window.confirm(`Duplicar "${item.description}"?`)) {
          const newItem = await db.transactions.add({
              description: `${item.description} (Cópia)`,
              amount: item.amount,
              category: item.category,
              date: new Date().toISOString().split('T')[0], // Hoje
              status: 'pending',
              type: item.type,
              mode: mode || item.mode // Prefer current prop mode
          });
          
          if(newItem) {
              setTransactions(prev => [newItem, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          }
      }
  };

  const handleStatusUpdate = async (item: Transaction) => {
      const newStatus = item.status === 'paid' ? 'pending' : 'paid';
      
      // Optimistic update
      setTransactions(prev => prev.map(t => t.id === item.id ? { ...t, status: newStatus } : t));
      
      await db.transactions.update(item.id, { status: newStatus });
  }

  const filteredTransactions = transactions.filter(t => {
      // 1. Text Search
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase()) && !t.category.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
      }

      // 2. Type Filter
      if (filter !== 'all' && t.type !== filter) {
          return false;
      }

      // 3. Date Filter
      if (dateFilter === 'all') return true;

      if (dateFilter === 'specific') {
          return t.date === specificDate;
      }

      const tDate = new Date(t.date + 'T12:00:00'); // Force noon to avoid timezone skipping
      const today = new Date();
      today.setHours(12,0,0,0); // Compare with noon today

      if (dateFilter === 'today') {
          return t.date === today.toISOString().split('T')[0];
      }
      
      if (dateFilter === '7days') {
          const limit = new Date(today);
          limit.setDate(today.getDate() - 7);
          return tDate >= limit;
      }
      
      if (dateFilter === '30days') {
          const limit = new Date(today);
          limit.setDate(today.getDate() - 30);
          return tDate >= limit;
      }
      
      if (dateFilter === 'month') {
          return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
      }

      return true;
  });

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ArrowLeftRight className="text-red-600" /> Transações
                </h2>
                <p className="text-gray-500 text-sm">Extrato completo de movimentações</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors">
                    <Download size={18} /> <span className="md:inline">Exportar</span>
                </button>
            </div>
        </div>

        {/* Filters Bar - Otimizado para Mobile */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="w-full flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar transação..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 transition-all bg-gray-50 focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Date Filter */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 min-w-[200px]">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                        >
                            <option value="all">Todo o período</option>
                            <option value="today">Hoje</option>
                            <option value="7days">Últimos 7 dias</option>
                            <option value="30days">Últimos 30 dias</option>
                            <option value="month">Este Mês</option>
                            <option value="specific">Data Específica</option>
                        </select>
                    </div>

                    {/* Specific Date Input (Mostra com animação e ocupa espaço adequado no mobile) */}
                    {dateFilter === 'specific' && (
                        <input 
                            type="date"
                            value={specificDate}
                            onChange={(e) => setSpecificDate(e.target.value)}
                            className="py-2.5 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 bg-white transition-all w-full sm:w-auto animate-in fade-in slide-in-from-left-4"
                        />
                    )}
                </div>
            </div>

            {/* Type Toggles */}
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                <button 
                    onClick={() => setFilter('all')}
                    className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todas
                </button>
                <button 
                     onClick={() => setFilter('income')}
                     className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Entradas
                </button>
                <button 
                     onClick={() => setFilter('expense')}
                     className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Saídas
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                            <th className="px-6 py-4 text-center">Anexo</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredTransactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-gray-500 text-sm font-medium whitespace-nowrap">{t.date}</td>
                                <td className="px-6 py-4 font-semibold text-gray-800">{t.description}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs border border-gray-200 whitespace-nowrap">
                                        {t.category}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {t.attachment ? (
                                        <button 
                                            onClick={() => setSelectedAttachment(t)}
                                            className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                            title="Ver anexo"
                                        >
                                            {t.attachmentType === 'image' ? <ImageIcon size={16} /> : <Music size={16} />}
                                        </button>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleStatusUpdate(t)}
                                        className={`px-2.5 py-1 text-xs rounded-full font-bold transition-all border inline-flex items-center gap-1 ${
                                            t.status === 'paid' 
                                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                            : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
                                        }`}
                                    >
                                        {t.status === 'paid' ? (
                                            <><CheckCircle size={12} /> {t.type === 'income' ? 'Recebido' : 'Pago'}</>
                                        ) : (
                                            <><AlertCircle size={12} /> Pendente</>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDuplicate(t); }} 
                                            className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg"
                                            title="Duplicar"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleDelete(t.id); 
                                            }} 
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                                            title="Excluir Transação"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <ArrowLeftRight size={40} className="opacity-20" />
                                    <p>Nenhuma transação encontrada.</p>
                                </div>
                            </td>
                        </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

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

export default Transactions;