import { 
  User, Doctor, Patient, CaseRecord, 
  DoctorDashboardStats, AdminDashboardStats, AnalysisResultPayload 
} from '../types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  ''
).replace(/\/$/, '');

const BASE_URL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

export function getAssetUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('wristai_token');
}

export function setAuthSession(token: string, user: User) {
  localStorage.setItem('wristai_token', token);
  localStorage.setItem('wristai_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('wristai_token');
  localStorage.removeItem('wristai_user');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('wristai_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is not FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// ----------------- AUTH APIS -----------------
export async function loginApi(email: string, password: string, role: 'doctor' | 'admin'): Promise<{ access_token: string; user: User }> {
  return request<{ access_token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
}

export async function getMeApi(): Promise<User> {
  return request<User>('/auth/me');
}

export async function updateProfileApi(data: Partial<User>): Promise<User> {
  return request<User>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

// ----------------- DOCTOR APIS -----------------
export async function getDoctorDashboardStatsApi(): Promise<DoctorDashboardStats> {
  return request<DoctorDashboardStats>('/doctor/dashboard-stats');
}

export async function analyzeXrayApi(formData: FormData): Promise<AnalysisResultPayload> {
  return request<AnalysisResultPayload>('/doctor/analyze', {
    method: 'POST',
    body: formData,
  });
}

export async function getDoctorCasesApi(params?: {
  search?: string;
  result?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; total_pages: number; items: CaseRecord[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.result) query.set('result', params.result);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  
  return request(`/doctor/cases?${query.toString()}`);
}

export async function getCaseDetailApi(id: number | string): Promise<CaseRecord & { disclaimer: string }> {
  return request(`/doctor/cases/${id}`);
}

export async function reviewCaseApi(id: number | string, status: string, reviewNotes?: string): Promise<{ message: string }> {
  return request(`/doctor/cases/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, review_notes: reviewNotes }),
  });
}

export async function saveCaseAnnotationApi(
  caseId: string, 
  data: { x_min: number; y_min: number; x_max: number; y_max: number; label?: string; notes?: string }
): Promise<any> {
  return request(`/doctor/cases/${caseId}/annotations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCaseAnnotationsApi(caseId: string): Promise<any[]> {
  return request(`/doctor/cases/${caseId}/annotations`);
}

export async function deleteCaseAnnotationApi(caseId: string, annotationId: number): Promise<{ message: string }> {
  return request(`/doctor/cases/${caseId}/annotations/${annotationId}`, {
    method: 'DELETE',
  });
}

export async function getPatientsApi(params?: {
  search?: string;
  gender?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; total_pages: number; items: Patient[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.gender) query.set('gender', params.gender);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  return request(`/doctor/patients?${query.toString()}`);
}

export async function createPatientApi(data: Partial<Patient>): Promise<Patient> {
  return request<Patient>('/doctor/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ----------------- ADMIN APIS -----------------
export async function getAdminDashboardStatsApi(): Promise<AdminDashboardStats> {
  return request<AdminDashboardStats>('/admin/dashboard-stats');
}

export async function getDoctorsApi(params?: {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; total_pages: number; items: Doctor[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.department) query.set('department', params.department);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  return request(`/admin/doctors?${query.toString()}`);
}

export async function addDoctorApi(data: Partial<Doctor>): Promise<Doctor> {
  return request<Doctor>('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDoctorApi(id: number, data: Partial<Doctor>): Promise<Doctor> {
  return request<Doctor>(`/admin/doctors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAdminPatientsApi(params?: {
  search?: string;
  gender?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; total_pages: number; items: Patient[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.gender) query.set('gender', params.gender);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  return request(`/admin/patients?${query.toString()}`);
}

export async function addAdminPatientApi(data: Partial<Patient>): Promise<Patient> {
  return request<Patient>('/admin/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminPatientApi(id: number, data: Partial<Patient>): Promise<Patient> {
  return request<Patient>(`/admin/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAllCasesApi(params?: {
  search?: string;
  result?: string;
  doctor?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; total_pages: number; items: CaseRecord[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.result) query.set('result', params.result);
  if (params?.doctor) query.set('doctor', params.doctor);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  return request(`/admin/cases?${query.toString()}`);
}

export async function getReportsDataApi(): Promise<any> {
  return request('/admin/reports-data');
}

export function getExportCsvUrl(): string {
  const token = getAuthToken();
  return `${BASE_URL}/admin/export-csv?token=${token || ''}`;
}
