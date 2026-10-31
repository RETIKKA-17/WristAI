from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

# ----------------- AUTH SCHEMAS -----------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "doctor"

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    department: Optional[str] = None
    role_title: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UpdateProfileRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    role_title: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ----------------- DOCTOR SCHEMAS -----------------
class DoctorBase(BaseModel):
    name: str
    email: EmailStr
    department: str
    role_title: str
    phone: Optional[str] = "+91 98765 43210"
    joined_on: Optional[str] = "12 Jan 2025"
    status: Optional[str] = "Active"

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    role_title: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None

class DoctorResponse(DoctorBase):
    id: int
    total_cases: int
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- PATIENT SCHEMAS -----------------
class PatientBase(BaseModel):
    patient_id: str
    name: str
    age: int
    sex: str
    phone_number: Optional[str] = "+91 98765 43210"
    status: Optional[str] = "Active"
    last_visit: Optional[str] = "26 Oct 2026"
    next_follow_up: Optional[str] = None
    clinical_history: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    phone_number: Optional[str] = None
    status: Optional[str] = None
    next_follow_up: Optional[str] = None
    clinical_history: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    total_cases: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- CASE SCHEMAS -----------------
class CaseResponse(BaseModel):
    id: int
    case_id: str
    patient_id: str
    patient_name: str
    age: int
    sex: str
    doctor_name: str
    department: str
    study_date: str
    image_url: str
    thumbnail_url: Optional[str] = None
    clinical_notes: Optional[str] = None
    ai_prediction: str
    normal_score: float
    fracture_score: float
    confidence: float
    inference_time_ms: float
    status: str
    review_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewCaseRequest(BaseModel):
    status: str # "Reviewed" or "Needs Review"
    review_notes: Optional[str] = None

# ----------------- LOCALIZATION & ANNOTATION SCHEMAS -----------------
class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    width: Optional[float] = None
    height: Optional[float] = None

class LocalizationInfo(BaseModel):
    has_localization: bool
    localization_type: str  # "PDF_REFERENCE", "CLINICIAN_MANUAL", "NONE_NORMAL", "UNAVAILABLE"
    localization_label: str  # "PDF Reference Annotation – Not AI Detection", "CLINICIAN ANNOTATION", etc.
    bounding_box: Optional[BoundingBox] = None
    source: Optional[str] = None
    reference_case_id: Optional[str] = None
    source_pdf_page: Optional[int] = None
    annotated_pdf_page: Optional[int] = None
    marking_type: Optional[str] = None
    match_score: Optional[float] = None
    explanation: Optional[str] = None

class ClinicianAnnotationCreate(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    label: Optional[str] = "CLINICIAN ANNOTATION"
    notes: Optional[str] = None

class ClinicianAnnotationResponse(BaseModel):
    id: int
    case_id: str
    clinician_name: str
    annotation_type: str
    label: str
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- ANALYSIS RESPONSE -----------------
class AnalysisResponse(BaseModel):
    case_id: str
    patient_id: str
    patient_name: str
    age: int
    sex: str
    study_date: str
    ai_prediction: str # "FRACTURE", "NORMAL", "UNCERTAIN"
    model_scores: Dict[str, float] # {"NORMAL": 0.04, "FRACTURE": 0.96}
    confidence: float
    inference_time_ms: float
    image_url: str
    thumbnail_url: str
    clinical_notes: Optional[str] = None
    status: str
    disclaimer: str
    localization: Optional[LocalizationInfo] = None
    gradcam_url: Optional[str] = None
    gradcam_label: Optional[str] = "Model Attention Heatmap – Not Fracture Localization"
    gradcam_notice: Optional[str] = "ResNet-18 feature activations indicate regions influencing binary classification; not a localized detection bounding box."

# ----------------- DASHBOARD SCHEMAS -----------------
class DoctorDashboardStats(BaseModel):
    total_cases: int
    unique_patients: int
    fracture_detected: int
    normal_cases: int
    uncertain_cases: int
    avg_analysis_time_sec: float
    recent_cases: List[CaseResponse]
    case_trend_30_days: List[Dict[str, Any]]
    outcome_distribution: Dict[str, int]

class AdminDashboardStats(BaseModel):
    total_doctors: int
    total_patients: int
    total_cases: int
    fracture_detected: int
    normal_cases: int
    uncertain_cases: int
    weekly_overview: List[Dict[str, Any]]
    analysis_results_donut: Dict[str, Any]
    recent_cases: List[CaseResponse]
    recent_activities: List[Dict[str, Any]]

class ActivityLogResponse(BaseModel):
    id: int
    activity_type: str
    title: str
    description: Optional[str]
    timestamp_str: str
    user_name: str
    icon_type: str

    class Config:
        from_attributes = True
