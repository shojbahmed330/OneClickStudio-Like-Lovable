
import { supabase } from './supabaseClient';
import { authService } from './authService';
import { projectService, ProjectHistoryItem } from './projectService';
import { paymentService } from './paymentService';
import { User, Package, Transaction, ActivityLog, GithubConfig, Project, ProjectConfig } from '../types';

export type { ProjectHistoryItem };

export class DatabaseService {
  private static instance: DatabaseService;
  public supabase = supabase;
  
  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Auth Delegation
  onAuthStateChange = authService.onAuthStateChange.bind(authService);
  getCurrentSession = authService.getCurrentSession.bind(authService);
  signIn = authService.signIn.bind(authService);
  signInWithOAuth = authService.signInWithOAuth.bind(authService);
  getUser = authService.getUser.bind(authService);
  updateGithubConfig = authService.updateGithubConfig.bind(authService);
  updateGithubTokenOnly = authService.updateGithubTokenOnly.bind(authService);
  linkGithubIdentity = authService.linkGithubIdentity.bind(authService);
  unlinkGithubIdentity = authService.unlinkGithubIdentity.bind(authService);
  signUp = authService.signUp.bind(authService);
  signOut = authService.signOut.bind(authService);

  // Project Delegation
  getProjects = projectService.getProjects.bind(projectService);
  getProjectById = projectService.getProjectById.bind(projectService);
  deleteProject = projectService.deleteProject.bind(projectService);
  saveProject = projectService.saveProject.bind(projectService);
  updateProject = projectService.updateProject.bind(projectService);
  renameProject = projectService.renameProject.bind(projectService);
  createProjectSnapshot = projectService.createProjectSnapshot.bind(projectService);
  getProjectHistory = projectService.getProjectHistory.bind(projectService);
  deleteProjectSnapshot = projectService.deleteProjectSnapshot.bind(projectService);

  // Payment Delegation
  getPackages = paymentService.getPackages.bind(paymentService);
  getUserTransactions = paymentService.getUserTransactions.bind(paymentService);
  submitPaymentRequest = paymentService.submitPaymentRequest.bind(paymentService);
  getAdminTransactions = paymentService.getAdminTransactions.bind(paymentService);
  updateTransactionStatus = paymentService.updateTransactionStatus.bind(paymentService);

  // Core Utilities & Admin
  async useToken(userId: string, email: string): Promise<User | null> {
    const userResult = await this.getUser(email, userId);
    if (userResult?.isAdmin) return userResult;
    if (userResult && userResult.tokens > 0) {
      await this.supabase.from('users').update({ tokens: userResult.tokens - 1 }).eq('id', userId);
    }
    return this.getUser(email, userId);
  }

  async updatePassword(newPassword: string) { await (this.supabase.auth as any).updateUser({ password: newPassword }); }
  async resetPassword(email: string) { return await (this.supabase.auth as any).resetPasswordForEmail(email, { redirectTo: window.location.origin + '/profile' }); }
  async toggleAdminStatus(userId: string, status: boolean) { await this.supabase.from('users').update({ is_admin: status }).eq('id', userId); }
  async toggleBanStatus(userId: string, status: boolean) { await this.supabase.from('users').update({ is_banned: status }).eq('id', userId); }
  async addUserTokens(userId: string, tokens: number) {
    const { data: user } = await this.supabase.from('users').select('tokens').eq('id', userId).single();
    if (user) await this.supabase.from('users').update({ tokens: (user.tokens || 0) + tokens }).eq('id', userId);
  }

  async getAdminStats() {
    try {
      const { count: usersToday } = await this.supabase.from('users').select('*', { count: 'exact', head: true });
      const { data: transactions } = await this.supabase.from('transactions').select('amount').eq('status', 'completed');
      const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      return { totalRevenue, usersToday: usersToday || 0, topPackage: 'Professional', salesCount: transactions?.length || 0, chartData: [{ date: 'Mon', revenue: totalRevenue * 0.1 }, { date: 'Tue', revenue: totalRevenue * 0.2 }, { date: 'Wed', revenue: totalRevenue * 0.15 }, { date: 'Thu', revenue: totalRevenue * 0.25 }, { date: 'Fri', revenue: totalRevenue * 0.3 }] };
    } catch (e) { return { totalRevenue: 0, usersToday: 0, topPackage: 'N/A', salesCount: 0, chartData: [] }; }
  }

  async getActivityLogs(): Promise<ActivityLog[]> { 
    const { data } = await this.supabase.from('activity_logs').select('*').order('created_at', { ascending: false }); 
    return data || []; 
  }
  
  async createPackage(pkg: Partial<Package>) { await this.supabase.from('packages').insert(pkg); }
  async updatePackage(id: string, pkg: Partial<Package>) { await this.supabase.from('packages').update(pkg).eq('id', id); }
  async deletePackage(id: string) { await this.supabase.from('packages').delete().eq('id', id); }
}
