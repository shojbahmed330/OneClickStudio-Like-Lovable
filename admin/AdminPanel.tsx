
import React, { useState, useEffect } from 'react';
import { Loader2, BarChart3, Users, CreditCard, Package as PackageIcon, Terminal, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User as UserType, Package, Transaction, ActivityLog } from '../types';
import { DatabaseService } from '../services/dbService';

// Sub-components
import StatsCards from './components/StatsCards';
import UserTable from './components/UserTable';
import PaymentTable from './components/PaymentTable';
import PackageList from './components/PackageList';
import AdminModals from './components/AdminModals';

interface AdminPanelProps { 
    user: UserType; 
    onApprovePayment: (txId: string) => Promise<void>;
    onRejectPayment: (txId: string) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onApprovePayment, onRejectPayment }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'payments' | 'packages' | 'logs'>('stats');
  const [stats, setStats] = useState({ totalRevenue: 0, usersToday: 0, topPackage: 'N/A', salesCount: 0, chartData: [] });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newTokenCount, setNewTokenCount] = useState<number>(0);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', tokens: 0, price: 0 });
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showEditPackageModal, setShowEditPackageModal] = useState(false);

  const db = DatabaseService.getInstance();
  
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') setStats(await db.getAdminStats() as any);
      if (activeTab === 'payments') setTransactions(await db.getAdminTransactions());
      if (activeTab === 'packages') setPackages(await db.getPackages());
      if (activeTab === 'logs') setActivityLogs(await db.getActivityLogs());
      if (activeTab === 'users') {
        const { data } = await db.supabase.from('users').select('*').order('created_at', { ascending: false });
        setAdminUsers((data || []).map((u: any) => ({
            ...u,
            isAdmin: u.is_admin,
            isLoggedIn: true,
            joinedAt: new Date(u.created_at).getTime()
        })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const handleApprove = async (id: string) => {
    await onApprovePayment(id);
    loadData();
  };

  const handleReject = async (id: string) => {
    await onRejectPayment(id);
    loadData();
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm("ডিলিট করবেন?")) return;
    try {
        await db.deletePackage(id);
        loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateTokens = async () => {
    if (!editingUser) return;
    await db.supabase.from('users').update({ tokens: newTokenCount }).eq('id', editingUser.id);
    setEditingUser(null); loadData();
  };

  const handleBanToggle = async (userId: string, email: string, currentStatus: boolean) => {
      try {
          await db.toggleBanStatus(userId, !currentStatus);
          loadData();
      } catch (e: any) { alert(e.message); }
  };

  const handleAdminToggle = async (userId: string, currentStatus: boolean) => {
      if (userId === user.id) {
          alert("নিজের এডমিন পারমিশন নিজে বন্ধ করতে পারবেন না।");
          return;
      }
      try {
          await db.toggleAdminStatus(userId, !currentStatus);
          alert("Admin status updated successfully!");
          loadData();
      } catch (e: any) { alert(e.message); }
  };

  const handleCreatePackage = async () => {
    await db.createPackage({ ...newPackage, color: 'pink', icon: 'Package', is_popular: false });
    setShowPackageModal(false); loadData();
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage) return;
    await db.updatePackage(editingPackage.id, editingPackage);
    setShowEditPackageModal(false); loadData();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#050108]">
      <AdminModals 
        previewImage={previewImage} setPreviewImage={setPreviewImage}
        editingUser={editingUser} setEditingUser={setEditingUser}
        newTokenCount={newTokenCount} setNewTokenCount={setNewTokenCount}
        handleUpdateTokens={handleUpdateTokens}
        showPackageModal={showPackageModal} setShowPackageModal={setShowPackageModal}
        newPackage={newPackage} setNewPackage={setNewPackage}
        handleCreatePackage={handleCreatePackage}
        showEditPackageModal={showEditPackageModal} setShowEditPackageModal={setShowEditPackageModal}
        editingPackage={editingPackage} setEditingPackage={setEditingPackage}
        handleUpdatePackage={handleUpdatePackage}
      />

      <aside className="w-full md:w-64 border-r border-pink-500/10 bg-black/40 p-6 flex flex-col gap-2">
        <div className="mb-8 px-2"><h2 className="text-xl font-black text-pink-500">ADMIN <span className="text-white">HQ</span></h2></div>
        {[
          { id: 'stats', icon: BarChart3, label: 'Dashboard' },
          { id: 'users', icon: Users, label: 'Members' },
          { id: 'payments', icon: CreditCard, label: 'Payments' },
          { id: 'packages', icon: PackageIcon, label: 'Packages' },
          { id: 'logs', icon: Terminal, label: 'Logs' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === tab.id ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {loading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-pink-500" size={40}/></div> : (
          <div className="max-w-6xl mx-auto">
            {activeTab === 'stats' && (
              <div className="space-y-8">
                <StatsCards stats={stats} />
                <div className="glass-tech p-8 rounded-[3rem] h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis /><Tooltip /><Area type="monotone" dataKey="revenue" stroke="#ff2d75" fill="#ff2d7533" /></AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
            )}
            {activeTab === 'payments' && <PaymentTable transactions={transactions} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setPreviewImage={setPreviewImage} handleApprove={handleApprove} handleReject={handleReject} />}
            {activeTab === 'users' && <UserTable users={adminUsers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setEditingUser={setEditingUser} setNewTokenCount={setNewTokenCount} handleBanToggle={handleBanToggle} onAdminToggle={handleAdminToggle} />}
            {activeTab === 'packages' && <PackageList packages={packages} setEditingPackage={setEditingPackage} setShowEditPackageModal={setShowEditPackageModal} handleDeletePackage={handleDeletePackage} setShowPackageModal={setShowPackageModal} />}
            {activeTab === 'logs' && <div className="glass-tech rounded-[2.5rem] p-8 space-y-4">{activityLogs.map(log => <div key={log.id} className="text-[11px] bg-white/5 p-4 rounded-xl">{log.details}</div>)}</div>}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
