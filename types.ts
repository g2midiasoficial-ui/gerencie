import React from 'react';

export enum Mode {
  PERSONAL = 'Pessoal',
  BUSINESS = 'Empresarial'
}

export type CategoryType = 'income' | 'expense';

export interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface MaintenanceItem {
  id: string;
  name: string;
  system: string;
  status: 'Atrasada' | 'Pendente' | 'Em Dia';
  dueIn: string;
  mode?: Mode;
}

export interface ShoppingItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  idealQty: number;
  currentQty: number;
  price: number;
  mode?: Mode;
}

export interface FinancialData {
  income: number;
  expenses: number;
  balance: number;
  pendingExpenses: number;
  healthScore: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  mode?: Mode;
  attachment?: string;
  attachmentType?: 'image' | 'audio';
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: string;
  interestRate: number;
  mode?: Mode;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon?: string;
  mode?: Mode;
}

export interface Category {
  id: string;
  name: string;
  type?: CategoryType;
  budget: number;
  spent: number;
  color: string;
  mode?: Mode;
}