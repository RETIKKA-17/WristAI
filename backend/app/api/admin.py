import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.database.session import get_db
from backend.app.models.entities import User, Doctor, Patient, Case, ActivityLog
from backend.app.schemas.schemas import DoctorCreate, DoctorUpdate, PatientCreate, PatientUpdate
from backend.app.auth.security import get_current_user, require_role

router = APIRouter(prefix="/api/admin", tags=["Hospital Admin Portal"])

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    total_doctors = db.query(Doctor).count()
    total_patients = db.query(Patient).count()
    total_cases = db.query(Case).count()
    fracture_detected = db.query(Case).filter(Case.ai_prediction == "FRACTURE").count()
    normal_cases = db.query(Case).filter(Case.ai_prediction == "NORMAL").count()
    uncertain_cases = db.query(Case).filter(Case.ai_prediction == "UNCERTAIN").count()

    # Weekly overview (Mon to Sun)
    weekly_overview = [
        {"day": "Mon 26 Oct", "fracture": 28, "normal": 16, "uncertain": 4},
        {"day": "Tue 27 Oct", "fracture": 31, "normal": 18, "uncertain": 3},
        {"day": "Wed 28 Oct", "fracture": 24, "normal": 20, "uncertain": 5},
        {"day": "Thu 29 Oct", "fracture": 29, "normal": 17, "uncertain": 4},
        {"day": "Fri 30 Oct", "fracture": 25, "normal": 19, "uncertain": 3},
        {"day": "Sat 31 Oct", "fracture": 22, "normal": 15, "uncertain": 2},
        {"day": "Sun 01 Nov", "fracture": 26, "normal": 18, "uncertain": 4}
    ]

    recent_records = db.query(Case).order_by(desc(Case.id)).limit(5).all()
    recent_cases = []
    for c in recent_records:
        recent_cases.append({
            "id": c.id,
            "case_id": c.case_id,
            "patient_id": c.patient_id,
            "patient_name": c.patient_name,
            "age": c.age,
            "sex": c.sex,
            "doctor_name": c.doctor_name,
            "department": c.department,
            "study_date": c.study_date,
            "image_url": f"/uploads/{c.image_filename}",
            "thumbnail_url": f"/uploads/{c.thumbnail_filename}" if c.thumbnail_filename else f"/uploads/{c.image_filename}",
            "ai_prediction": c.ai_prediction,
            "confidence": c.confidence,
            "status": c.status
        })

    recent_activities = db.query(ActivityLog).order_by(desc(ActivityLog.id)).limit(6).all()

    return {
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "total_cases": total_cases,
        "fracture_detected": fracture_detected,
        "normal_cases": normal_cases,
        "uncertain_cases": uncertain_cases,
        "weekly_overview": weekly_overview,
        "analysis_results_donut": {
            "total": total_cases,
            "fracture_detected": fracture_detected,
            "no_fracture": normal_cases,
            "uncertain": uncertain_cases
        },
        "recent_cases": recent_cases,
        "recent_activities": recent_activities
    }

# ----------------- MANAGE DOCTORS -----------------
@router.get("/doctors")
def list_doctors(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(8, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Doctor)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Doctor.name.ilike(search_filter),
                Doctor.email.ilike(search_filter),
                Doctor.department.ilike(search_filter)
            )
        )
    if department and department.lower() != "all":
        query = query.filter(Doctor.department.ilike(department))
    if status and status.lower() != "all":
        query = query.filter(Doctor.status == status)

    total_count = query.count()
    records = query.order_by(Doctor.id).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit,
        "items": records
    }

@router.post("/doctors")
def add_doctor(req: DoctorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Doctor).filter(Doctor.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor with this email already exists")

    new_doc = Doctor(
        name=req.name,
        email=req.email.strip().lower(),
        department=req.department,
        role_title=req.role_title,
        phone=req.phone or "+91 98765 43210",
        joined_on=req.joined_on or "Today",
        status=req.status or "Active",
        total_cases=0,
        avatar_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.put("/doctors/{id}")
def update_doctor(id: int, req: DoctorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Doctor).filter(Doctor.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if req.name is not None:
        doc.name = req.name
    if req.email is not None:
        doc.email = req.email.strip().lower()
    if req.department is not None:
        doc.department = req.department
    if req.role_title is not None:
        doc.role_title = req.role_title
    if req.phone is not None:
        doc.phone = req.phone
    if req.status is not None:
        doc.status = req.status

    db.commit()
    db.refresh(doc)
    return doc

# ----------------- MANAGE PATIENTS -----------------
@router.get("/patients")
def list_admin_patients(
    search: Optional[str] = None,
    gender: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.name.ilike(search_filter),
                Patient.patient_id.ilike(search_filter),
                Patient.phone_number.ilike(search_filter)
            )
        )
    if gender and gender.lower() != "all":
        query = query.filter(Patient.sex == gender.upper()[:1])
    if status and status.lower() != "all":
        query = query.filter(Patient.status == status)

    total_count = query.count()
    records = query.order_by(desc(Patient.id)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit,
        "items": records
    }

@router.post("/patients")
def add_admin_patient(req: PatientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Patient).filter(Patient.patient_id == req.patient_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient ID already exists")

    pat = Patient(
        patient_id=req.patient_id,
        name=req.name,
        age=req.age,
        sex=req.sex,
        phone_number=req.phone_number or "+91 98765 43210",
        status=req.status or "Active",
        last_visit=req.last_visit or "26 Oct 2026",
        next_follow_up=req.next_follow_up,
        clinical_history=req.clinical_history,
        total_cases=0
    )
    db.add(pat)
    db.commit()
    db.refresh(pat)
    return pat

@router.put("/patients/{id}")
def update_admin_patient(id: int, req: PatientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pat = db.query(Patient).filter(Patient.id == id).first()
    if not pat:
        raise HTTPException(status_code=404, detail="Patient not found")

    if req.name is not None:
        pat.name = req.name
    if req.age is not None:
        pat.age = req.age
    if req.sex is not None:
        pat.sex = req.sex
    if req.phone_number is not None:
        pat.phone_number = req.phone_number
    if req.status is not None:
        pat.status = req.status
    if req.next_follow_up is not None:
        pat.next_follow_up = req.next_follow_up
    if req.clinical_history is not None:
        pat.clinical_history = req.clinical_history

    db.commit()
    db.refresh(pat)
    return pat

# ----------------- ALL CASES -----------------
@router.get("/cases")
def list_all_cases(
    search: Optional[str] = None,
    result: Optional[str] = None,
    doctor: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Case)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Case.case_id.ilike(search_filter),
                Case.patient_name.ilike(search_filter),
                Case.patient_id.ilike(search_filter)
            )
        )
    if result and result.lower() != "all":
        query = query.filter(Case.ai_prediction == result.upper())
    if doctor and doctor.lower() != "all":
        query = query.filter(Case.doctor_name.ilike(f"%{doctor.strip()}%"))

    total_count = query.count()
    records = query.order_by(desc(Case.id)).offset((page - 1) * limit).limit(limit).all()

    formatted = []
    for c in records:
        formatted.append({
            "id": c.id,
            "case_id": c.case_id,
            "patient_id": c.patient_id,
            "patient_name": c.patient_name,
            "age": c.age,
            "sex": c.sex,
            "doctor_name": c.doctor_name,
            "department": c.department,
            "study_date": c.study_date,
            "image_url": f"/uploads/{c.image_filename}",
            "thumbnail_url": f"/uploads/{c.thumbnail_filename}" if c.thumbnail_filename else f"/uploads/{c.image_filename}",
            "ai_prediction": c.ai_prediction,
            "confidence": c.confidence,
            "status": c.status
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit,
        "items": formatted
    }

# ----------------- REPORTS & ANALYSIS -----------------
@router.get("/reports-data")
def get_reports_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_cases = db.query(Case).count()
    fracture_detected = db.query(Case).filter(Case.ai_prediction == "FRACTURE").count()
    normal_cases = db.query(Case).filter(Case.ai_prediction == "NORMAL").count()
    uncertain_cases = db.query(Case).filter(Case.ai_prediction == "UNCERTAIN").count()

    cases_by_dept = [
        {"department": "Radiology", "cases": 35},
        {"department": "Orthopedics", "cases": 22},
        {"department": "Emergency", "cases": 15},
        {"department": "General Surgery", "cases": 8},
        {"department": "Others", "cases": 4}
    ]

    cases_by_doc = [
        {"doctor": "Dr. Ananya S", "cases": 18},
        {"doctor": "Dr. Karthik V", "cases": 16},
        {"doctor": "Dr. Priya M", "cases": 12},
        {"doctor": "Dr. Rahul K", "cases": 10},
        {"doctor": "Dr. Sneha R", "cases": 8},
        {"doctor": "Others", "cases": 20}
    ]

    monthly_comparison = [
        {"month": "Jun", "fracture": 40, "normal": 25, "uncertain": 5},
        {"month": "Jul", "fracture": 48, "normal": 28, "uncertain": 6},
        {"month": "Aug", "fracture": 55, "normal": 32, "uncertain": 8},
        {"month": "Sep", "fracture": 62, "normal": 35, "uncertain": 7},
        {"month": "Oct", "fracture": 70, "normal": 38, "uncertain": 6},
        {"month": "Nov", "fracture": 74, "normal": 40, "uncertain": 8}
    ]

    detailed_cases = db.query(Case).order_by(desc(Case.id)).limit(10).all()
    formatted_summary = []
    for c in detailed_cases:
        formatted_summary.append({
            "case_id": c.case_id,
            "patient_name": c.patient_name,
            "age_sex": f"{c.age} / {c.sex}",
            "doctor_name": c.doctor_name,
            "department": c.department,
            "date_time": c.study_date,
            "ai_result": c.ai_prediction,
            "review_status": c.status
        })

    return {
        "summary_cards": {
            "total_cases": total_cases,
            "fracture_detected": fracture_detected,
            "normal_cases": normal_cases,
            "uncertain_cases": uncertain_cases
        },
        "cases_by_department": cases_by_dept,
        "cases_by_doctor": cases_by_doc,
        "monthly_comparison": monthly_comparison,
        "detailed_case_summary": formatted_summary
    }

@router.get("/export-csv")
def export_cases_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cases = db.query(Case).order_by(Case.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Case ID", "Patient ID", "Patient Name", "Age", "Sex",
        "Doctor Name", "Department", "Study Date", "AI Prediction",
        "Confidence (%)", "Normal Model Score", "Fracture Model Score",
        "Review Status", "Clinical Notes"
    ])

    for c in cases:
        writer.writerow([
            c.case_id, c.patient_id, c.patient_name, c.age, c.sex,
            c.doctor_name, c.department, c.study_date, c.ai_prediction,
            c.confidence, c.normal_score, c.fracture_score,
            c.status, c.clinical_notes or ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=wristai_hospital_cases_export.csv"}
    )
