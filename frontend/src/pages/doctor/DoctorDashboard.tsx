import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  FileText, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Upload, 
  UserCheck, 
  FolderClock, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Eye, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { getDoctorDashboardStatsApi } from '../../services/api';
import { DoctorDashboardStats, CaseRecord, User } from '../../types';

interface DoctorDashboardProps {
  user: User;
  onNavigate: (tab: string, caseId?: number | string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTableTab, setActiveTableTab] = useState<'recent' | 'needs_review' | 'all'>('recent');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDoctorDashboardStatsApi();
      setStats(data);
    } catch (err) {
      console.error("Failed to load doctor stats", err);
    } finally {
      setLoading(false);
    }
  };

  const donutColors = ['#EF4444', '#10B981', '#F59E0B'];

  const displayedCases = stats?.recent_cases ? (
    activeTableTab === 'needs_review'
      ? stats.recent_cases.filter(c => c.status === 'Needs Review')
      : stats.recent_cases
  ) : [];

  return (
    <div className="space-y-6">
      {/* ---------------- WELCOME BANNER ---------------- */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white p-6 md:p-8 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Hospital Physician Portal
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user.name}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Here is your clinical case summary for today. Review newly uploaded wrist radiographs, verify model scores, and finalize diagnostic reports.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-blue-300 border border-slate-700/60 font-medium">
                <Building2 className="w-3.5 h-3.5" />
                {user.department || 'Department of Radiology'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                City Care Hospital
              </span>
            </div>
          </div>

          {/* Mini Calendar Widget from PDF */}
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shrink-0 w-full md:w-64">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Today
              </span>
              <span className="text-slate-400 font-medium text-[11px]">Mon, 26 Oct 2026</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
              <span className="text-slate-500 font-semibold">Sun</span>
              <span className="text-blue-400 font-bold">Mon</span>
              <span className="text-slate-500 font-semibold">Tue</span>
              <span className="text-slate-500 font-semibold">Wed</span>
              <span className="text-slate-500 font-semibold">Thu</span>
              <span className="text-slate-500 font-semibold">Fri</span>
              <span className="text-slate-500 font-semibold">Sat</span>
              
              <span className="py-1 text-slate-400">25</span>
              <span className="py-1 bg-blue-600 text-white rounded-lg font-bold shadow-xs">26</span>
              <span className="py-1 text-slate-400">27</span>
              <span className="py-1 text-slate-400">28</span>
              <span className="py-1 text-slate-400">29</span>
              <span className="py-1 text-slate-400">30</span>
              <span className="py-1 text-slate-400">31</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 5 STAT CARDS ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Cases Analyzed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cases Analyzed</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.total_cases ?? 12}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+20% vs yesterday</span>
          </div>
        </div>

        {/* Card 2: Unique Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Unique Patients</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.unique_patients ?? 10}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <span>Across 3 departments</span>
          </div>
        </div>

        {/* Card 3: Fracture Detected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Fracture Detected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {stats?.fracture_detected ?? 8}
          </div>
          <div className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
            <span>Verified cortical findings</span>
          </div>
        </div>

        {/* Card 4: Uncertain Cases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Uncertain Cases</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {stats?.uncertain_cases ?? 3}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            Needs doctor review
          </div>
        </div>

        {/* Card 5: Avg. Analysis Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg. Analysis Time</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ~128ms
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Fresh GPU/CPU inference
          </div>
        </div>
      </div>

      {/* ---------------- CHARTS ROW & QUICK ACTIONS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Case Trend (Last 30 Days) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Case Trend (Last 30 Days)</h3>
              <p className="text-xs text-slate-400">Total Cases vs Positive Fractures</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-medium border border-slate-200">
              Last 30 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.case_trend_30_days || []}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="total" name="Total Cases" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fracture" name="Fracture Detected" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="normal" name="No Fracture" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="uncertain" name="Uncertain" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Case Outcome Donut */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Case Outcome</h3>
            <p className="text-xs text-slate-400">Diagnostic Distribution</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Fracture Detected', value: stats?.fracture_detected ?? 8 },
                    { name: 'No Fracture', value: stats?.normal_cases ?? 4 },
                    { name: 'Uncertain', value: stats?.uncertain_cases ?? 2 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutColors.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">
                {stats?.total_cases ?? 14}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Total Cases</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                Fracture Detected
              </span>
              <span className="font-bold text-slate-900">{stats?.fracture_detected ?? 8}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                No Fracture
              </span>
              <span className="font-bold text-slate-900">{stats?.normal_cases ?? 4}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                Uncertain
              </span>
              <span className="font-bold text-slate-900">{stats?.uncertain_cases ?? 2}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Cards (4 Cards) */}
        <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
          <div 
            onClick={() => onNavigate('new-analysis')}
            className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 cursor-pointer hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Upload className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/70 group-hover:text-white transition" />
            </div>
            <h4 className="font-bold text-sm mt-3">Upload X-ray</h4>
            <p className="text-[11px] text-blue-100 mt-0.5">Analyze new wrist radiograph</p>
          </div>

          <div 
            onClick={() => onNavigate('my-patients')}
            className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 mt-3">View My Patients</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage patient records</p>
          </div>

          <div 
            onClick={() => onNavigate('reports')}
            className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 mt-3">Generate Report</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Download analysis reports</p>
          </div>

          <div 
            onClick={() => onNavigate('patient-cases')}
            className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FolderClock className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 mt-3">Review Pending</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats?.uncertain_cases ?? 3} cases awaiting review</p>
          </div>
        </div>

      </div>

      {/* ---------------- RECENT CASES TABLE ---------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTableTab('recent')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTableTab === 'recent'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Recent Cases
            </button>
            <button
              onClick={() => setActiveTableTab('needs_review')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTableTab === 'needs_review'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Needs Review ({stats?.uncertain_cases ?? 3})
            </button>
            <button
              onClick={() => onNavigate('patient-cases')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              All Cases
            </button>
          </div>

          <button
            onClick={() => onNavigate('patient-cases')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-end sm:self-auto"
          >
            <span>View All Cases</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">#</th>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">AI Result</th>
                <th className="py-3 px-4">Model Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No cases found in this category.
                  </td>
                </tr>
              ) : (
                displayedCases.map((c, idx) => {
                  const isFracture = c.ai_prediction === 'FRACTURE';
                  const isNormal = c.ai_prediction === 'NORMAL';
                  const isUncertain = c.ai_prediction === 'UNCERTAIN';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-6 font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-blue-600">{c.patient_id}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{c.patient_name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{c.age} / {c.sex}</td>
                      <td className="py-3.5 px-4 text-slate-500">{c.study_date}</td>
                      <td className="py-3.5 px-4">
                        {isFracture && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                            Fracture Detected
                          </span>
                        )}
                        {isNormal && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            No Fracture
                          </span>
                        )}
                        {isUncertain && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                            Uncertain
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {c.confidence}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.status === 'Reviewed' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => onNavigate('case-detail', c.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="View Case Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
