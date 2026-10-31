import React, { useState } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Upload, 
  FolderKanban, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Shield, 
  LogOut, 
  Search, 
  Bell, 
  ChevronDown, 
  Building2, 
  UserCheck, 
  BarChart3, 
  FileSpreadsheet,
  Stethoscope,
  X
} from 'lucide-react';
import { User } from '../types';

interface DashboardLayoutProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  children
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const isDoctor = user.role === 'doctor';

  const doctorNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-analysis', label: 'New Analysis', icon: Upload },
    { id: 'patient-cases', label: 'Patient Cases', icon: FolderKanban },
    { id: 'my-patients', label: 'My Patients', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNav = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manage-doctors', label: 'Manage Doctors', icon: Stethoscope },
    { id: 'manage-patients', label: 'Manage Patients', icon: Users },
    { id: 'all-cases', label: 'All Cases', icon: FileSpreadsheet },
    { id: 'admin-reports', label: 'Reports & Analysis', icon: BarChart3 },
  ];

  const navItems = isDoctor ? doctorNav : adminNav;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 antialiased font-sans">
      {/* ---------------- LEFT SIDEBAR ---------------- */}
      <aside className="w-full md:w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center text-xl font-bold tracking-tight text-white">
                Wrist<span className="text-blue-500">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                {isDoctor ? 'Clinical Support for Wrist Fracture Analysis' : 'Hospital Admin Portal / Wrist Fracture Analysis'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">City Care Hospital</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>WristAI v1.0.0</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/40">
              {isDoctor ? 'Doctor Mode' : 'Admin Mode'}
            </span>
          </div>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          {/* Search bar */}
          <div className="relative w-72 md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isDoctor ? "Search patient name, ID, or date..." : "Search doctors, patients, cases..."}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 transition"
            />
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button 
              onClick={() => setShowNotificationModal(true)}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Hospital Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                3
              </span>
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-xl transition text-left"
              >
                <img
                  src={user.avatar_url || (isDoctor ? "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
                />
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">{user.name}</div>
                  <div className="text-[11px] text-slate-500">{user.role_title || (isDoctor ? 'Radiologist' : 'Hospital Administrator')}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
                    Signed in as <span className="font-semibold text-slate-800">{user.email}</span>
                  </div>
                  {isDoctor && (
                    <button
                      onClick={() => {
                        onTabChange('settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Account Settings
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Notifications Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Hospital Notifications</h3>
              </div>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div className="font-semibold text-blue-900">New Case Analysis Ready</div>
                <div className="text-slate-600 mt-0.5">Case C-2026-0143 (S. Arjun) - Distal radius fracture detected with 99.9% model score.</div>
                <div className="text-[10px] text-blue-500 mt-1">10 minutes ago</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-semibold text-slate-800">Radiology Department Sync</div>
                <div className="text-slate-600 mt-0.5">PACS connection verified. Local PyTorch ResNet-18 model ready for batch triage.</div>
                <div className="text-[10px] text-slate-400 mt-1">1 hour ago</div>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                <div className="font-semibold text-amber-900">Follow-up Patient Scheduled</div>
                <div className="text-slate-600 mt-0.5">Patient S. Meera (P-2026-0141) review scheduled for 02 Nov 2026.</div>
                <div className="text-[10px] text-amber-600 mt-1">Yesterday</div>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
