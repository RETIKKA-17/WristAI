export type UserRole = 'doctor' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  role_title?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  department: string;
  role_title: string;
  phone: string;
  joined_on: string;
  status: 'Active' | 'Inactive';
  total_cases: number;
  avatar_url?: string;
}

export interface Patient {
  id: number;
  patient_id: string;
  name: string;
  age: number;
  sex: string;
  phone_number: string;
  status: 'Active' | 'Follow-up' | 'Inactive';
  last_visit: string;
  next_follow_up?: string;
  total_cases: number;
  clinical_history?: string;
}

export interface CaseRecord {
  id: number;
  case_id: string;
  patient_id: string;
  patient_name: string;
  age: number;
  sex: string;
  doctor_name: string;
  department: string;
  study_date: string;
  image_url: string;
  thumbnail_url?: string;
  clinical_notes?: string;
  ai_prediction: 'FRACTURE' | 'NORMAL' | 'UNCERTAIN';
  normal_score: number;
  fracture_score: number;
  confidence: number;
  inference_time_ms: number;
  status: 'Reviewed' | 'Needs Review';
  review_notes?: string;
  created_at?: string;
  localization?: LocalizationInfo;
  gradcam_url?: string;
  gradcam_label?: string;
  gradcam_notice?: string;
  reference_heatmap_url?: string;
  annotations?: ClinicianAnnotation[];
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width?: number;
  height?: number;
}

export interface LocalizationInfo {
  has_localization: boolean;
  localization_type: 'PDF_REFERENCE' | 'CLINICIAN_MANUAL' | 'NONE_NORMAL' | 'UNAVAILABLE';
  localization_label: string;
  bounding_box?: BoundingBox | null;
  source?: string | null;
  reference_case_id?: string | null;
  source_pdf_page?: number | null;
  annotated_pdf_page?: number | null;
  marking_type?: string | null;
  match_score?: number | null;
  explanation?: string | null;
}

export interface ClinicianAnnotation {
  id: number;
  case_id: string;
  clinician_name: string;
  annotation_type: string;
  label: string;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AnalysisResultPayload {
  case_id: string;
  patient_id: string;
  patient_name: string;
  age: number;
  sex: string;
  study_date: string;
  ai_prediction: 'FRACTURE' | 'NORMAL' | 'UNCERTAIN';
  model_scores: {
    NORMAL: number;
    FRACTURE: number;
  };
  confidence: number;
  inference_time_ms: number;
  image_url: string;
  thumbnail_url: string;
  clinical_notes?: string;
  status: string;
  disclaimer: string;
  localization?: LocalizationInfo;
  gradcam_url?: string;
  gradcam_label?: string;
  gradcam_notice?: string;
  reference_heatmap_url?: string;
  annotations?: ClinicianAnnotation[];
}

export interface DoctorDashboardStats {
  total_cases: number;
  unique_patients: number;
  fracture_detected: number;
  normal_cases: number;
  uncertain_cases: number;
  avg_analysis_time_sec: number;
  recent_cases: CaseRecord[];
  case_trend_30_days: Array<{
    date: string;
    total: number;
    fracture: number;
    normal: number;
    uncertain: number;
  }>;
  outcome_distribution: {
    fracture_detected: number;
    no_fracture: number;
    uncertain: number;
  };
}

export interface AdminDashboardStats {
  total_doctors: number;
  total_patients: number;
  total_cases: number;
  fracture_detected: number;
  normal_cases: number;
  uncertain_cases: number;
  weekly_overview: Array<{
    day: string;
    fracture: number;
    normal: number;
    uncertain: number;
  }>;
  analysis_results_donut: {
    total: number;
    fracture_detected: number;
    no_fracture: number;
    uncertain: number;
  };
  recent_cases: CaseRecord[];
  recent_activities: Array<{
    id: number;
    activity_type: string;
    title: string;
    description?: string;
    timestamp_str: string;
    user_name: string;
    icon_type: string;
  }>;
}

export interface AnalysisResultPayload {
  case_id: string;
  patient_id: string;
  patient_name: string;
  age: number;
  sex: string;
  study_date: string;
  ai_prediction: 'FRACTURE' | 'NORMAL' | 'UNCERTAIN';
  model_scores: {
    NORMAL: number;
    FRACTURE: number;
  };
  confidence: number;
  inference_time_ms: number;
  image_url: string;
  thumbnail_url: string;
  clinical_notes?: string;
  status: string;
  disclaimer: string;
}
