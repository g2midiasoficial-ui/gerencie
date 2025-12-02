import React from 'react';
import { FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Mode } from '../types';

interface ReportsProps {
    mode?: Mode;
}

const Reports: React.FC<ReportsProps> = ({ mode }) => {
  // Currently mock data for reports as aggregating real data requires more complex logic
  // in a real app this would aggregate db.transactions.getAll() asynchronously
  const monthlyData = [
    { name: 'Jan', receita: 4000, despesa: 2400 },
    { name: 'Fev', receita: 3000, despesa: 1398 },
    { name: 'Mar', receita: 5200, despesa: 2800 },
    { name: 'Abr', receita: 2780, despesa: 3908 },
    { name: 'Mai', receita: 1890, despesa: 4800 },
    { name: 'Jun', receita: 2390, despesa: 3800 },
  ];

  const categoryData = [
    { name: 'Moradia', value: 1800 },
    { name: 'Alimentação', value: 850 },
    { name: 'Transporte', value: 200 },
    { name: 'Lazer', value: 450 },
    { name: 'Saúde', value: 100 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-red-600" /> Relatórios Financeiros
                </h2>
                <p className="text-gray-500 text-sm">Análise detalhada do seu patrimônio ({mode})</p>
            </div>
            <button className="border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
                <Download size={18} /> Exportar PDF
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Comparison */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50">
                <h3 className="font-bold text-lg text-gray-800 mb-6">Receita vs. Despesas (Semestral)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{fill: '#f9fafb'}}
                            />
                            <Legend />
                            <Bar dataKey="receita" fill="#10b981" name="Receita" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="despesa" fill="#ef4444" name="Despesa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expense Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50">
                <h3 className="font-bold text-lg text-gray-800 mb-6">Distribuição de Gastos</h3>
                <div className="h-80 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Summary Table */}
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Resumo Anual</h3>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 text-center">
                 <div className="p-6">
                     <p className="text-gray-500 text-xs font-bold uppercase mb-2">Total Recebido</p>
                     <p className="text-xl font-bold text-green-600">R$ 19.260,00</p>
                 </div>
                 <div className="p-6">
                     <p className="text-gray-500 text-xs font-bold uppercase mb-2">Total Gasto</p>
                     <p className="text-xl font-bold text-red-600">R$ 15.116,00</p>
                 </div>
                 <div className="p-6">
                     <p className="text-gray-500 text-xs font-bold uppercase mb-2">Economizado</p>
                     <p className="text-xl font-bold text-blue-600">R$ 4.144,00</p>
                 </div>
                 <div className="p-6">
                     <p className="text-gray-500 text-xs font-bold uppercase mb-2">Média de Economia</p>
                     <p className="text-xl font-bold text-gray-800">21.5%</p>
                 </div>
             </div>
         </div>
    </div>
  );
};

export default Reports;