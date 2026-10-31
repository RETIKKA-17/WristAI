import React, { useEffect, useState } from 'react';
import { 
  Users, Plus, Search, Filter, RotateCcw, 
  Eye, MoreVertical, X, CheckCircle2, Clock, AlertCircle,
  FileText, Calendar, Phone, User
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { getAdminPatientsApi, addAdminPatientApi } from '../../services/api';
import { Patient } from '../../types';

export const ManagePatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(284);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);

  // Filters
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('All');
  const [status, setStatus] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    name: '',
    age: 28,
    sex: 'M',
    phone_number: '+91 98765 43210',
    status: 'Active' as 'Active' | 'Follow-up' | 'Inactive',
    clinical_history: ''
  });

  useEffect(() => {
    fetchPatients();
  }, [page, gender, status]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await getAdminPatientsApi({
        search: search || undefined,
        gender: gender !== 'All' ? gender : undefined,
        status: status !== 'All' ? status : undefined,
        page,
        limit: 10
      });
      setPatients(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleResetFilters = () => {
    setSearch('');
    setGender('All');
    setStatus('All');
    setPage(1);
    getAdminPatientsApi({ page: 1, limit: 10 }).then(res => {
      setPatients(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    });
  };

  const handleOpenAdd = () => {
    const nextNum = total + 1;
    setFormData({
      patient_id: `P-2026-${String(144 + nextNum).padStart(4, '0')}`,
      name: '',
      age: 30,
      sex: 'M',
      phone_number: '+91 98765 43210',
      status: 'Active',
      clinical_history: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAdminPatientApi(formData);
      setShowAddModal(false);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to add patient');
    }
  };

  const sparklineBlue = [{ v: 240 }, { v: 250 }, { v: 265 }, { v: 272 }, { v: 280 }, { v: 284 }];
  const sparklineGreen = [{ v: 200 }, { v: 210 }, { v: 220 }, { v: 228 }, { v: 232 }, { v: 236 }];
  const sparklineAmber = [{ v: 25 }, { v: 26 }, { v: 28 }, { v: 29 }, { v: 30 }, { v: 32 }];
  const sparklineRed = [{ v: 22 }, { v: 20 }, { v: 19 }, { v: 18 }, { v: 17 }, { v: 16 }];

  return (
    <div className="space-y-6">
      {/* Header Matching Page 7 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manage Patients</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage all patient records in the hospital.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* 4 Stat Cards Matching Page 7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{total}</div>
            <div className="text-xs text-slate-500 font-medium">Total Patients</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 12%</span>
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

        {/* Active Patients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">236</div>
            <div className="text-xs text-slate-500 font-medium">Active Patients</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 10%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineGreen}>
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="#D1FAE5" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Follow-up Patients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">32</div>
            <div className="text-xs text-slate-500 font-medium">Follow-up Patients</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 8%</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineAmber}>
                <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fill="#FEF3C7" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inactive Patients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">16</div>
            <div className="text-xs text-slate-500 font-medium">Inactive Patients</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-red-500 mt-1">
              <span>↓ 6%</span>
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
      </div>

      {/* Filter Row Matching Page 7 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, ID, or phone number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Gender:</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Inactive">Inactive</option>
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

      {/* Table Matching Page 7 */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4 text-center">Total Cases</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {patients.map((pat, idx) => {
                const rowNum = (page - 1) * 10 + idx + 1;
                return (
                  <tr key={pat.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-400 font-medium">{rowNum}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{pat.patient_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{pat.name}</td>
                    <td className="py-3 px-4 text-slate-500">{pat.age} / {pat.sex}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{pat.phone_number}</td>
                    <td className="py-3 px-4 text-slate-500">{pat.last_visit}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{pat.total_cases}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        pat.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : pat.status === 'Follow-up'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-red-50 text-red-600 border border-red-200/60'
                      }`}>
                        {pat.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedPatient(pat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="View Records"
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

        {/* Pagination Footer Matching Page 7 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} patients
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

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Add New Patient</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient ID *</label>
                  <input
                    type="text"
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono bg-slate-50 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. S. Arjun"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sex *</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical History / Notes</label>
                <textarea
                  value={formData.clinical_history}
                  onChange={(e) => setFormData({ ...formData, clinical_history: e.target.value })}
                  rows={2}
                  placeholder="e.g. Acute trauma to dorsal right wrist, sudden swelling."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Patient Record Details</h3>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-mono text-blue-600 font-semibold">{selectedPatient.patient_id}</span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedPatient.name}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  selectedPatient.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                  selectedPatient.status === 'Follow-up' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                }`}>
                  {selectedPatient.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Age & Sex</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.age} yrs / {selectedPatient.sex}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.phone_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Last Hospital Visit</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.last_visit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total X-ray Studies</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.total_cases} Cases</span>
                </div>
              </div>

              {selectedPatient.clinical_history && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">Clinical History Notes:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedPatient.clinical_history}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
