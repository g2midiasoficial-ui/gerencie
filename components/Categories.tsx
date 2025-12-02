import React, { useState, useEffect } from 'react';
import { Tag, Plus, MoreHorizontal, Trash } from 'lucide-react';
import { Category, Mode } from '../types';
import { db } from '../services/db';
import Modal from './Modal';

interface CategoriesProps {
    mode?: Mode;
}

const Categories: React.FC<CategoriesProps> = ({ mode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [type, setType] = useState('expense');

  useEffect(() => {
     const load = async () => setCategories(await db.categories.getAll(mode));
     load();
     window.addEventListener('db-change', load);
     return () => window.removeEventListener('db-change', load);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      await db.categories.add({
          name,
          budget: parseFloat(budget) || 0,
          type: type as any,
          spent: 0,
          color: randomColor,
          mode
      });
      setIsModalOpen(false);
      setName('');
      setBudget('');
  };

  const handleDelete = async (id: string) => {
      if(confirm('Excluir esta categoria?')) {
          await db.categories.delete(id);
      }
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Tag className="text-red-600" /> Categorias & Orçamentos
                </h2>
                <p className="text-gray-500 text-sm">Organize seus gastos por centros de custo</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
            >
                <Plus size={18} /> Nova Categoria
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => {
                const percentage = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
                const isOver = cat.budget > 0 && cat.spent > cat.budget;

                return (
                    <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 hover:shadow-md transition-all relative overflow-hidden group">
                        {/* Decorative header line */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${cat.color}`}></div>
                        
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-gray-800">{cat.name}</h3>
                            <button onClick={() => handleDelete(cat.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash size={16} />
                            </button>
                        </div>

                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Gasto Atual</p>
                                <p className={`text-xl font-bold ${isOver ? 'text-red-600' : 'text-gray-800'}`}>
                                    R$ {cat.spent.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-semibold uppercase">Orçamento</p>
                                <p className="text-sm font-medium text-gray-600">
                                    / R$ {cat.budget.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isOver ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>
                                    {isOver ? 'Excedido' : 'Dentro da meta'}
                                </span>
                                </div>
                                <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-gray-600">
                                    {percentage.toFixed(0)}%
                                </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${cat.color}`}></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Categoria">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input type="text" required className="w-full p-3 border rounded-xl" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 border rounded-xl bg-white">
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Mensal (Meta)</label>
                    <input type="number" required placeholder="0.00" className="w-full p-3 border rounded-xl" value={budget} onChange={e => setBudget(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 mt-2">Criar Categoria</button>
            </form>
        </Modal>
    </div>
  );
};

export default Categories;