import os
import shutil
from PIL import Image
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.models.entities import User, Doctor, Patient, Case, ActivityLog
from backend.app.auth.security import hash_password

def sync_initial_credentials(db: Session) -> bool:
    """
    Explicit, controlled production credential synchronization procedure.
    Updates ONLY the password_hash and is_active status for the exact configured
    doctor and admin email addresses.
    Does NOT touch, modify, or reset any patient records, cases, uploads, or audit logs.
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    is_prod = env == "production" or bool(os.getenv("RENDER")) or bool(os.getenv("RAILWAY_ENVIRONMENT"))

    raw_doc_email = os.getenv("INITIAL_DOCTOR_EMAIL", "dr.ananya@wristai.hospital")
    raw_adm_email = os.getenv("INITIAL_ADMIN_EMAIL", "admin@wristai.hospital")
    doctor_email = raw_doc_email.strip().lower()
    admin_email = raw_adm_email.strip().lower()

    raw_doc_pwd = os.getenv("INITIAL_DOCTOR_PASSWORD", "").strip()
    raw_adm_pwd = os.getenv("INITIAL_ADMIN_PASSWORD", "").strip()

    if is_prod:
        insecure_demo_passwords = {"doctor123", "admin123", "password", "123456", "admin"}
        if not raw_doc_pwd:
            raise ValueError(
                "Production seeding failed: INITIAL_DOCTOR_PASSWORD environment variable is missing. "
                "Configure a secure password in the Render Dashboard (or use generateValue in render.yaml)."
            )
        if raw_doc_pwd in insecure_demo_passwords or len(raw_doc_pwd) < 8:
            raise ValueError(
                "Production seeding failed: INITIAL_DOCTOR_PASSWORD is too weak or set to a known demo default. "
                "Configure a secure password (minimum 8 characters) in the Render Dashboard."
            )
        if not raw_adm_pwd:
            raise ValueError(
                "Production seeding failed: INITIAL_ADMIN_PASSWORD environment variable is missing. "
                "Configure a secure password in the Render Dashboard (or use generateValue in render.yaml)."
            )
        if raw_adm_pwd in insecure_demo_passwords or len(raw_adm_pwd) < 8:
            raise ValueError(
                "Production seeding failed: INITIAL_ADMIN_PASSWORD is too weak or set to a known demo default. "
                "Configure a secure password (minimum 8 characters) in the Render Dashboard."
            )
        doctor_password = raw_doc_pwd
        admin_password = raw_adm_pwd
    else:
        doctor_password = raw_doc_pwd or "doctor123"
        admin_password = raw_adm_pwd or "admin123"

    updated = False

    # Match ONLY by exact configured email address (no role-only fallback)
    doc_user = db.query(User).filter(func.lower(User.email) == doctor_email).first()
    if doc_user:
        doc_user.password_hash = hash_password(doctor_password)
        doc_user.is_active = True
        updated = True
        print(f"[Credential Recovery] Successfully synchronized credentials for configured doctor account: {doctor_email}")
    else:
        print(f"[Credential Recovery] Notice: Account with email '{doctor_email}' not found in database.")

    adm_user = db.query(User).filter(func.lower(User.email) == admin_email).first()
    if adm_user:
        adm_user.password_hash = hash_password(admin_password)
        adm_user.is_active = True
        updated = True
        print(f"[Credential Recovery] Successfully synchronized credentials for configured admin account: {admin_email}")
    else:
        print(f"[Credential Recovery] Notice: Account with email '{admin_email}' not found in database.")

    if updated:
        db.commit()

    return updated

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if database is already populated
    if db.query(User).first() is not None:
        # Controlled recovery guard: do not silently overwrite passwords on every application restart
        sync_requested = os.getenv("SYNC_CREDENTIALS_ON_STARTUP", "").strip().lower() in ("true", "1", "yes")
        if sync_requested:
            print("[Database Seed] Controlled credential synchronization requested (SYNC_CREDENTIALS_ON_STARTUP=true)...")
            sync_initial_credentials(db)
        else:
            print("[Database Seed] Database already populated. Startup credential sync skipped.")
        db.close()
        return

    print("[Database Seed] Populating initial hospital records...")

    # Uploads directory
    backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    uploads_dir = os.path.join(backend_root, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    # Copy clean radiographs into uploads and generate thumbnails
    workspace_root = os.path.abspath(os.path.join(backend_root, ".."))
    processed_dir = os.path.join(workspace_root, "data", "processed")

    source_images = {
        "case_01": os.path.join(processed_dir, "fracture", "wrist_case_01_obvious_fracture_p01.png"),
        "case_02": os.path.join(processed_dir, "fracture", "wrist_case_02_obvious_fracture_p03.png"),
        "case_03": os.path.join(processed_dir, "normal", "wrist_case_03_normal_p05.png"),
        "case_04": os.path.join(processed_dir, "fracture", "wrist_case_04_subtle_fracture_p06.png"),
        "case_05": os.path.join(processed_dir, "fracture", "wrist_case_05_subtle_fracture_p08.png")
    }

    uploaded_files = {}
    for key, src in source_images.items():
        if os.path.exists(src):
            dest_name = f"seed_{key}.png"
            dest_path = os.path.join(uploads_dir, dest_name)
            shutil.copy2(src, dest_path)
            
            # Create thumbnail
            thumb_name = f"seed_{key}_thumb.png"
            thumb_path = os.path.join(uploads_dir, thumb_name)
            with Image.open(dest_path) as img:
                img.thumbnail((120, 150))
                img.save(thumb_path)
                
            uploaded_files[key] = (dest_name, thumb_name)

    # 1. Users - Credential Handling
    env = os.getenv("ENVIRONMENT", "development").lower()
    is_prod = env == "production" or bool(os.getenv("RENDER")) or bool(os.getenv("RAILWAY_ENVIRONMENT"))

    doctor_email = os.getenv("INITIAL_DOCTOR_EMAIL", "dr.ananya@wristai.hospital").strip().lower()
    admin_email = os.getenv("INITIAL_ADMIN_EMAIL", "admin@wristai.hospital").strip().lower()

    raw_doc_pwd = os.getenv("INITIAL_DOCTOR_PASSWORD", "").strip()
    raw_adm_pwd = os.getenv("INITIAL_ADMIN_PASSWORD", "").strip()

    if is_prod:
        insecure_demo_passwords = {"doctor123", "admin123", "password", "123456", "admin"}
        if not raw_doc_pwd:
            raise ValueError(
                "Production seeding failed: INITIAL_DOCTOR_PASSWORD environment variable is missing. "
                "Configure a secure password in the Render Dashboard (or use generateValue in render.yaml)."
            )
        if raw_doc_pwd in insecure_demo_passwords or len(raw_doc_pwd) < 8:
            raise ValueError(
                "Production seeding failed: INITIAL_DOCTOR_PASSWORD is too weak or set to a known demo default. "
                "Configure a secure password (minimum 8 characters) in the Render Dashboard."
            )
        if not raw_adm_pwd:
            raise ValueError(
                "Production seeding failed: INITIAL_ADMIN_PASSWORD environment variable is missing. "
                "Configure a secure password in the Render Dashboard (or use generateValue in render.yaml)."
            )
        if raw_adm_pwd in insecure_demo_passwords or len(raw_adm_pwd) < 8:
            raise ValueError(
                "Production seeding failed: INITIAL_ADMIN_PASSWORD is too weak or set to a known demo default. "
                "Configure a secure password (minimum 8 characters) in the Render Dashboard."
            )
        doctor_password = raw_doc_pwd
        admin_password = raw_adm_pwd
    else:
        doctor_password = raw_doc_pwd or "doctor123"
        admin_password = raw_adm_pwd or "admin123"

    doctor_user = User(
        email=doctor_email,
        password_hash=hash_password(doctor_password),
        name=os.getenv("INITIAL_DOCTOR_NAME", "Dr. Ananya S"),
        role="doctor",
        department="Radiology",
        role_title="Radiologist",
        phone="+91 98765 43210",
        avatar_url="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
        is_active=True
    )
    admin_user = User(
        email=admin_email,
        password_hash=hash_password(admin_password),
        name=os.getenv("INITIAL_ADMIN_NAME", "Admin"),
        role="admin",
        department="Hospital Administration",
        role_title="Hospital Administrator",
        phone="+91 98765 43211",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        is_active=True
    )
    db.add(doctor_user)
    db.add(admin_user)
    db.commit()

    # 2. Doctors
    doctors_data = [
        {"name": "Dr. Ananya S", "email": "ananya.s@citycarehospital.com", "dept": "Radiology", "role": "Radiologist", "status": "Active", "joined": "12 Jan 2025", "cases": 18, "user_id": doctor_user.id, "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"},
        {"name": "Dr. Karthik V", "email": "karthik.v@citycarehospital.com", "dept": "Orthopedics", "role": "Orthopedic Surgeon", "status": "Active", "joined": "03 Feb 2025", "cases": 16, "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"},
        {"name": "Dr. Priya M", "email": "priya.m@citycarehospital.com", "dept": "Radiology", "role": "Radiologist", "status": "Active", "joined": "18 Feb 2025", "cases": 12, "avatar": "https://images.unsplash.com/photo-1594824813576-9051017c603a?w=150&auto=format&fit=crop&q=80"},
        {"name": "Dr. Rahul K", "email": "rahul.k@citycarehospital.com", "dept": "Emergency", "role": "Emergency Physician", "status": "Inactive", "joined": "10 Mar 2025", "cases": 10, "avatar": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80"},
        {"name": "Dr. Sneha R", "email": "sneha.r@citycarehospital.com", "dept": "Orthopedics", "role": "Orthopedic Surgeon", "status": "Active", "joined": "22 Mar 2025", "cases": 8, "avatar": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80"},
        {"name": "Dr. Vivek A", "email": "vivek.a@citycarehospital.com", "dept": "Radiology", "role": "Radiologist", "status": "Active", "joined": "15 Apr 2025", "cases": 11, "avatar": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80"},
        {"name": "Dr. Meera S", "email": "meera.s@citycarehospital.com", "dept": "Emergency", "role": "Emergency Physician", "status": "Inactive", "joined": "28 Apr 2025", "cases": 5, "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"},
        {"name": "Dr. Suresh P", "email": "suresh.p@citycarehospital.com", "dept": "Orthopedics", "role": "Orthopedic Surgeon", "status": "Active", "joined": "05 May 2025", "cases": 4, "avatar": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80"}
    ]

    doctor_entities = []
    for d in doctors_data:
        doc = Doctor(
            user_id=d.get("user_id"),
            name=d["name"],
            email=d["email"],
            department=d["dept"],
            role_title=d["role"],
            status=d["status"],
            joined_on=d["joined"],
            total_cases=d["cases"],
            avatar_url=d.get("avatar")
        )
        db.add(doc)
        doctor_entities.append(doc)
    db.commit()

    # 3. Patients
    patients_data = [
        {"pid": "P-2026-0143", "name": "S. Arjun", "age": 14, "sex": "M", "phone": "+91 98765 43210", "status": "Active", "last": "26 Oct 2026", "follow": "10 Nov 2026", "cases": 2},
        {"pid": "P-2026-0142", "name": "R. Karthik", "age": 16, "sex": "M", "phone": "+91 93456 78123", "status": "Active", "last": "26 Oct 2026", "follow": None, "cases": 1},
        {"pid": "P-2026-0141", "name": "S. Meera", "age": 12, "sex": "F", "phone": "+91 91234 56789", "status": "Follow-up", "last": "25 Oct 2026", "follow": "02 Nov 2026", "cases": 1},
        {"pid": "P-2026-0140", "name": "A. Vivek", "age": 28, "sex": "M", "phone": "+91 87654 32109", "status": "Active", "last": "24 Oct 2026", "follow": "08 Nov 2026", "cases": 3},
        {"pid": "P-2026-0139", "name": "K. Divya", "age": 19, "sex": "F", "phone": "+91 99876 54321", "status": "Active", "last": "24 Oct 2026", "follow": None, "cases": 1},
        {"pid": "P-2026-0138", "name": "M. Rahul", "age": 34, "sex": "M", "phone": "+91 98712 34567", "status": "Follow-up", "last": "23 Oct 2026", "follow": "05 Nov 2026", "cases": 2},
        {"pid": "P-2026-0137", "name": "P. Nandini", "age": 42, "sex": "F", "phone": "+91 96123 45678", "status": "Active", "last": "20 Oct 2026", "follow": "29 Oct 2026", "cases": 1},
        {"pid": "P-2026-0136", "name": "R. Vijay", "age": 25, "sex": "M", "phone": "+91 93421 67890", "status": "Inactive", "last": "18 Oct 2026", "follow": None, "cases": 2},
        {"pid": "P-2026-0135", "name": "T. Keerthana", "age": 31, "sex": "F", "phone": "+91 91230 45678", "status": "Active", "last": "15 Oct 2026", "follow": "01 Nov 2026", "cases": 1},
        {"pid": "P-2026-0134", "name": "D. Prakash", "age": 27, "sex": "M", "phone": "+91 90012 34567", "status": "Active", "last": "12 Oct 2026", "follow": None, "cases": 2}
    ]

    patient_entities = {}
    for p in patients_data:
        pat = Patient(
            patient_id=p["pid"],
            name=p["name"],
            age=p["age"],
            sex=p["sex"],
            phone_number=p["phone"],
            status=p["status"],
            last_visit=p["last"],
            next_follow_up=p["follow"],
            total_cases=p["cases"]
        )
        db.add(pat)
        patient_entities[p["pid"]] = pat
    db.commit()

    # 4. Cases
    cases_data = [
        {
            "cid": "C-2026-0143", "pid": "P-2026-0143", "pname": "S. Arjun", "age": 14, "sex": "M",
            "doc": "Dr. Ananya S", "dept": "Radiology", "date": "26 Oct 2026, 10:12 AM",
            "img_key": "case_01", "pred": "FRACTURE", "norm_score": 0.0008, "frac_score": 0.9992, "conf": 99.92,
            "status": "Reviewed", "notes": "Fall on outstretched hand while skateboarding. Severe localized wrist pain and dorsal fullness."
        },
        {
            "cid": "C-2026-0142", "pid": "P-2026-0142", "pname": "R. Karthik", "age": 16, "sex": "M",
            "doc": "Dr. Karthik V", "dept": "Orthopedics", "date": "26 Oct 2026, 09:45 AM",
            "img_key": "case_03", "pred": "NORMAL", "norm_score": 0.9999, "frac_score": 0.0001, "conf": 99.99,
            "status": "Reviewed", "notes": "Sports blunt impact. Normal range of motion, mild soft tissue contusion, cortices intact."
        },
        {
            "cid": "C-2026-0141", "pid": "P-2026-0141", "pname": "S. Meera", "age": 12, "sex": "F",
            "doc": "Dr. Priya M", "dept": "Radiology", "date": "25 Oct 2026, 09:20 AM",
            "img_key": "case_05", "pred": "UNCERTAIN", "norm_score": 0.4200, "frac_score": 0.5800, "conf": 58.00,
            "status": "Needs Review", "notes": "Suspected pediatric buckle/torus fracture. Radiologist review requested."
        },
        {
            "cid": "C-2026-0140", "pid": "P-2026-0140", "pname": "A. Vivek", "age": 28, "sex": "M",
            "doc": "Dr. Rahul K", "dept": "Emergency", "date": "24 Oct 2026, 08:55 AM",
            "img_key": "case_02", "pred": "FRACTURE", "norm_score": 0.0400, "frac_score": 0.9600, "conf": 96.00,
            "status": "Reviewed", "notes": "Motor vehicle collision. Significant radial wrist deformity, dinner fork appearance."
        },
        {
            "cid": "C-2026-0139", "pid": "P-2026-0139", "pname": "K. Divya", "age": 19, "sex": "F",
            "doc": "Dr. Sneha R", "dept": "Orthopedics", "date": "24 Oct 2026, 04:30 PM",
            "img_key": "case_03", "pred": "NORMAL", "norm_score": 0.9999, "frac_score": 0.0001, "conf": 99.99,
            "status": "Reviewed", "notes": "Twisting injury during basketball. Pain along ulnar side, intact bones."
        },
        {
            "cid": "C-2026-0138", "pid": "P-2026-0138", "pname": "M. Sanjay", "age": 35, "sex": "M",
            "doc": "Dr. Vivek A", "dept": "Radiology", "date": "22 Oct 2026, 11:15 AM",
            "img_key": "case_04", "pred": "FRACTURE", "norm_score": 0.1402, "frac_score": 0.8598, "conf": 85.98,
            "status": "Needs Review", "notes": "Fall from ladder. Subtle metaphyseal transverse fracture line."
        },
        {
            "cid": "C-2026-0137", "pid": "P-2026-0137", "pname": "P. Nandini", "age": 42, "sex": "F",
            "doc": "Dr. Meera S", "dept": "Emergency", "date": "20 Oct 2026, 02:10 PM",
            "img_key": "case_03", "pred": "NORMAL", "norm_score": 0.9999, "frac_score": 0.0001, "conf": 99.99,
            "status": "Reviewed", "notes": "Slip and fall in kitchen. No visible fracture, intact joint spaces."
        },
        {
            "cid": "C-2026-0136", "pid": "P-2026-0136", "pname": "R. Vijay", "age": 25, "sex": "M",
            "doc": "Dr. Ananya S", "dept": "Radiology", "date": "18 Oct 2026, 01:45 PM",
            "img_key": "case_05", "pred": "UNCERTAIN", "norm_score": 0.4500, "frac_score": 0.5500, "conf": 55.00,
            "status": "Needs Review", "notes": "Mild tenderness over radial styloid. Borderline cortical discontinuity."
        },
        {
            "cid": "C-2026-0135", "pid": "P-2026-0135", "pname": "T. Keerthana", "age": 31, "sex": "F",
            "doc": "Dr. Karthik V", "dept": "Orthopedics", "date": "15 Oct 2026, 10:20 AM",
            "img_key": "case_01", "pred": "FRACTURE", "norm_score": 0.0008, "frac_score": 0.9992, "conf": 99.92,
            "status": "Reviewed", "notes": "Two-wheeler skid injury. Lateral radiograph demonstrates clear dorsal displacement."
        },
        {
            "cid": "C-2026-0134", "pid": "P-2026-0134", "pname": "D. Prakash", "age": 27, "sex": "M",
            "doc": "Dr. Priya M", "dept": "Radiology", "date": "12 Oct 2026, 03:35 PM",
            "img_key": "case_03", "pred": "NORMAL", "norm_score": 0.9999, "frac_score": 0.0001, "conf": 99.99,
            "status": "Reviewed", "notes": "Post-gym wrist strain. Normal radiographs, soft tissue rest advised."
        }
    ]

    for c in cases_data:
        file_info = uploaded_files.get(c["img_key"], ("seed_case_01.png", "seed_case_01_thumb.png"))
        pat_obj = patient_entities.get(c["pid"])
        doc_obj = next((d for d in doctor_entities if d.name == c["doc"]), None)

        case_obj = Case(
            case_id=c["cid"],
            patient_db_id=pat_obj.id if pat_obj else None,
            patient_id=c["pid"],
            patient_name=c["pname"],
            age=c["age"],
            sex=c["sex"],
            doctor_id=doc_obj.id if doc_obj else None,
            doctor_name=c["doc"],
            department=c["dept"],
            study_date=c["date"],
            image_filename=file_info[0],
            thumbnail_filename=file_info[1],
            clinical_notes=c["notes"],
            ai_prediction=c["pred"],
            normal_score=c["norm_score"],
            fracture_score=c["frac_score"],
            confidence=c["conf"],
            status=c["status"],
            inference_time_ms=128.5
        )
        db.add(case_obj)
    db.commit()

    # 5. Activity Logs
    activities = [
        {"type": "case_analyzed", "title": "New case analysed", "desc": "P-2026-0143 (S. Arjun) - Fracture Detected", "time": "26 Oct 2026, 10:12 AM", "user": "Dr. Ananya S", "icon": "case"},
        {"type": "doctor_created", "title": "New doctor account created", "desc": "Dr. Priya M added to Radiology", "time": "26 Oct 2026, 09:30 AM", "user": "Admin", "icon": "doctor"},
        {"type": "report_generated", "title": "Report generated", "desc": "P-2026-0142 (R. Karthik) analysis report exported", "time": "26 Oct 2026, 09:10 AM", "user": "Dr. Karthik V", "icon": "report"},
        {"type": "patient_updated", "title": "Patient record updated", "desc": "P-2026-0139 (K. Divya) follow-up scheduled", "time": "25 Oct 2026, 04:20 PM", "user": "Dr. Sneha R", "icon": "patient"},
        {"type": "report_viewed", "title": "Monthly report viewed", "desc": "Hospital monthly fracture overview accessed", "time": "26 Oct 2026, 11:00 AM", "user": "Admin", "icon": "chart"}
    ]

    for a in activities:
        act = ActivityLog(
            activity_type=a["type"],
            title=a["title"],
            description=a["desc"],
            timestamp_str=a["time"],
            user_name=a["user"],
            icon_type=a["icon"]
        )
        db.add(act)
    db.commit()

    db.close()
    print("[Database Seed] Seed completed successfully.")

if __name__ == "__main__":
    seed_database()
