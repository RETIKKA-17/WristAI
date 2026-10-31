import React, { useEffect, useState } from 'react';
import { 
  Users, Stethoscope, FileSpreadsheet, Activity, ArrowUpRight, 
  ArrowDownRight, Calendar, ExternalLink, Clock, Plus, Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';
import { getAdminDashboardStatsApi } from '../../services/api';
import { AdminDashboardStats, CaseRecord } from '../../types';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onViewCase?: (c: CaseRecord) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onViewCase }) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('26 Oct 2026 - 01 Nov 2026');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getAdminDashboardStatsApi();
      setStats(res);
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const donutColors = {
    fracture: '#EF4444', // Red
    normal: '#38BDF8',   // Light blue
    uncertain: '#F59E0B' // Amber
  };

  const donutData = stats ? [
    { name: 'Fracture Detected', value: stats.analysis_results_donut.fracture_detected, color: donutColors.fracture },
    { name: 'No Fracture', value: stats.analysis_results_donut.no_fracture, color: donutColors.normal },
    { name: 'Uncertain', value: stats.analysis_results_donut.uncertain, color: donutColors.uncertain }
  ] : [];

  const sparklineData1 = [{ v: 10 }, { v: 11 }, { v: 11 }, { v: 12 }, { v: 12 }, { v: 12 }];
  const sparklineData2 = [{ v: 28 }, { v: 30 }, { v: 32 }, { v: 33 }, { v: 35 }, { v: 36 }];
  const sparklineData3 = [{ v: 65 }, { v: 70 }, { v: 74 }, { v: 78 }, { v: 80 }, { v: 84 }];
  const sparklineData4 = [{ v: 40 }, { v: 44 }, { v: 47 }, { v: 49 }, { v: 51 }, { v: 52 }];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of hospital activities and AI analysis usage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option>26 Oct 2026 - 01 Nov 2026</option>
              <option>19 Oct 2026 - 25 Oct 2026</option>
              <option>Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Matching Page 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Doctors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats?.total_doctors ?? 12}</div>
            <div className="text-xs text-slate-500 font-medium">Total Doctors</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 8%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData1}>
                <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} fill="#DBEAFE" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats?.total_patients ?? 36}</div>
            <div className="text-xs text-slate-500 font-medium">Total Patients</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 12%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData2}>
                <Area type="monotone" dataKey="v" stroke="#9333EA" strokeWidth={2} fill="#F3E8FF" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Cases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats?.total_cases ?? 84}</div>
            <div className="text-xs text-slate-500 font-medium">Total Cases</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 15%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData3}>
                <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fill="#FEF3C7" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fracture Detected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats?.fracture_detected ?? 52}</div>
            <div className="text-xs text-slate-500 font-medium">Fracture Detected</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 10%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData4}>
                <Area type="monotone" dataKey="v" stroke="#EF4444" strokeWidth={2} fill="#FEE2E2" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Row Charts: Cases Overview (Bar) + AI Analysis Results (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Overview Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Cases Overview</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fracture Detected</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> No Fracture</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Uncertain</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weekly_overview || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="fracture" fill="#EF4444" radius={[3, 3, 0, 0]} name="Fracture" />
                <Bar dataKey="normal" fill="#38BDF8" radius={[3, 3, 0, 0]} name="No Fracture" />
                <Bar dataKey="uncertain" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Uncertain" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Results Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">AI Analysis Results</h3>

            <div className="relative flex items-center justify-center my-4 min-h-[160px]">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">{stats?.total_cases ?? 84}</span>
                <span className="text-[10px] text-slate-400 font-medium">Total Cases</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Fracture Detected
              </span>
              <span className="font-semibold text-slate-800">
                {stats?.fracture_detected ?? 52} ({stats?.total_cases ? Math.round((stats.fracture_detected / stats.total_cases) * 1000) / 10 : 61.9}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                No Fracture
              </span>
              <span className="font-semibold text-slate-800">
                {stats?.normal_cases ?? 26} ({stats?.total_cases ? Math.round((stats.normal_cases / stats.total_cases) * 1000) / 10 : 31.0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Uncertain
              </span>
              <span className="font-semibold text-slate-800">
                {stats?.uncertain_cases ?? 6} ({stats?.total_cases ? Math.round((stats.uncertain_cases / stats.total_cases) * 1000) / 10 : 7.1}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Cases Table + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Recent Cases</h3>
            <button
              onClick={() => onNavigate('all-cases')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="py-2.5 px-4 w-10">#</th>
                  <th className="py-2.5 px-4">Patient ID</th>
                  <th className="py-2.5 px-4">Patient Name</th>
                  <th className="py-2.5 px-4">Age / Sex</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">AI Result</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(stats?.recent_cases || []).slice(0, 5).map((c, idx) => (
                  <tr key={c.id || idx} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => onViewCase?.(c)}>
                    <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{c.patient_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.patient_name}</td>
                    <td className="py-3 px-4 text-slate-500">{c.age} / {c.sex}</td>
                    <td className="py-3 px-4 text-slate-500">{c.study_date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.ai_prediction === 'FRACTURE'
                          ? 'bg-red-50 text-red-600 border border-red-200/80'
                          : c.ai_prediction === 'NORMAL'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                          : 'bg-amber-50 text-amber-600 border border-amber-200/80'
                      }`}>
                        {c.ai_prediction === 'FRACTURE' ? 'Fracture Detected' : c.ai_prediction === 'NORMAL' ? 'No Fracture' : 'Uncertain'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Timeline Matching Page 5 */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Recent Activities</h3>
              <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">View All</span>
            </div>

            <div className="space-y-4">
              {(stats?.recent_activities || [
                { id: 1, title: 'New case analysed', description: 'P-2026-0143 (S. Arjun)', timestamp_str: '26 Oct 2026, 10:12 AM', icon_type: 'case' },
                { id: 2, title: 'New doctor account created', description: 'Dr. Priya M', timestamp_str: '26 Oct 2026, 09:30 AM', icon_type: 'doctor' },
                { id: 3, title: 'Report generated', description: 'P-2026-0142 (R. Karthik)', timestamp_str: '26 Oct 2026, 09:10 AM', icon_type: 'report' },
                { id: 4, title: 'Patient record updated', description: 'P-2026-0139 (K. Divya)', timestamp_str: '25 Oct 2026, 04:20 PM', icon_type: 'patient' },
                { id: 5, title: 'Monthly report viewed', description: 'Administration Audit', timestamp_str: '26 Oct 2026, 11:00 AM', icon_type: 'chart' }
              ]).map((act, i) => (
                <div key={act.id || i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                    act.icon_type === 'case' ? 'bg-blue-600' :
                    act.icon_type === 'doctor' ? 'bg-emerald-600' :
                    act.icon_type === 'report' ? 'bg-amber-500' :
                    act.icon_type === 'patient' ? 'bg-purple-600' : 'bg-indigo-600'
                  }`}>
                    {act.icon_type === 'doctor' ? <Stethoscope className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-xs flex-1">
                    <span className="font-semibold text-slate-800 block">{act.title}</span>
                    <span className="text-slate-500 block text-[11px]">{act.description}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{act.timestamp_str}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
