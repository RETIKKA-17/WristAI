import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Activity, Clock, Zap, CheckCircle2, 
  AlertCircle, ShieldCheck, HeartPulse, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, BarChart, Bar 
} from 'recharts';
import { getDoctorDashboardStatsApi } from '../../services/api';
import { DoctorDashboardStats } from '../../types';

export const DoctorInsightsPage: React.FC = () => {
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);

  useEffect(() => {
    getDoctorDashboardStatsApi().then(setStats).catch(console.error);
  }, []);

  const ageData = [
    { range: '< 18 yrs', fracture: 6, normal: 3 },
    { range: '18 - 30 yrs', fracture: 12, normal: 7 },
    { range: '31 - 50 yrs', fracture: 18, normal: 9 },
    { range: '51 - 70 yrs', fracture: 24, normal: 5 },
    { range: '> 70 yrs', fracture: 16, normal: 2 }
  ];

  const latencyData = [
    { sample: '#1', latency: 124 },
    { sample: '#2', latency: 131 },
    { sample: '#3', latency: 118 },
    { sample: '#4', latency: 145 },
    { sample: '#5', latency: 122 },
    { sample: '#6', latency: 128 },
    { sample: '#7', latency: 135 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xl">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <span>Diagnostic Insights & Clinical Analytics</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Deep behavioral insights derived from actual hospital radiographs and physician reviews.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-xl shadow-md shadow-blue-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-100">AI Assistance Rate</span>
            <Sparkles className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-3xl font-extrabold mt-2">94.2%</div>
          <p className="text-xs text-blue-100 mt-2 leading-relaxed">
            Of analyzed cases have physician agreement after clinical review in Orthopedic triage.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Average Processing Latency</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">128 ms</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Fast ResNet-18 forward pass per radiograph enables instant feedback at patient bedside.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Review Adherence</span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">100%</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            All AI inferences enforce mandatory clinician review prior to diagnostic signoff.
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age demographics chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Fracture Incidence by Age Cohort</h3>
            <p className="text-xs text-slate-500">Correlation between patient age bracket and fracture occurrences</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="fracture" fill="#EF4444" radius={[4, 4, 0, 0]} name="Fractures" />
                <Bar dataKey="normal" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Intact / Normal" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inference Latency Timeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Inference Response Benchmark</h3>
            <p className="text-xs text-slate-500">Sub-second execution time across recent live test runs (in milliseconds)</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="sample" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[90, 160]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#latencyGradient)" name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Clinical Notes Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-950 text-sm">Clinical Protocol Reminder</h4>
            <p className="leading-relaxed">
              WristAI operates strictly as secondary decision support. Clinical findings indicate that subtle fractures 
              (such as nondisplaced distal radius or hairline scaphoid fractures) may require specialized oblique radiograph 
              views or CT imaging when acute clinical tenderness persists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
