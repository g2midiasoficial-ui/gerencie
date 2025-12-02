import React, { useState, useEffect } from 'react';
import { Mode, FinancialData } from '../types';
import { Sparkles, Eye, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getFinancialAdvice } from '../services/geminiService';
import { db } from '../services/db';

interface DashboardProps {
  mode: Mode;
}

const Dashboard: React.FC<DashboardProps> = ({ mode }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [data, setData] = useState<FinancialData>({
    income: 0,
    expenses: 0,
    balance: 0,
    pendingExpenses: 0,
    healthScore: 'Calculando...'
  });
  const [chartData, setChartData] = useState<any[]>([]);

  const loadData = async () => {
    const transactions = await db.transactions.getAll(mode);
    
    let income = 0;
    let expenses = 0;
    let pendingExpenses = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
             if (t.status === 'paid') income += Number(t.amount);
        } else {
             if (t.status === 'paid') expenses += Number(t.amount);
             if (t.status === 'pending') pendingExpenses += Number(t.amount);
        }
    });

    const balance = income - expenses;
    // Simple logic for health score
    let healthScore = 'Neutro';
    if (income === 0 && expenses === 0) healthScore = 'Sem Dados';
    else if (expenses > income) healthScore = 'Crítico';
    else if ((income - expenses) / (income || 1) > 0.2) healthScore = 'Excelente';
    else healthScore = 'Bom';

    setData({
        income,
        expenses,
        balance,
        pendingExpenses,
        healthScore
    });

    // Mock chart data generation (improved to show flat line if empty)
    if (transactions.length > 0) {
        setChartData([
            { name: 'Sem 1', income: income * 0.2, expense: expenses * 0.25 },
            { name: 'Sem 2', income: income * 0.3, expense: expenses * 0.15 },
            { name: 'Sem 3', income: income * 0.1, expense: expenses * 0.40 },
            { name: 'Sem 4', income: income * 0.4, expense: expenses * 0.20 },
        ]);
    } else {
        setChartData([
            { name: 'Sem 1', income: 0, expense: 0 },
            { name: 'Sem 2', income: 0, expense: 0 },
            { name: 'Sem 3', income: 0, expense: 0 },
            { name: 'Sem 4', income: 0, expense: 0 },
        ]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db-change', loadData);
    return () => window.removeEventListener('db-change', loadData);
  }, [mode]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const transactions = await db.transactions.getAll(mode);
    const advice = await getFinancialAdvice(mode, { ...data, transactions: transactions.slice(0, 5) });
    setAiAnalysis(advice);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 p-6 rounded-2xl flex justify-between items-center relative overflow-hidden shadow-sm">
         <div className="flex items-center gap-4 z-10">
           <div className="bg-white p-3 rounded-xl text-red-600 hidden md:block shadow-sm">
             <Activity size={28} />
           </div>
           <div>
             <h2 className="text-red-900 font-bold text-xl">
                Visão Geral: {mode}
             </h2>
             <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-red-800">
               <span className="opacity-80">Resumo Financeiro</span>
               <span className={`text-white text-xs px-2.5 py-0.5 rounded-full font-semibold shadow-sm ${data.balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                   {data.balance >= 0 ? 'Saldo Positivo' : 'Saldo Negativo'}
               </span>
             </div>
           </div>
         </div>
         {/* Background decoration */}
         <div className="absolute right-0 top-0 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transform translate-x-20 -translate-y-20"></div>
      </div>

      {/* AI Advice Section */}
      <div className="bg-gradient-to-r from-red-800 to-rose-900 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden transition-all hover:shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={100} />
        </div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-3 flex-col sm:flex-row gap-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-red-100">
                    <Sparkles size={20} className="text-yellow-300" />
                    Gerencie AI Advisor
                </h3>
                <button 
                    onClick={handleAiAnalysis}
                    disabled={loadingAi}
                    className="text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all border border-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loadingAi ? 'Analisando...' : 'Gerar Insights'}
                </button>
            </div>
            <p className="text-red-50 text-sm leading-relaxed max-w-3xl opacity-90">
                {aiAnalysis || "Toque no botão para receber uma análise inteligente baseada nos seus dados do banco de dados."}
            </p>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 group hover:border-green-200 transition-colors">
          <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                <TrendingUp size={20} />
              </div>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Receitas totais</p>
          <h3 className="text-2xl font-bold text-gray-800">
            R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 group hover:border-red-200 transition-colors">
          <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover:bg-red-100 transition-colors">
                <TrendingDown size={20} />
              </div>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Despesas totais</p>
          <h3 className="text-2xl font-bold text-gray-800">
            R$ {data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-red-400 mt-2 font-medium">
             Pendente: R$ {data.pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Balance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 group hover:border-blue-200 transition-colors">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                <DollarSign size={20} />
              </div>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Saldo Atual</p>
          <h3 className={`text-2xl font-bold ${data.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            R$ {data.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>

         {/* Health Score */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 group hover:border-purple-200 transition-colors">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                <Activity size={20} />
              </div>
              <div className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded-md">
                 {data.healthScore}
              </div>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Margem Líquida</p>
          <h3 className="text-2xl font-bold text-gray-800">
             {data.income > 0 ? ((data.balance / data.income) * 100).toFixed(1) : 0}%
          </h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50">
        <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                Fluxo de Caixa
            </h3>
        </div>
        
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Receitas" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Despesas" />
            </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;