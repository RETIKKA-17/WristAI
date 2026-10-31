import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileUp, 
  Image as ImageIcon, 
  X, 
  ArrowRight, 
  User, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { analyzeXrayApi } from '../../services/api';
import { AnalysisResultPayload } from '../../types';

interface NewAnalysisPageProps {
  onAnalysisSuccess: (result: AnalysisResultPayload) => void;
}

export const NewAnalysisPage: React.FC<NewAnalysisPageProps> = ({ onAnalysisSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('P-2026-0144');
  const [patientName, setPatientName] = useState('Anand Kumar');
  const [age, setAge] = useState<number>(24);
  const [sex, setSex] = useState<string>('M');
  const [studyDate, setStudyDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [clinicalNotes, setClinicalNotes] = useState<string>('Pain and swelling over dorsal wrist following bicycle fall. Suspected distal radius fracture.');
  
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPG, or JPEG image.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage('Please select or upload a wrist X-ray radiograph before starting analysis.');
      return;
    }
    if (!patientId.trim() || !patientName.trim()) {
      setErrorMessage('Please provide Patient ID and Patient Name.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patient_id', patientId);
    formData.append('patient_name', patientName);
    formData.append('age', age.toString());
    formData.append('sex', sex);
    formData.append('study_date', studyDate);
    formData.append('clinical_notes', clinicalNotes);

    try {
      const result = await analyzeXrayApi(formData);
      onAnalysisSuccess(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Please check backend connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
          <FileUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">New Analysis</h2>
          <p className="text-xs text-slate-500">
            Upload and analyze a new wrist X-ray for fracture detection using the trained PyTorch model.
          </p>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Two-Column Layout matching Page 2 Bottom */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ---------------- LEFT CARD: Upload Wrist X-ray ---------------- */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Upload Wrist X-ray</h3>
                      <p className="text-[11px] text-slate-400">AP, Lateral or Oblique projection</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              {!previewUrl ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center min-h-[300px] cursor-pointer ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Drag & drop X-ray images here
                  </div>
                  <div className="text-xs text-slate-400 my-1.5">or</div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse Files
                  </button>
                  <div className="text-[11px] text-slate-400 mt-4">
                    Supported formats: PNG, JPG, JPEG (Max size: 15 MB)
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              ) : (
                /* Image Preview Container */
                <div className="relative border border-slate-200 rounded-2xl p-3 bg-slate-900 flex flex-col items-center justify-center min-h-[300px] overflow-hidden group">
                  <img
                    src={previewUrl}
                    alt="Wrist X-ray Preview"
                    className="max-h-72 object-contain rounded-lg shadow-md"
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-full mt-3 px-3 py-2 bg-slate-800/90 rounded-xl flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate max-w-[200px] font-medium">{selectedFile?.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {selectedFile ? (selectedFile.size / 1024).toFixed(0) + ' KB' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-[11px] text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Model utilizes normalized 224×224 tensor preprocessing identical to training configuration.</span>
            </div>
          </div>

          {/* ---------------- RIGHT CARD: Patient Information ---------------- */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Patient Information</h3>
                  <p className="text-[11px] text-slate-400">Enter patient details for this clinical study</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Row 1: Patient ID & Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="e.g. P-2026-0144"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. S. Arjun"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Row 2: Age, Sex, Study Date */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sex <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="M">Male (M)</option>
                      <option value="F">Female (F)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Study Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={studyDate}
                      onChange={(e) => setStudyDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Row 3: Clinical Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Clinical Notes (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {clinicalNotes.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter mechanism of injury, pain localization, or clinical history..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 border border-slate-100 flex items-center justify-between">
              <span>Physician Referral: Dr. Ananya S (Radiology)</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PACS Ready
              </span>
            </div>
          </div>

        </div>

        {/* ---------------- FULL-WIDTH ANALYZE BUTTON ---------------- */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-75 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Running ResNet-18 PyTorch Model Inference...</span>
            </>
          ) : (
            <>
              <span>Analyze X-ray</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
