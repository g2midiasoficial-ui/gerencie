import React, { useState, useEffect } from 'react';
import { ShoppingItem, Mode } from '../types';
import { RotateCcw, Edit2, Trash2, Plus, Minus, Eye, ShoppingBag } from 'lucide-react';
import { db } from '../services/db';
import Modal from './Modal';

interface MarketListProps {
    mode?: Mode;
}

const MarketList: React.FC<MarketListProps> = ({ mode }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Alimentos');
  const [unit, setUnit] = useState('un');
  const [idealQty, setIdealQty] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
     const load = async () => {
         setItems(await db.shopping.getAll(mode));
     }
     load();
     window.addEventListener('db-change', load);
     return () => window.removeEventListener('db-change', load);
  }, [mode]);

  const updateQuantity = async (item: ShoppingItem, delta: number) => {
      const newItem = { ...item, currentQty: Math.max(0, item.currentQty + delta) };
      await db.shopping.update(item.id, { currentQty: newItem.currentQty });
  }

  const handleDelete = async (id: string) => {
      if(confirm('Remover este item da lista?')) {
          await db.shopping.delete(id);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await db.shopping.add({
          name,
          category,
          unit,
          idealQty: parseFloat(idealQty) || 1,
          currentQty: 0,
          price: parseFloat(price) || 0,
          mode
      });
      setIsModalOpen(false);
      setName('');
      setIdealQty('');
      setPrice('');
  }

  return (
    <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white p-2 rounded-xl shadow-md shadow-red-200">
                        <ShoppingBag size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-xl text-gray-800">Lista de Compras</h2>
                    <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-400">Gerenciamento inteligente de estoque</span>
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {items.length} Itens
                        </span>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
            >
                <Plus size={18} /> Novo Item
            </button>
        </div>

        {/* Legend */}
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
                 <div className="p-2 bg-white rounded-lg shadow-sm text-red-600">
                    <InfoIcon />
                 </div>
                 <div className="text-sm text-red-900">
                    <span className="font-semibold block mb-1">Legenda de Estoque</span>
                    <div className="flex flex-wrap gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span className="text-red-900/70">Adequado</span>
                        </div>
                         <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                            <span className="text-red-900/70">Médio</span>
                        </div>
                         <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-red-900/70">Baixo (Compra)</span>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filtrar por Categoria</label>
                <div className="flex gap-2">
                    <select className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all">
                        <option>Todas as categorias</option>
                        <option>Alimentos</option>
                        <option>Limpeza</option>
                        <option>Higiene</option>
                        <option>Escritório</option>
                    </select>
                    <button className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm">
                        Aplicar
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-3 cursor-pointer select-none p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 accent-red-600" />
                    <span className="text-gray-700 text-sm font-medium leading-tight">Apenas em falta</span>
                </label>
                <button className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors">
                    <RotateCcw size={16} />
                    Limpar
                </button>
            </div>
        </div>

        {/* List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="py-3 px-2">Item</th>
                            <th className="py-3 px-2">Unidade</th>
                            <th className="py-3 px-2">Meta</th>
                            <th className="py-3 px-2">Atual</th>
                            <th className="py-3 px-2">Status</th>
                            <th className="py-3 px-2">Preço Est.</th>
                            <th className="py-3 px-2 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <tr key={item.id} className="group hover:bg-red-50/30 transition-colors">
                                <td className="py-4 px-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-red-600 font-bold uppercase mb-0.5">{item.category}</span>
                                        <span className="font-semibold text-gray-800">{item.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-2 text-gray-500 text-sm">{item.unit}</td>
                                <td className="py-4 px-2 text-gray-500 text-sm">{Number(item.idealQty).toFixed(2)}</td>
                                <td className="py-4 px-2">
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-32 shadow-sm">
                                        <button onClick={() => updateQuantity(item, -1)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border-r border-gray-200 text-gray-600 transition-colors">
                                            <Minus size={14} />
                                        </button>
                                        <input 
                                            type="text" 
                                            value={Number(item.currentQty).toFixed(2)} 
                                            readOnly 
                                            className="w-full text-center text-sm font-medium text-gray-700 py-1.5 outline-none bg-white"
                                        />
                                        <button onClick={() => updateQuantity(item, 1)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border-l border-gray-200 text-gray-600 transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="py-4 px-2">
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 w-24 mb-1.5 overflow-hidden">
                                         <div 
                                            className={`h-full rounded-full transition-all ${item.currentQty < item.idealQty * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                                            style={{ width: `${Math.min((item.currentQty/item.idealQty)*100, 100)}%`}}
                                         ></div>
                                    </div>
                                    <div className="text-red-500 text-xs font-bold">
                                        {item.currentQty < item.idealQty ? `Faltam: ${(item.idealQty - item.currentQty).toFixed(2)}` : 'Estoque Cheio'}
                                    </div>
                                </td>
                                <td className="py-4 px-2 text-gray-700 font-medium text-sm">
                                    R$ {Number(item.price).toFixed(2)}
                                </td>
                                <td className="py-4 px-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleDelete(item.id)} className="p-2 border border-red-100 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-400">
                                    Sua lista de compras está vazia. Adicione itens para começar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Create Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Item">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                    <input type="text" required placeholder="Ex: Café" className="w-full p-3 border rounded-xl" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select className="w-full p-3 border rounded-xl bg-white" value={category} onChange={e => setCategory(e.target.value)}>
                            <option>Alimentos</option>
                            <option>Limpeza</option>
                            <option>Higiene</option>
                            <option>Bebidas</option>
                            <option>Escritório</option>
                            <option>Outros</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                         <select className="w-full p-3 border rounded-xl bg-white" value={unit} onChange={e => setUnit(e.target.value)}>
                            <option value="un">Unidade (un)</option>
                            <option value="kg">Quilo (kg)</option>
                            <option value="l">Litro (l)</option>
                            <option value="pct">Pacote (pct)</option>
                            <option value="cx">Caixa (cx)</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Ideal (Meta)</label>
                        <input type="number" step="0.1" required className="w-full p-3 border rounded-xl" value={idealQty} onChange={e => setIdealQty(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço Est. (R$)</label>
                        <input type="number" step="0.01" className="w-full p-3 border rounded-xl" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 mt-2">Adicionar Item</button>
            </form>
        </Modal>
    </div>
  );
};

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
)

export default MarketList;