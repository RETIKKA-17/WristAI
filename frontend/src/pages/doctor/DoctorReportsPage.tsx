import React, { useEffect, useState } from 'react';
import { 
  FileText, Download, Calendar, Filter, ArrowUpRight, 
  TrendingUp, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import { getDoctorDashboardStatsApi, getExportCsvUrl } from '../../services/api';
import { DoctorDashboardStats } from '../../types';

export const DoctorReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 Days');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDoctorDashboardStatsApi();
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open(getExportCsvUrl(), '_blank');
  };

  const COLORS = {
    fracture: '#EF4444', // Red
    normal: '#38BDF8',   // Light blue
    uncertain: '#F59E0B' // Amber
  };

  const donutData = stats ? [
    { name: 'Fracture Detected', value: stats.outcome_distribution.fracture_detected, color: COLORS.fracture },
    { name: 'No Fracture', value: stats.outcome_distribution.no_fracture, color: COLORS.normal },
    { name: 'Uncertain', value: stats.outcome_distribution.uncertain, color: COLORS.uncertain },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xl">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Clinical Reports & Analytical Summaries</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical diagnostic outcome reports and case review statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Year to Date</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm shadow-blue-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Cases Processed</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_cases || 0}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% verified records</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Fracture Predictions</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats?.fracture_detected || 0}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            {stats?.total_cases ? Math.round((stats.fracture_detected / stats.total_cases) * 100) : 0}% of cohort
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Normal / Intact</div>
          <div className="text-2xl font-bold text-sky-600 mt-1">{stats?.normal_cases || 0}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            {stats?.total_cases ? Math.round((stats.normal_cases / stats.total_cases) * 100) : 0}% of cohort
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Review Needed</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">{stats?.uncertain_cases || 0}</div>
          <div className="text-[11px] text-amber-600 mt-2 font-medium">
            Requires physician confirmation
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Weekly Case Outcome Trend</h3>
              <p className="text-xs text-slate-500">Distribution of AI predictions over weekly batches</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fracture</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Uncertain</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.case_trend_30_days || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="fracture" fill="#EF4444" radius={[4, 4, 0, 0]} name="Fracture" />
                <Bar dataKey="normal" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Normal" />
                <Bar dataKey="uncertain" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Uncertain" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcome Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Outcome Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Cumulative distribution of all cases</p>

          <div className="relative flex-1 flex items-center justify-center min-h-[180px]">
            <ResponsiveContainer width="100%" height={180}>
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
              <span className="text-xl font-bold text-slate-800">{stats?.total_cases || 0}</span>
              <span className="text-[10px] text-slate-400 font-medium">Total Cases</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-slate-800">
                  {d.value} ({stats?.total_cases ? Math.round((d.value / stats.total_cases) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Audit & Validation Summary</h3>
            <p className="text-xs text-slate-500">Recent records registered in the clinical repository</p>
          </div>
          <button 
            onClick={fetchStats}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Study Date</th>
                <th className="py-3 px-4">AI Prediction</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recent_cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-medium text-blue-600">{c.case_id}</td>
                  <td className="py-3 px-4 font-mono">{c.patient_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.patient_name}</td>
                  <td className="py-3 px-4 text-slate-500">{c.study_date}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      c.ai_prediction === 'FRACTURE' 
                        ? 'bg-red-50 text-red-600 border border-red-200' 
                        : c.ai_prediction === 'NORMAL'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
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
                  <td className="py-3 px-4 font-medium text-slate-900">{c.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
