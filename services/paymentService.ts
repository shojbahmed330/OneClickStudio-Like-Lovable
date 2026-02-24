
import { supabase } from './supabaseClient';
import { Package, Transaction } from '../types';

export const paymentService = {
  async getPackages() { 
    const { data } = await supabase.from('packages').select('*').order('price', { ascending: true }); 
    return data || []; 
  },

  async getUserTransactions(userId: string) { 
    const { data } = await supabase.from('transactions').select('*, packages(name)').eq('user_id', userId); 
    return data || []; 
  },

  async submitPaymentRequest(userId: string, pkgId: string, amount: number, method: string, trxId: string, screenshot?: string, message?: string) {
    const { data } = await supabase.from('transactions').insert({ 
      user_id: userId, package_id: pkgId, amount, status: 'pending', 
      payment_method: method, trx_id: trxId, screenshot_url: screenshot, message 
    }).select();
    return !!data;
  },

  async getAdminTransactions(): Promise<Transaction[]> {
    const { data } = await supabase.from('transactions').select('*, packages(name), users(email)').order('created_at', { ascending: false });
    return (data || []).map((tx: any) => ({ ...tx, user_email: tx.users?.email || 'Unknown' }));
  },

  async updateTransactionStatus(id: string, status: 'completed' | 'rejected') {
    const { data } = await supabase.from('transactions').update({ status }).eq('id', id).select().single();
    return data;
  }
};
