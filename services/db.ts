import { Transaction, ShoppingItem, MaintenanceItem, Debt, Goal, Category, Mode } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// Mapeamento entre nomes internos e nomes das tabelas no Supabase
const TABLE_MAP = {
  transactions: 'transactions',
  shopping: 'shopping_items',
  maintenance: 'maintenance_items',
  debts: 'debts',
  goals: 'goals',
  categories: 'categories'
};

// Prefixo para LocalStorage para evitar conflitos
const LS_PREFIX = 'gerencie_db_';

// Helpers para LocalStorage
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

const getLocal = <T>(key: string): T[] => {
    try {
        const item = localStorage.getItem(LS_PREFIX + key);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error("Erro ao ler LocalStorage:", e);
        return [];
    }
};

const setLocal = (key: string, data: any[]) => {
    try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
    } catch (e) {
        console.error("Erro ao salvar LocalStorage:", e);
    }
};

// Conversor de CamelCase (Frontend) para SnakeCase (Banco de Dados)
const toDb = (data: any) => {
    const newData: any = {};
    Object.keys(data).forEach(key => {
        // Ignora valores nulos ou indefinidos
        if (data[key] === undefined || data[key] === null) return;
        
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        newData[snakeKey] = data[key];
    });
    return newData;
};

// Conversor de SnakeCase (Banco de Dados) para CamelCase (Frontend)
const fromDb = (data: any) => {
    const newData: any = {};
    Object.keys(data).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newData[camelKey] = data[key];
    });
    return newData;
};

class Database {
  async init() {
     const configured = isSupabaseConfigured();
     console.log(`Gerencie DB Initialized. Configured for Cloud: ${configured}`);
     
     if (configured) {
        // Test connection
        const { error } = await supabase.from('transactions').select('id', { count: 'exact', head: true });
        if (error) {
            console.warn("Aviso: Supabase configurado mas com ERRO:", error.message);
            if (error.code === '42P01') {
                console.error("ERRO CRÍTICO: As tabelas não existem no Supabase. Rode o Script SQL no DatabaseConfig.");
            }
        } else {
            console.log("Conexão Supabase: SUCESSO. Banco de dados pronto.");
        }
     }
     window.dispatchEvent(new Event('db-change'));
  }

  reset() {
      if (isSupabaseConfigured()) {
          alert("A função reset não apaga o banco de dados Supabase por segurança.");
      } else {
          // Limpa apenas as chaves do app
          Object.keys(localStorage).forEach(key => {
              if(key.startsWith(LS_PREFIX)) localStorage.removeItem(key);
          });
          console.log("LocalStorage limpo.");
      }
  }

  private createStore<T extends { id: string, mode?: Mode }>(entityName: keyof typeof TABLE_MAP) {
      const tableName = TABLE_MAP[entityName];

      const runLocalAdd = async (item: Omit<T, 'id'>): Promise<T> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const newItem = { ...item, id: generateId() } as T;
        const all = getLocal<T>(entityName);
        all.push(newItem);
        setLocal(entityName, all);
        window.dispatchEvent(new Event('db-change'));
        return newItem;
      };

      return {
          getAll: async (mode?: Mode): Promise<T[]> => {
              if (isSupabaseConfigured()) {
                  try {
                      let query = supabase.from(tableName).select('*');
                      if (mode) query = query.eq('mode', mode);

                      const { data, error } = await query;
                      if (error) throw error;
                      return (data || []).map(fromDb) as T[];
                  } catch (e) {
                      console.warn(`Supabase falhou em getAll para ${entityName}. Usando LocalStorage. Erro:`, e);
                      // Fallback silencioso para LocalStorage
                  }
              } 
              
              // MODO LOCAL STORAGE (Fallback)
              await new Promise(resolve => setTimeout(resolve, 200));
              const all = getLocal<T>(entityName);
              if (mode) return all.filter((x: any) => x.mode === mode);
              return all;
          },

          getById: async (id: string): Promise<T | null> => {
              if (isSupabaseConfigured()) {
                  try {
                    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
                    if (!error && data) return fromDb(data) as T;
                  } catch(e) { console.warn("Erro Supabase getById", e); }
              }

              const all = getLocal<T>(entityName);
              return all.find(x => x.id === id) || null;
          },

          add: async (item: Omit<T, 'id'>): Promise<T | null> => {
              if (isSupabaseConfigured()) {
                  try {
                      const dbItem = toDb(item);
                      delete dbItem.id; 
                      
                      const { data, error } = await supabase.from(tableName).insert(dbItem).select().single();
                      
                      if (error) {
                          console.error(`Supabase Insert Error (${entityName}):`, JSON.stringify(error, null, 2));
                          throw error;
                      }
                      
                      window.dispatchEvent(new Event('db-change'));
                      return fromDb(data) as T;
                  } catch (e) {
                      console.error(`Falha ao salvar no Supabase. Tentando LocalStorage...`);
                      // Fallback para LocalStorage se a nuvem falhar
                      return await runLocalAdd(item);
                  }
              }

              return await runLocalAdd(item);
          },

          update: async (id: string, updates: Partial<T>): Promise<T | null> => {
              if (isSupabaseConfigured()) {
                  try {
                      const dbUpdates = toDb(updates);
                      const { data, error } = await supabase.from(tableName).update(dbUpdates).eq('id', id).select().single();
                      if (error) throw error;
                      window.dispatchEvent(new Event('db-change'));
                      return fromDb(data) as T;
                  } catch (e) {
                      console.error("Erro Supabase Update (Fallback Local)", e);
                  }
              }

              await new Promise(resolve => setTimeout(resolve, 200));
              const all = getLocal<T>(entityName);
              const index = all.findIndex(x => x.id === id);
              if (index !== -1) {
                  all[index] = { ...all[index], ...updates };
                  setLocal(entityName, all);
                  window.dispatchEvent(new Event('db-change'));
                  return all[index];
              }
              return null;
          },

          delete: async (id: string): Promise<boolean> => {
              if (isSupabaseConfigured()) {
                  try {
                      const { error } = await supabase.from(tableName).delete().eq('id', id);
                      if (error) throw error;
                      window.dispatchEvent(new Event('db-change'));
                      return true;
                  } catch (e) {
                      console.error("Erro Supabase Delete (Fallback Local)", e);
                  }
              }

              await new Promise(resolve => setTimeout(resolve, 200));
              const all = getLocal<T>(entityName);
              const filtered = all.filter(x => x.id !== id);
              setLocal(entityName, filtered);
              window.dispatchEvent(new Event('db-change'));
              return true;
          }
      };
  }

  get transactions() { return this.createStore<Transaction>('transactions'); }
  get shopping() { return this.createStore<ShoppingItem>('shopping'); }
  get maintenance() { return this.createStore<MaintenanceItem>('maintenance'); }
  get debts() { return this.createStore<Debt>('debts'); }
  get goals() { return this.createStore<Goal>('goals'); }
  get categories() { return this.createStore<Category>('categories'); }
}

export const db = new Database();