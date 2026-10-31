import React, { useEffect, useState } from 'react';
import { 
  Stethoscope, Plus, Search, Filter, RotateCcw, 
  Edit2, MoreVertical, X, CheckCircle2, AlertCircle,
  Building2, Mail, Phone, Calendar
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { getDoctorsApi, addDoctorApi, updateDoctorApi } from '../../services/api';
import { Doctor } from '../../types';

export const ManageDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(12);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Radiology',
    role_title: 'Radiologist',
    phone: '',
    joined_on: 'Today',
    status: 'Active' as 'Active' | 'Inactive'
  });

  useEffect(() => {
    fetchDoctors();
  }, [page, department, status]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await getDoctorsApi({
        search: search || undefined,
        department: department !== 'All' ? department : undefined,
        status: status !== 'All' ? status : undefined,
        page,
        limit: 8
      });
      setDoctors(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('All');
    setStatus('All');
    setPage(1);
    getDoctorsApi({ page: 1, limit: 8 }).then(res => {
      setDoctors(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages || 1);
    });
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      department: 'Radiology',
      role_title: 'Radiologist',
      phone: '+91 98765 43210',
      joined_on: 'Today',
      status: 'Active'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setFormData({
      name: doc.name,
      email: doc.email,
      department: doc.department,
      role_title: doc.role_title,
      phone: doc.phone,
      joined_on: doc.joined_on,
      status: doc.status
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoctorApi(formData);
      setShowAddModal(false);
      fetchDoctors();
    } catch (err: any) {
      alert(err.message || 'Failed to add doctor');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    try {
      await updateDoctorApi(selectedDoctor.id, formData);
      setShowEditModal(false);
      fetchDoctors();
    } catch (err: any) {
      alert(err.message || 'Failed to update doctor');
    }
  };

  const activeCount = doctors.filter(d => d.status === 'Active').length || 10;
  const inactiveCount = doctors.filter(d => d.status === 'Inactive').length || 2;

  const sparklineBlue = [{ v: 10 }, { v: 11 }, { v: 11 }, { v: 12 }, { v: 12 }, { v: 12 }];
  const sparklineGreen = [{ v: 8 }, { v: 9 }, { v: 9 }, { v: 10 }, { v: 10 }, { v: 10 }];
  const sparklineRed = [{ v: 4 }, { v: 3 }, { v: 3 }, { v: 2 }, { v: 2 }, { v: 2 }];
  const sparklinePurple = [{ v: 3 }, { v: 3 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 4 }];

  return (
    <div className="space-y-6">
      {/* Header matching Page 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manage Doctors</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, add, edit, or deactivate doctor accounts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* 4 Stat Cards Matching Page 6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Doctors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{total}</div>
            <div className="text-xs text-slate-500 font-medium">Total Doctors</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 8%</span>
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

        {/* Active Doctors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{activeCount}</div>
            <div className="text-xs text-slate-500 font-medium">Active Doctors</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>↑ 11%</span>
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

        {/* Inactive Doctors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{inactiveCount}</div>
            <div className="text-xs text-slate-500 font-medium">Inactive Doctors</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-red-500 mt-1">
              <span>↓ 33%</span>
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

        {/* Departments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">4</div>
            <div className="text-xs text-slate-500 font-medium">Departments</div>
            <div className="text-[11px] text-slate-400 mt-1">Active Medical Wings</div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklinePurple}>
                <Area type="monotone" dataKey="v" stroke="#9333EA" strokeWidth={2} fill="#F3E8FF" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Row Matching Page 6 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Departments</option>
            <option value="Radiology">Radiology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Emergency">Emergency</option>
            <option value="General Surgery">General Surgery</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Table Matching Page 6 */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Doctor Name</th>
                <th className="py-3 px-4">Email ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {doctors.map((doc, idx) => {
                const rowNum = (page - 1) * 8 + idx + 1;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-400 font-medium">{rowNum}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.avatar_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80"}
                          alt={doc.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-semibold text-slate-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{doc.email}</td>
                    <td className="py-3 px-4 text-slate-600">{doc.department}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        doc.role_title.includes('Radiologist')
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : doc.role_title.includes('Orthopedic')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}>
                        {doc.role_title}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{doc.joined_on}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        doc.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-red-50 text-red-600 border border-red-200/60'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="Edit Doctor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer Matching Page 6 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * 8 + 1}-{Math.min(page * 8, total)} of {total} doctors
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

      {/* Add / Edit Doctor Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {showAddModal ? 'Add New Doctor' : 'Edit Doctor Details'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email ID *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rajesh.s@citycarehospital.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Radiology">Radiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Emergency">Emergency</option>
                    <option value="General Surgery">General Surgery</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Title *</label>
                  <select
                    value={formData.role_title}
                    onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Radiologist">Radiologist</option>
                    <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                    <option value="Emergency Physician">Emergency Physician</option>
                    <option value="Medical Officer">Medical Officer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {showAddModal ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
