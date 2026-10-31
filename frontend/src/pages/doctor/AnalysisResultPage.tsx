import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  ShieldCheck, 
  Printer, 
  Save, 
  Share2, 
  Cpu, 
  Info,
  Building2,
  Stethoscope
} from 'lucide-react';
import { AnalysisResultPayload } from '../../types';
import { RadiographLocalizationViewer } from '../../components/RadiographLocalizationViewer';

interface AnalysisResultPageProps {
  result: AnalysisResultPayload;
  onBackToDashboard: () => void;
  onNewAnalysis: () => void;
}

export const AnalysisResultPage: React.FC<AnalysisResultPageProps> = ({
  result,
  onBackToDashboard,
  onNewAnalysis
}) => {
  const [reviewSaved, setReviewSaved] = useState(false);
  const [physicianAgreement, setPhysicianAgreement] = useState<'agree' | 'disagree' | 'pending'>('agree');
  const [physicianNotes, setPhysicianNotes] = useState('');

  const isFracture = result.ai_prediction === 'FRACTURE';
  const isNormal = result.ai_prediction === 'NORMAL';
  const isUncertain = result.ai_prediction === 'UNCERTAIN';

  const handleSaveReview = () => {
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={onNewAnalysis}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition"
          >
            <span>Analyze Another X-ray</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ---------------- LEFT: Radiograph Viewer with Localization & Loupe ---------------- */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Radiographic Study & Localization</h3>
              <p className="text-[11px] text-slate-400">Interactive viewer with reference fracture localization & clinician annotations</p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
              {result.case_id}
            </span>
          </div>

          <RadiographLocalizationViewer
            imageUrl={result.image_url}
            gradcamUrl={result.gradcam_url}
            referenceHeatmapUrl={result.reference_heatmap_url}
            caseId={result.case_id}
            aiPrediction={result.ai_prediction}
            localization={result.localization}
            initialAnnotations={result.annotations}
          />
        </div>

        {/* ---------------- RIGHT: Diagnostic Outcome & Scores ---------------- */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Diagnostic Outcome Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Diagnostic Outcome
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Inference Latency: ~{result.inference_time_ms} ms
              </span>
            </div>

            {/* Large Status Badge */}
            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
              isFracture
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : isNormal
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isFracture 
                  ? 'bg-rose-500 text-white' 
                  : isNormal 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-amber-500 text-white'
              }`}>
                {isFracture ? <AlertTriangle className="w-6 h-6 stroke-[2.3]" /> : <CheckCircle2 className="w-6 h-6 stroke-[2.3]" />}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                  Primary Classification
                </div>
                <div className="text-2xl font-extrabold tracking-tight">
                  {isFracture ? 'Fracture Detected' : isNormal ? 'No Fracture Detected' : 'Uncertain (Review Recommended)'}
                </div>
                <div className="text-xs opacity-85 mt-0.5">
                  Confidence: <span className="font-bold">{result.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Classification Scores */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Classification Scores</span>
              </div>

              {/* Fracture Score Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-600">Fracture Probability</span>
                  <span className="text-slate-800 font-mono">{(result.model_scores.FRACTURE * 100).toFixed(2)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-700"
                    style={{ width: `${result.model_scores.FRACTURE * 100}%` }}
                  />
                </div>
              </div>

              {/* Normal Score Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-600">Normal Probability</span>
                  <span className="text-slate-800 font-mono">{(result.model_scores.NORMAL * 100).toFixed(2)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${result.model_scores.NORMAL * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Patient & Study Metadata Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <User className="w-4 h-4 text-blue-600" />
                <span>Patient & Study Information</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Patient ID</span>
                  <span className="font-bold text-slate-900 font-mono">{result.patient_id}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Patient Name</span>
                  <span className="font-bold text-slate-900">{result.patient_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Demographics</span>
                  <span className="font-bold text-slate-900">{result.age} yrs / {result.sex}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Study Date</span>
                  <span className="font-bold text-slate-900">{result.study_date}</span>
                </div>
              </div>

              {result.clinical_notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Clinical Notes</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{result.clinical_notes}</p>
                </div>
              )}
            </div>

            {/* Doctor Verification / Save Case Section */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-950">Physician Clinical Review & Agreement</span>
                </div>
                {reviewSaved && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Review Saved
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="agreement"
                    checked={physicianAgreement === 'agree'}
                    onChange={() => setPhysicianAgreement('agree')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Concur with AI Model</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="agreement"
                    checked={physicianAgreement === 'disagree'}
                    onChange={() => setPhysicianAgreement('disagree')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Disagree (Overrule)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="agreement"
                    checked={physicianAgreement === 'pending'}
                    onChange={() => setPhysicianAgreement('pending')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Flag for Senior Radiologist</span>
                </label>
              </div>

              <textarea
                rows={2}
                placeholder="Optional radiologist verification comments or clinical impressions..."
                value={physicianNotes}
                onChange={(e) => setPhysicianNotes(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSaveReview}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Clinical Verification</span>
                </button>
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
