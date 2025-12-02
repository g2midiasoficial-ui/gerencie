import React, { useState, useEffect } from 'react';
import { Database, Save, Copy, Check, CloudOff, AlertTriangle, PlayCircle, Wifi } from 'lucide-react';
import Modal from './Modal';
import { isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabase';
import { createClient } from '@supabase/supabase-js';

interface DatabaseConfigProps {
    isOpen: boolean;
    onClose: () => void;
}

const DatabaseConfig: React.FC<DatabaseConfigProps> = ({ isOpen, onClose }) => {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Test states
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

    useEffect(() => {
        setIsConfigured(isSupabaseConfigured());
        const storedUrl = localStorage.getItem('gerencie_supabase_url');
        const storedKey = localStorage.getItem('gerencie_supabase_key');
        if (storedUrl) setUrl(storedUrl);
        if (storedKey) setKey(storedKey);
    }, [isOpen]);

    const handleDisconnect = () => {
        if(confirm('Desconectar da nuvem? O app voltará a usar o armazenamento local.')) {
            clearSupabaseConfig();
        }
    };

    const formatUrl = (u: string) => {
        if (!u) return '';
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
        return `https://${u}`;
    };

    const handleTestConnection = async () => {
        if (!url || !key) {
            setTestResult({ success: false, message: 'Preencha a URL e a API Key.' });
            return;
        }
        
        setTesting(true);
        setTestResult(null);

        try {
            // Tenta criar um cliente temporário para testar
            const tempClient = createClient(formatUrl(url), key);
            
            // Tenta uma query simples. Se a tabela não existir, vai dar erro, o que é bom para avisar o usuário.
            // Usamos 'transactions' pois é a principal.
            const { error } = await tempClient.from('transactions').select('count', { count: 'exact', head: true });
            
            if (error) {
                // Erros comuns
                if (error.code === '42P01') {
                    throw new Error("Conexão OK, mas as tabelas não existem. Rode o Script SQL acima!");
                } else if (error.message.includes('JWT') || error.code === '401') {
                    throw new Error("Chave de API inválida ou expirada.");
                } else if (error.message.includes('FetchError')) {
                    throw new Error("URL inválida ou erro de rede.");
                } else {
                    throw error;
                }
            }

            setTestResult({ success: true, message: 'Conexão bem sucedida! Tabelas encontradas.' });
        } catch (e: any) {
            setTestResult({ success: false, message: e.message || 'Erro desconhecido ao conectar.' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (url && key) {
            saveSupabaseConfig(url, key);
        }
    };

    const sqlScript = `
-- 1. Habilitar UUIDs
create extension if not exists "uuid-ossp";

-- 2. Tabela de Transações
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  category text,
  amount numeric not null,
  type text check (type in ('income', 'expense')),
  status text check (status in ('paid', 'pending')),
  date date not null,
  mode text default 'Pessoal',
  attachment text,
  attachment_type text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Atualização para quem já tem a tabela
alter table transactions add column if not exists attachment text;
alter table transactions add column if not exists attachment_type text;

-- 3. Tabela de Lista de Compras
create table if not exists shopping_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text,
  unit text,
  ideal_qty numeric,
  current_qty numeric,
  price numeric,
  mode text default 'Pessoal'
);

-- 4. Tabela de Manutenção
create table if not exists maintenance_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  system text,
  status text check (status in ('Atrasada', 'Pendente', 'Em Dia')),
  due_in text,
  mode text default 'Pessoal'
);

-- 5. Tabela de Dívidas
create table if not exists debts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  total_amount numeric,
  remaining_amount numeric,
  due_date date,
  interest_rate numeric,
  mode text default 'Pessoal'
);

-- 6. Tabela de Metas
create table if not exists goals (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  target_amount numeric,
  current_amount numeric,
  deadline date,
  icon text,
  mode text default 'Pessoal'
);

-- 7. Tabela de Categorias
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text check (type in ('income', 'expense')),
  budget numeric default 0,
  spent numeric default 0,
  color text,
  mode text default 'Pessoal'
);
`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sqlScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuração de Banco de Dados (Supabase)">
            <div className="space-y-6">
                
                {/* Status Banner */}
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${isConfigured ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {isConfigured ? <Database className="text-green-600" /> : <CloudOff className="text-gray-400" />}
                    <div className="flex-1">
                        <p className="font-bold">{isConfigured ? 'Conectado ao Supabase' : 'Usando Armazenamento Local'}</p>
                        <p className="text-xs opacity-80">{isConfigured ? 'Seus dados estão sendo salvos na nuvem.' : 'Seus dados estão salvos apenas neste navegador.'}</p>
                    </div>
                    {isConfigured && (
                        <button onClick={handleDisconnect} className="text-xs bg-white border border-green-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                            Desconectar
                        </button>
                    )}
                </div>

                {/* Tutorial Accordion style */}
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Crie as Tabelas (SQL)
                    </h4>
                    <p className="text-sm text-gray-600">
                        Vá ao <strong>SQL Editor</strong> do seu projeto no Supabase e rode o código abaixo para criar o banco de dados.
                    </p>
                    <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto h-40 custom-scrollbar">
                            <code>{sqlScript}</code>
                        </pre>
                        <button 
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
                            title="Copiar SQL"
                        >
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                         <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                         Conecte o App
                    </h4>
                    <form onSubmit={handleSave} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project URL</label>
                            <input 
                                type="text" 
                                placeholder="https://seu-projeto.supabase.co"
                                className="w-full p-3 border rounded-xl text-sm"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">API Key (anon / public)</label>
                            <input 
                                type="password" 
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                className="w-full p-3 border rounded-xl text-sm"
                                value={key}
                                onChange={e => setKey(e.target.value)}
                            />
                        </div>

                        {testResult && (
                            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {testResult.success ? <Check size={16} /> : <AlertTriangle size={16} />}
                                {testResult.message}
                            </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                            <button 
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testing || !url || !key}
                                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                {testing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div> : <Wifi size={18} />}
                                Testar
                            </button>
                            <button 
                                type="submit" 
                                disabled={testing}
                                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-100"
                            >
                                <Save size={18} />
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseConfig;