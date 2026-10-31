import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { NewAnalysisPage } from './pages/doctor/NewAnalysisPage';
import { AnalysisResultPage } from './pages/doctor/AnalysisResultPage';
import { PatientCasesPage } from './pages/doctor/PatientCasesPage';
import { MyPatientsPage } from './pages/doctor/MyPatientsPage';
import { DoctorReportsPage } from './pages/doctor/DoctorReportsPage';
import { DoctorInsightsPage } from './pages/doctor/DoctorInsightsPage';
import { SettingsPage } from './pages/doctor/SettingsPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageDoctorsPage } from './pages/admin/ManageDoctorsPage';
import { ManagePatientsPage } from './pages/admin/ManagePatientsPage';
import { AllCasesPage } from './pages/admin/AllCasesPage';
import { ReportsAnalysisPage } from './pages/admin/ReportsAnalysisPage';

import { getStoredUser, clearAuthSession, getCaseDetailApi, reviewCaseApi } from './services/api';
import { User, AnalysisResultPayload, CaseRecord } from './types';
import { X, CheckCircle2, AlertTriangle, FileText, Calendar, Clock, Stethoscope, Save } from 'lucide-react';
import { RadiographLocalizationViewer } from './components/RadiographLocalizationViewer';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [activeTab, setActiveTab] = useState<string>(() => {
    const stored = getStoredUser();
    return stored?.role === 'admin' ? 'admin-dashboard' : 'dashboard';
  });

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResultPayload | null>(null);

  // Modal for viewing case detail
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<(CaseRecord & { disclaimer?: string }) | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('Reviewed');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab(loggedInUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setCurrentAnalysis(null);
  };

  const handleOpenCaseDetail = async (caseId: number | string) => {
    try {
      setCaseLoading(true);
      setCaseModalOpen(true);
      const data = await getCaseDetailApi(caseId);
      setSelectedCase(data);
      setReviewStatus(data.status || 'Reviewed');
      setReviewNotes(data.review_notes || '');
    } catch (err) {
      console.error('Failed to load case detail:', err);
    } finally {
      setCaseLoading(false);
    }
  };

  const handleSaveCaseReview = async () => {
    if (!selectedCase) return;
    try {
      await reviewCaseApi(selectedCase.id, reviewStatus, reviewNotes);
      setReviewSuccess(true);
      setSelectedCase({
        ...selectedCase,
        status: reviewStatus as any,
        review_notes: reviewNotes
      });
      setTimeout(() => setReviewSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update review status');
    }
  };

  // If unauthenticated, show split-screen Login page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render content according to activeTab and user.role
  const renderContent = () => {
    if (user.role === 'doctor') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <DoctorDashboard
              user={user}
              onNavigate={(tab, caseId) => {
                if (caseId) {
                  handleOpenCaseDetail(caseId);
                } else {
                  setActiveTab(tab);
                }
              }}
            />
          );
        case 'new-analysis':
          return (
            <NewAnalysisPage
              onAnalysisSuccess={(res) => {
                setCurrentAnalysis(res);
                setActiveTab('analysis-result');
              }}
            />
          );
        case 'analysis-result':
          if (!currentAnalysis) {
            return (
              <NewAnalysisPage
                onAnalysisSuccess={(res) => {
                  setCurrentAnalysis(res);
                  setActiveTab('analysis-result');
                }}
              />
            );
          }
          return (
            <AnalysisResultPage
              result={currentAnalysis}
              onBackToDashboard={() => setActiveTab('dashboard')}
              onNewAnalysis={() => setActiveTab('new-analysis')}
            />
          );
        case 'patient-cases':
          return (
            <PatientCasesPage
              onNavigateToNewAnalysis={() => setActiveTab('new-analysis')}
              onViewCaseDetail={(caseId) => handleOpenCaseDetail(caseId)}
            />
          );
        case 'my-patients':
          return <MyPatientsPage />;
        case 'reports':
          return <DoctorReportsPage />;
        case 'insights':
          return <DoctorInsightsPage />;
        case 'settings':
          return <SettingsPage user={user} onUpdateUser={setUser} />;
        default:
          return (
            <DoctorDashboard
              user={user}
              onNavigate={(tab, caseId) => {
                if (caseId) handleOpenCaseDetail(caseId);
                else setActiveTab(tab);
              }}
            />
          );
      }
    } else {
      // Admin Portal
      switch (activeTab) {
        case 'admin-dashboard':
          return (
            <AdminDashboard
              onNavigate={setActiveTab}
              onViewCase={(c) => handleOpenCaseDetail(c.id)}
            />
          );
        case 'manage-doctors':
          return <ManageDoctorsPage />;
        case 'manage-patients':
          return <ManagePatientsPage />;
        case 'all-cases':
          return (
            <AllCasesPage
              onNewAnalysis={() => setActiveTab('new-analysis')}
              onViewCase={(c) => handleOpenCaseDetail(c.id)}
            />
          );
        case 'admin-reports':
          return <ReportsAnalysisPage />;
        case 'new-analysis':
          return (
            <NewAnalysisPage
              onAnalysisSuccess={(res) => {
                setCurrentAnalysis(res);
                setActiveTab('analysis-result');
              }}
            />
          );
        case 'analysis-result':
          if (!currentAnalysis) {
            return (
              <AllCasesPage
                onNewAnalysis={() => setActiveTab('new-analysis')}
                onViewCase={(c) => handleOpenCaseDetail(c.id)}
              />
            );
          }
          return (
            <AnalysisResultPage
              result={currentAnalysis}
              onBackToDashboard={() => setActiveTab('admin-dashboard')}
              onNewAnalysis={() => setActiveTab('new-analysis')}
            />
          );
        case 'settings':
          return <SettingsPage user={user} onUpdateUser={setUser} />;
        default:
          return (
            <AdminDashboard
              onNavigate={setActiveTab}
              onViewCase={(c) => handleOpenCaseDetail(c.id)}
            />
          );
      }
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {renderContent()}

      {/* ================= UNIVERSAL CASE DETAIL MODAL ================= */}
      {caseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{selectedCase?.case_id}</span>
                    <span className="text-slate-300">•</span>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedCase?.patient_name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400">Radiological Study Record & AI Diagnostic Findings</p>
                </div>
              </div>

              <button
                onClick={() => setCaseModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {caseLoading || !selectedCase ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading case record details...</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Academic Disclaimer Alert */}
                <div className="p-3.5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold block mb-0.5 text-amber-800">ACADEMIC RESEARCH PROTOTYPE NOTICE</span>
                  WristAI is an experimental academic research prototype trained using only five X-ray images. It is not clinically validated and may produce incorrect results, particularly on unseen X-rays. It must not be used for medical diagnosis or treatment decisions.
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Radiograph View with Localization & Loupe */}
                  <div className="lg:col-span-7 space-y-4">
                    <RadiographLocalizationViewer
                      imageUrl={selectedCase.image_url}
                      gradcamUrl={selectedCase.gradcam_url}
                      caseId={selectedCase.case_id}
                      aiPrediction={selectedCase.ai_prediction}
                      localization={selectedCase.localization}
                      initialAnnotations={selectedCase.annotations}
                      onAnnotationSaved={(newAnn) => {
                        setSelectedCase(prev => prev ? ({
                          ...prev,
                          annotations: [newAnn, ...(prev.annotations || [])],
                          localization: {
                            has_localization: true,
                            localization_type: 'CLINICIAN_MANUAL',
                            localization_label: 'CLINICIAN ANNOTATION',
                            bounding_box: {
                              x_min: newAnn.x_min,
                              y_min: newAnn.y_min,
                              x_max: newAnn.x_max,
                              y_max: newAnn.y_max
                            },
                            source: 'CLINICIAN_MANUAL'
                          }
                        }) : null);
                      }}
                      onAnnotationDeleted={(deletedId) => {
                        setSelectedCase(prev => prev ? ({
                          ...prev,
                          annotations: (prev.annotations || []).filter(a => a.id !== deletedId)
                        }) : null);
                      }}
                    />
                  </div>

                  {/* Right: AI Prediction & Scores */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Primary Prediction Banner */}
                    <div className="p-4 rounded-xl border bg-slate-50 border-slate-200/80">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                        AI Model Classification
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          selectedCase.ai_prediction === 'FRACTURE'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : selectedCase.ai_prediction === 'NORMAL'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-amber-100 text-amber-700 border border-amber-300'
                        }`}>
                          {selectedCase.ai_prediction === 'FRACTURE' ? 'FRACTURE DETECTED' : selectedCase.ai_prediction === 'NORMAL' ? 'NORMAL / INTACT' : 'UNCERTAIN'}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Confidence: {selectedCase.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Model Scores (Mandatory labeling) */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">NORMAL Model Score:</span>
                        <span className="font-mono font-bold text-sky-600">
                          {(selectedCase.normal_score * 100).toFixed(1)}% ({selectedCase.normal_score.toFixed(4)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${selectedCase.normal_score * 100}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="font-semibold text-slate-700">FRACTURE Model Score:</span>
                        <span className="font-mono font-bold text-red-600">
                          {(selectedCase.fracture_score * 100).toFixed(1)}% ({selectedCase.fracture_score.toFixed(4)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-red-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${selectedCase.fracture_score * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        * Labeled strictly as model scores, not calibrated clinical probabilities.
                      </p>
                    </div>

                    {/* Patient & Case Meta */}
                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Patient ID</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedCase.patient_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Age / Sex</span>
                        <span className="font-semibold text-slate-800">{selectedCase.age} yrs / {selectedCase.sex}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Attending Physician</span>
                        <span className="font-semibold text-slate-800">{selectedCase.doctor_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Study Date</span>
                        <span className="font-semibold text-slate-800">{selectedCase.study_date}</span>
                      </div>
                    </div>

                    {selectedCase.clinical_notes && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">Clinical Indication:</span>
                        <p className="text-slate-700 leading-relaxed">{selectedCase.clinical_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clinician Review & Signoff Section */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-800">Clinician Review & Signoff</h4>
                    </div>
                    {reviewSuccess && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Review recorded!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold">Review Status</label>
                      <select
                        value={reviewStatus}
                        onChange={(e) => setReviewStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none"
                      >
                        <option value="Reviewed">Reviewed & Confirmed</option>
                        <option value="Needs Review">Needs Further Review</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 mb-1 font-semibold">Physician Review Notes</label>
                      <input
                        type="text"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="e.g. Findings confirmed. Slight dorsal cortical buckling noted."
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveCaseReview}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Clinical Signoff</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default App;
