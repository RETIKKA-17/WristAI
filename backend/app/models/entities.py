from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="doctor") # "doctor" or "admin"
    department = Column(String(100), default="Radiology")
    phone = Column(String(50), default="+91 98765 43210")
    role_title = Column(String(100), default="Radiologist")
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False, default="Radiology")
    role_title = Column(String(100), nullable=False, default="Radiologist")
    phone = Column(String(50), default="+91 98765 43210")
    joined_on = Column(String(50), default="12 Jan 2025")
    status = Column(String(50), default="Active") # "Active" or "Inactive"
    total_cases = Column(Integer, default=0)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="doctor_profile")
    cases = relationship("Case", back_populates="doctor")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "P-2026-0143"
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(10), nullable=False) # "M", "F", "Other"
    phone_number = Column(String(50), default="+91 98765 43210")
    status = Column(String(50), default="Active") # "Active", "Follow-up", "Inactive"
    last_visit = Column(String(50), default="26 Oct 2026")
    next_follow_up = Column(String(50), nullable=True)
    total_cases = Column(Integer, default=1)
    clinical_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", back_populates="patient")

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "C-2026-0143"
    patient_db_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    patient_id = Column(String(50), index=True, nullable=False)
    patient_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(10), nullable=False)
    
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    doctor_name = Column(String(255), nullable=False, default="Dr. Ananya S")
    department = Column(String(100), default="Radiology")
    
    study_date = Column(String(50), default="26 Oct 2026")
    image_filename = Column(String(255), nullable=False)
    thumbnail_filename = Column(String(255), nullable=True)
    
    clinical_notes = Column(Text, nullable=True)
    
    # AI Results (Model Scores from ResNet-18)
    ai_prediction = Column(String(50), nullable=False) # "FRACTURE", "NORMAL", "UNCERTAIN"
    normal_score = Column(Float, nullable=False) # 0.0 to 1.0
    fracture_score = Column(Float, nullable=False) # 0.0 to 1.0
    confidence = Column(Float, nullable=False) # percentage e.g. 96.0
    inference_time_ms = Column(Float, default=125.0)
    
    status = Column(String(50), default="Reviewed") # "Reviewed" or "Needs Review"
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="cases")
    doctor = relationship("Doctor", back_populates="cases")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String(100), nullable=False) # e.g. "case_analyzed", "doctor_created", "report_generated"
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    timestamp_str = Column(String(100), nullable=False) # e.g. "26 Oct 2026, 10:12 AM"
    user_name = Column(String(255), default="System")
    icon_type = Column(String(50), default="case") # "case", "doctor", "report", "patient", "chart"
    created_at = Column(DateTime, default=datetime.utcnow)

class CaseAnnotation(Base):
    __tablename__ = "case_annotations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), index=True, nullable=False)
    clinician_name = Column(String(255), nullable=False)
    annotation_type = Column(String(50), default="CLINICIAN_MANUAL")
    label = Column(String(100), default="CLINICIAN ANNOTATION")
    x_min = Column(Float, nullable=False)
    y_min = Column(Float, nullable=False)
    x_max = Column(Float, nullable=False)
    y_max = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
