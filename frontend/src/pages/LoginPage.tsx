import React, { useState } from 'react';
import { 
  Activity, 
  Shield, 
  Upload, 
  Cpu, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Lock, 
  Mail, 
  UserCheck,
  Stethoscope,
  Building2,
  AlertCircle
} from 'lucide-react';
import { loginApi, setAuthSession } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<'doctor' | 'admin'>('doctor');
  const [email, setEmail] = useState('dr.ananya@wristai.hospital');
  const [password, setPassword] = useState('doctor123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleSwitch = (newRole: 'doctor' | 'admin') => {
    setRole(newRole);
    setErrorMsg(null);
    if (newRole === 'doctor') {
      setEmail('dr.ananya@wristai.hospital');
      setPassword('doctor123');
    } else {
      setEmail('admin@wristai.hospital');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const resp = await loginApi(email, password, role);
      setAuthSession(resp.access_token, resp.user);
      onLoginSuccess(resp.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B132B] flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Container matching Page 1 */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] border border-slate-100">
        
        {/* ---------------- LEFT PANEL: Medical Brand Hero ---------------- */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A192F] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden text-white">
          {/* Subtle medical radiograph background glow */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Activity className="w-6 h-6 stroke-[2.3]" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Wrist<span className="text-blue-400">AI</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-300">
              <span className="hover:text-blue-400 cursor-pointer transition">Detect</span>
              <span className="text-slate-600">•</span>
              <span className="hover:text-blue-400 cursor-pointer transition">Support</span>
              <span className="text-slate-600">•</span>
              <span className="hover:text-blue-400 cursor-pointer transition">Collaborate</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-8 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                AI-Powered <br />
                Wrist Fracture <br />
                <span className="text-blue-400">Detection</span>
              </h1>
              <p className="mt-3 text-sm text-slate-300 max-w-md leading-relaxed">
                Faster insights. <span className="text-blue-300 font-semibold">Safer decisions.</span> Better patient care.
              </p>
            </div>

            {/* Feature Highlights from PDF */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Accurate Detection</h4>
                  <p className="text-[11px] text-slate-400">Identify wrist fractures with PyTorch ResNet-18 support</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Assists Clinical Review</h4>
                  <p className="text-[11px] text-slate-400">Calculates model scores to streamline doctor triage</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Designed for Healthcare</h4>
                  <p className="text-[11px] text-slate-400">A research prototype created to empower hospital physicians</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 3 Step Pills */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-xl border border-slate-800">
              <Upload className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="leading-tight">
                <div className="font-semibold text-slate-200">Upload</div>
                <div className="text-[9px] text-slate-400">X-ray Image</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-xl border border-slate-800">
              <Activity className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="leading-tight">
                <div className="font-semibold text-slate-200">AI</div>
                <div className="text-[9px] text-slate-400">Analysis</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="leading-tight">
                <div className="font-semibold text-slate-200">Get</div>
                <div className="text-[9px] text-slate-400">Instant Results</div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- RIGHT PANEL: Login Form ---------------- */}
        <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto space-y-6">
            
            {/* Header Tag */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Shield className="w-3 h-3 text-blue-600" />
                AI for Safer Diagnoses
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome to Wrist<span className="text-blue-600">AI</span>
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Login to access the AI-powered wrist fracture analysis system.
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleRoleSwitch('doctor')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  role === 'doctor'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Doctor Portal
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  role === 'admin'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Hospital Admin
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("For security in this hospital portal, please contact the Hospital Administrator (admin@wristai.hospital) to reset your password.")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-70"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials helper */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-slate-600">
              <div className="font-bold text-blue-900 mb-0.5">Quick Demo Access:</div>
              {role === 'doctor' ? (
                <div>Doctor: <code className="text-blue-700 font-mono">dr.ananya@wristai.hospital</code> / <code className="text-blue-700 font-mono">doctor123</code></div>
              ) : (
                <div>Admin: <code className="text-blue-700 font-mono">admin@wristai.hospital</code> / <code className="text-blue-700 font-mono">admin123</code></div>
              )}
            </div>

            <div className="text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => alert("Please request physician credentials from the Hospital IT Administration.")}>
                Sign up
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
