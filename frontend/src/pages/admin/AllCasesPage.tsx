import React, { useEffect, useState } from 'react';
import { 
  FileSpreadsheet, Plus, Search, Filter, RotateCcw, 
  Eye, MoreVertical, X, CheckCircle2, Clock, AlertCircle,
  Activity, Calendar, User, Stethoscope, Maximize2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { getAllCasesApi, getAssetUrl } from '../../services/api';
import { CaseRecord } from '../../types';

interface AllCasesPageProps {
  onNewAnalysis?: () => void;
  onViewCase?: (c: CaseRecord) => void;
}

export const AllCasesPage: React.FC<AllCasesPageProps> = ({ onNewAnalysis, onViewCase }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(84);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);

  // Filters
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [dateRange, setDateRange] = useState('26 Oct 2026 - 01 Nov 2026');

  // Preview Modal
  const [previewCase, setPreviewCase] = useState<CaseRecord | null>(null);

  useEffect(() => {
    fetchCases();
  }, [page, resultFilter, doctorFilter]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await getAllCasesApi({
        search: search || undefined,
        result: resultFilter !== 'All' ? resultFilter : undefined,
        doctor: doctorFilter !== 'All' ? doctorFilter : undefined,
        page,
        limit: 10
      });
      setCases(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  const handleResetFilters = () => {
    setSearch('');
    setResultFilter('All');
    setDoctorFilter('All');
    setDateRange('26 Oct 2026 - 01 Nov 2026');
    setPage(1);
    getAllCasesApi({ page: 1, limit: 10 }).then(res => {
      setCases(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    });
  };

  const sparklineBlue = [{ v: 65 }, { v: 70 }, { v: 74 }, { v: 78 }, { v: 80 }, { v: 84 }];
  const sparklineRed = [{ v: 40 }, { v: 44 }, { v: 47 }, { v: 49 }, { v: 51 }, { v: 52 }];
  const sparklineOrange = [{ v: 20 }, { v: 22 }, { v: 23 }, { v: 25 }, { v: 25 }, { v: 26 }];
  const sparklinePurple = [{ v: 10 }, { v: 9 }, { v: 8 }, { v: 7 }, { v: 6 }, { v: 6 }];

  return (
    <div className="space-y-6">
      {/* Header Matching Page 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">All Cases</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage all analysis cases from the hospital.
          </p>
        </div>

        {onNewAnalysis && (
          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        )}
      </div>

      {/* 4 Stat Cards Matching Page 8 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{total}</div>
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

      {/* Filter Row Matching Page 8 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID, patient name, or doctor name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Result:</span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All</option>
              <option value="FRACTURE">Fracture</option>
              <option value="NORMAL">Normal</option>
              <option value="UNCERTAIN">Uncertain</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Doctor:</span>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All</option>
              <option value="Dr. Ananya S">Dr. Ananya S</option>
              <option value="Dr. Karthik V">Dr. Karthik V</option>
              <option value="Dr. Priya M">Dr. Priya M</option>
              <option value="Dr. Rahul K">Dr. Rahul K</option>
              <option value="Dr. Sneha R">Dr. Sneha R</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none"
            >
              <option>26 Oct 2026 - 01 Nov 2026</option>
              <option>19 Oct 2026 - 25 Oct 2026</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Cases Table with X-ray Image Thumbnails Matching Page 8 */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Doctor Name</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-center">X-ray Image</th>
                <th className="py-3 px-4">AI Result</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cases.map((c, idx) => {
                const rowNum = (page - 1) * 10 + idx + 1;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-400 font-medium">{rowNum}</td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">{c.case_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.patient_name}</td>
                    <td className="py-3 px-4 text-slate-500">{c.age} / {c.sex}</td>
                    <td className="py-3 px-4 text-slate-700">{c.doctor_name}</td>
                    <td className="py-3 px-4 text-slate-500">{c.study_date}</td>
                    <td className="py-3 px-4 text-center">
                      <div 
                        onClick={() => setPreviewCase(c)}
                        className="inline-block relative group cursor-pointer w-9 h-11 bg-slate-900 rounded overflow-hidden shadow-2xs border border-slate-200"
                        title="Click to expand X-ray"
                      >
                        <img
                          src={getAssetUrl(c.thumbnail_url || c.image_url)}
                          alt="X-ray thumbnail"
                          className="w-full h-full object-cover transition group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            if (onViewCase) onViewCase(c);
                            else setPreviewCase(c);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="View Case Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Matching Page 8 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} cases
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded text-xs font-semibold transition ${
                  page === i + 1 ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview & Details Modal */}
      {previewCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{previewCase.case_id}</span>
                <h3 className="font-bold text-slate-800 text-sm">
                  {previewCase.patient_name} ({previewCase.patient_id})
                </h3>
              </div>
              <button onClick={() => setPreviewCase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Radiograph display */}
              <div className="bg-slate-950 rounded-lg flex items-center justify-center p-2 min-h-[260px] border border-slate-800">
                <img
                  src={getAssetUrl(previewCase.image_url)}
                  alt="Wrist X-ray Preview"
                  className="max-h-[300px] w-auto object-contain rounded"
                />
              </div>

              {/* Case metadata */}
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">AI Classification Prediction</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    previewCase.ai_prediction === 'FRACTURE'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : previewCase.ai_prediction === 'NORMAL'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {previewCase.ai_prediction === 'FRACTURE' ? 'FRACTURE DETECTED' : previewCase.ai_prediction === 'NORMAL' ? 'NORMAL / INTACT' : 'UNCERTAIN'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Attending Doctor</span>
                    <span className="font-semibold text-slate-800">{previewCase.doctor_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Age / Sex</span>
                    <span className="font-semibold text-slate-800">{previewCase.age} yrs / {previewCase.sex}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Study Date</span>
                    <span className="font-semibold text-slate-800">{previewCase.study_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Review Status</span>
                    <span className="font-semibold text-slate-800">{previewCase.status}</span>
                  </div>
                </div>

                {previewCase.clinical_notes && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-700 block mb-0.5">Clinical Notes:</span>
                    <p className="text-slate-600 text-xs leading-relaxed">{previewCase.clinical_notes}</p>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setPreviewCase(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
