import { createClient } from '@supabase/supabase-js';

const LS_URL_KEY = 'gerencie_supabase_url';
const LS_API_KEY = 'gerencie_supabase_key';

const getStoredConfig = () => {
    return {
        url: localStorage.getItem(LS_URL_KEY)?.trim() || '',
        key: localStorage.getItem(LS_API_KEY)?.trim() || ''
    }
}

// Helper para garantir que a URL tenha protocolo
const formatUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

// Configuração via variável de ambiente (fallback) ou LocalStorage (prioridade para UI)
const envUrl = (process.env.SUPABASE_URL || '').trim();
const envKey = (process.env.SUPABASE_KEY || '').trim();

const { url: storedUrl, key: storedKey } = getStoredConfig();

// Prioriza o que o usuário digitou na UI, depois o ENV, depois placeholders seguros
const finalUrl = formatUrl(storedUrl || envUrl || 'https://placeholder.supabase.co');
const finalKey = storedKey || envKey || 'placeholder';

// Cria o cliente. Se a URL for inválida, o Supabase pode lançar erro, então envolvemos em try/catch na utilização, 
// mas a inicialização geralmente é síncrona.
export const supabase = createClient(finalUrl, finalKey);

export const isSupabaseConfigured = () => {
    // Verifica se a URL atual é válida (não é placeholder e tem formato correto)
    return finalUrl.includes('supabase.co') && finalUrl !== 'https://placeholder.supabase.co' && finalKey !== 'placeholder';
};

export const saveSupabaseConfig = (url: string, key: string) => {
    const cleanUrl = formatUrl(url.trim());
    localStorage.setItem(LS_URL_KEY, cleanUrl);
    localStorage.setItem(LS_API_KEY, key.trim());
    window.location.reload(); // Recarrega para aplicar a nova conexão
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem(LS_URL_KEY);
    localStorage.removeItem(LS_API_KEY);
    window.location.reload();
};