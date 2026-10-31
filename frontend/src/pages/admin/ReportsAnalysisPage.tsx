import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Download, Calendar, Search, Filter, RotateCcw, 
  Activity, CheckCircle2, AlertCircle, FileSpreadsheet, Building2,
  Stethoscope, TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts';
import { getReportsDataApi, getExportCsvUrl } from '../../services/api';

export const ReportsAnalysisPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('26 Oct 2026 - 01 Nov 2026');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getReportsDataApi();
      setData(res);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open(getExportCsvUrl(), '_blank');
  };

  // Sparkline curves
  const sparklineBlue = [{ v: 65 }, { v: 70 }, { v: 74 }, { v: 78 }, { v: 80 }, { v: 84 }];
  const sparklineRed = [{ v: 40 }, { v: 44 }, { v: 47 }, { v: 49 }, { v: 51 }, { v: 52 }];
  const sparklineOrange = [{ v: 20 }, { v: 22 }, { v: 23 }, { v: 25 }, { v: 25 }, { v: 26 }];
  const sparklinePurple = [{ v: 10 }, { v: 9 }, { v: 8 }, { v: 7 }, { v: 6 }, { v: 6 }];

  // Cases Trend weekly data
  const casesTrendData = [
    { date: '26 Oct', fracture: 28, normal: 16, uncertain: 4 },
    { date: '27 Oct', fracture: 31, normal: 18, uncertain: 3 },
    { date: '28 Oct', fracture: 24, normal: 20, uncertain: 5 },
    { date: '29 Oct', fracture: 29, normal: 17, uncertain: 4 },
    { date: '30 Oct', fracture: 25, normal: 19, uncertain: 3 },
    { date: '31 Oct', fracture: 22, normal: 15, uncertain: 2 },
    { date: '01 Nov', fracture: 26, normal: 18, uncertain: 4 }
  ];

  // Donut data
  const donutData = [
    { name: 'Fracture Detected', value: 52, color: '#EF4444' },
    { name: 'No Fracture', value: 26, color: '#38BDF8' },
    { name: 'Uncertain', value: 6, color: '#F59E0B' }
  ];

  // Cases by department
  const deptData = data?.cases_by_department || [
    { department: 'Radiology', cases: 35 },
    { department: 'Orthopedics', cases: 22 },
    { department: 'Emergency', cases: 15 },
    { department: 'General Surgery', cases: 8 },
    { department: 'Others', cases: 4 }
  ];

  // Cases by doctor
  const docData = data?.cases_by_doctor || [
    { doctor: 'Dr. Ananya S', cases: 18 },
    { doctor: 'Dr. Karthik V', cases: 16 },
    { doctor: 'Dr. Priya M', cases: 12 },
    { doctor: 'Dr. Rahul K', cases: 10 },
    { doctor: 'Dr. Sneha R', cases: 8 },
    { doctor: 'Others', cases: 20 }
  ];

  // Monthly Comparison
  const monthlyData = data?.monthly_comparison || [
    { month: 'Jun', fracture: 40, normal: 25, uncertain: 5 },
    { month: 'Jul', fracture: 48, normal: 28, uncertain: 6 },
    { month: 'Aug', fracture: 55, normal: 32, uncertain: 8 },
    { month: 'Sep', fracture: 62, normal: 35, uncertain: 7 },
    { month: 'Oct', fracture: 70, normal: 38, uncertain: 6 },
    { month: 'Nov', fracture: 74, normal: 40, uncertain: 8 }
  ];

  // Filtered Detailed Cases Summary
  const rawCases = data?.detailed_case_summary || [
    { case_id: 'C-2026-0143', patient_name: 'S. Arjun', age_sex: '14 / M', doctor_name: 'Dr. Ananya S', department: 'Radiology', date_time: '26 Oct 2026, 10:12 AM', ai_result: 'FRACTURE', review_status: 'Reviewed' },
    { case_id: 'C-2026-0142', patient_name: 'R. Karthik', age_sex: '16 / M', doctor_name: 'Dr. Karthik V', department: 'Orthopedics', date_time: '26 Oct 2026, 09:45 AM', ai_result: 'NORMAL', review_status: 'Reviewed' },
    { case_id: 'C-2026-0141', patient_name: 'S. Meera', age_sex: '12 / F', doctor_name: 'Dr. Priya M', department: 'Radiology', date_time: '25 Oct 2026, 09:20 AM', ai_result: 'UNCERTAIN', review_status: 'Needs Review' },
    { case_id: 'C-2026-0140', patient_name: 'A. Vivek', age_sex: '28 / M', doctor_name: 'Dr. Rahul K', department: 'Emergency', date_time: '24 Oct 2026, 08:55 AM', ai_result: 'FRACTURE', review_status: 'Reviewed' },
    { case_id: 'C-2026-0139', patient_name: 'K. Divya', age_sex: '19 / F', doctor_name: 'Dr. Sneha R', department: 'Orthopedics', date_time: '24 Oct 2026, 04:30 PM', ai_result: 'NORMAL', review_status: 'Reviewed' }
  ];

  const filteredCases = rawCases.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.case_id.toLowerCase().includes(q) ||
      c.patient_name.toLowerCase().includes(q) ||
      c.doctor_name.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Matching Page 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports & Analysis</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Insights from hospital cases and AI analysis results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option>26 Oct 2026 - 01 Nov 2026</option>
              <option>19 Oct 2026 - 25 Oct 2026</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm shadow-blue-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Matching Page 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">84</div>
            <div className="text-xs text-slate-500 font-medium">Total Cases</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 15%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineBlue}>
                <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} fill="#DBEAFE" fillOpacity={0.4} />
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
            <div className="text-2xl font-bold text-slate-800">52</div>
            <div className="text-xs text-slate-500 font-medium">Fracture Detected</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 12%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineRed}>
                <Area type="monotone" dataKey="v" stroke="#EF4444" strokeWidth={2} fill="#FEE2E2" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* No Fracture */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">26</div>
            <div className="text-xs text-slate-500 font-medium">No Fracture</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 8%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineOrange}>
                <Area type="monotone" dataKey="v" stroke="#38BDF8" strokeWidth={2} fill="#E0F2FE" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uncertain */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">6</div>
            <div className="text-xs text-slate-500 font-medium">Uncertain</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-red-500 mt-1">
              <span>↓ 14%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklinePurple}>
                <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fill="#FEF3C7" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Cases Trend + AI Analysis Results Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Cases Trend</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fracture Detected</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> No Fracture</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Uncertain</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={casesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="fracture" fill="#EF4444" radius={[3, 3, 0, 0]} name="Fracture Detected" />
                <Bar dataKey="normal" fill="#38BDF8" radius={[3, 3, 0, 0]} name="No Fracture" />
                <Bar dataKey="uncertain" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Uncertain" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Results Donut */}
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
                <span className="text-2xl font-bold text-slate-800">84</span>
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
              <span className="font-semibold text-slate-800">52 (61.9%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                No Fracture
              </span>
              <span className="font-semibold text-slate-800">26 (31.0%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Uncertain
              </span>
              <span className="font-semibold text-slate-800">6 (7.1%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Cases by Dept + Cases by Doctor + Monthly Comparison Matching Page 9 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cases by Department */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Cases by Department</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="cases" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Cases" label={{ position: 'top', fill: '#475569', fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cases by Doctor */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Cases by Doctor</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docData} layout="vertical" margin={{ top: 5, right: 25, left: 35, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="doctor" type="category" tick={{ fontSize: 10, fill: '#64748B' }} width={75} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="cases" fill="#60A5FA" radius={[0, 4, 4, 0]} name="Cases" label={{ position: 'right', fill: '#475569', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Monthly Comparison</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="fracture" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Fracture" />
                <Line type="monotone" dataKey="normal" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3 }} name="Normal" />
                <Line type="monotone" dataKey="uncertain" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Uncertain" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Fracture</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /> No Fracture</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Uncertain</span>
          </div>
        </div>
      </div>

      {/* Detailed Case Summary Table Matching Page 9 */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">Detailed Case Summary</h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by case ID, patient name, or doctor..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
              />
            </div>
            <button className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-2.5 px-4 w-10">#</th>
                <th className="py-2.5 px-4">Case ID</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">Age / Sex</th>
                <th className="py-2.5 px-4">Doctor Name</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">AI Result</th>
                <th className="py-2.5 px-4">Review Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCases.map((c: any, idx: number) => (
                <tr key={c.case_id || idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-medium text-blue-600">{c.case_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.patient_name}</td>
                  <td className="py-3 px-4 text-slate-500">{c.age_sex}</td>
                  <td className="py-3 px-4 text-slate-700">{c.doctor_name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.department}</td>
                  <td className="py-3 px-4 text-slate-500">{c.date_time}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      c.ai_result === 'FRACTURE'
                        ? 'bg-red-50 text-red-600 border border-red-200/80'
                        : c.ai_result === 'NORMAL'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                        : 'bg-amber-50 text-amber-600 border border-amber-200/80'
                    }`}>
                      {c.ai_result === 'FRACTURE' ? 'Fracture Detected' : c.ai_result === 'NORMAL' ? 'No Fracture' : 'Uncertain'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      c.review_status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {c.review_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>Showing 1-{filteredCases.length} of 84 cases</div>
          <div className="flex items-center gap-1.5">
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40">&lt;</button>
            <button className="w-6 h-6 rounded bg-blue-600 text-white font-semibold">1</button>
            <button className="w-6 h-6 rounded border border-slate-200 hover:bg-slate-50">2</button>
            <button className="w-6 h-6 rounded border border-slate-200 hover:bg-slate-50">3</button>
            <button className="w-6 h-6 rounded border border-slate-200 hover:bg-slate-50">4</button>
            <button className="w-6 h-6 rounded border border-slate-200 hover:bg-slate-50">5</button>
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};
