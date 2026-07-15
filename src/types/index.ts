export interface User {
  id: number
  school_id: number
  student_id?: number | null
  first_name: string
  last_name: string
  email: string
  role: 'super_admin' | 'director' | 'teacher' | 'parent' | 'student' | 'accountant' | 'counselor' | 'librarian' | 'nurse' | 'maintenance' | 'secretary'
  phone?: string
  avatar_url?: string
  school_name?: string
  primary_color?: string
  secondary_color?: string
  school_logo?: string
  must_change_password?: boolean | number
}

export interface School {
  id: number
  name: string
  address?: string
  city?: string
  phone?: string
  email?: string
  logo_url?: string
  is_public?: boolean
  primary_color: string
  secondary_color: string
}

export interface PublicSchool {
  id: number
  name: string
  city?: string
  logo_url?: string
  primary_color?: string
}

export interface Student {
  id: number
  school_id: number
  matricule: string
  first_name: string
  last_name: string
  birth_date?: string
  birth_place?: string
  gender: 'M' | 'F'
  photo_url?: string
  class_id?: number
  class_name?: string
  cycle?: string
  parent_id?: number
  parent_name?: string
  parent_phone?: string
  parent_email?: string
  status: 'pre_inscrit' | 'inscrit' | 'reinscrit' | 'archive'
  address?: string
  blood_type?: string
  medical_notes?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at: string
}

export interface Class {
  id: number
  school_id: number
  name: string
  level?: string
  cycle: 'maternelle' | 'primaire' | 'secondaire'
  teacher_id?: number
  teacher_name?: string
  capacity: number
  student_count?: number
}

export interface Subject {
  id: number
  school_id: number
  name: string
  code?: string
  coefficient: number
  class_id?: number
  class_name?: string
  teacher_id?: number
  teacher_name?: string
}

export interface Grade {
  id: number
  student_id: number
  student_name?: string
  matricule?: string
  subject_id: number
  subject_name?: string
  coefficient?: number
  class_name?: string
  value: number
  max_value: number
  period: 'trimestre1' | 'trimestre2' | 'trimestre3' | 'semestre1' | 'semestre2'
  grade_type: string
  comment?: string
  created_at: string
}

export interface Attendance {
  id: number
  student_id: number
  student_name?: string
  matricule?: string
  class_id: number
  class_name?: string
  date: string
  status: 'present' | 'absent' | 'retard' | 'sortie_anticipee'
  justified: boolean
  justification?: string
}

export interface ScheduleEntry {
  id: number
  class_id: number
  class_name?: string
  subject_id: number
  subject_name?: string
  teacher_id?: number
  teacher_name?: string
  room_id?: number
  room_name?: string
  day_of_week: number
  day_name?: string
  start_time: string
  end_time: string
}

export interface StaffMember {
  id: number
  user_id: number
  school_id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  position?: string
  contract_type: string
  hire_date?: string
  salary?: number
  is_active: boolean
  last_login?: string
  avatar_url?: string
}

export interface Invoice {
  id: number
  student_id: number
  student_name?: string
  matricule?: string
  class_name?: string
  invoice_number: string
  amount: number
  type: 'scolarite' | 'transport' | 'cantine' | 'uniforme' | 'activite' | 'autre'
  description?: string
  due_date?: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_method?: string
  paid_at?: string
  created_at: string
}

export interface Exam {
  id: number
  school_id: number
  academic_year_id?: number
  class_id: number
  class_name?: string
  subject_id: number
  subject_name?: string
  title: string
  exam_date: string
  start_time: string
  end_time: string
  room_id?: number
  room_name?: string
  period: 'trimestre1' | 'trimestre2' | 'trimestre3' | 'semestre1' | 'semestre2'
  max_value: number
  status: 'planifie' | 'termine' | 'annule'
  created_by_name?: string
  supervisors?: Array<{ id: number; name: string }>
  grades?: Array<{ id: number; student_id: number; student_name: string; matricule: string; value: number }>
  created_at: string
}

export interface StaffAttendanceRow {
  id: number
  position?: string
  first_name: string
  last_name: string
  avatar_url?: string
  attendance: {
    id?: number
    check_in_time?: string | null
    check_out_time?: string | null
    status: 'present' | 'absent' | 'retard' | 'conge'
    source?: 'manuel' | 'biometrique'
    notes?: string
  } | null
}

export interface Payslip {
  id: number
  school_id: number
  staff_id: number
  first_name?: string
  last_name?: string
  position?: string
  period_month: string
  reference: string
  base_salary: number
  bonuses: number
  bonuses_detail?: string
  deductions: number
  deductions_detail?: string
  net_amount: number
  status: 'draft' | 'paid'
  payment_method?: string
  paid_at?: string
  created_at: string
}

export interface SmsLog {
  id: number
  school_id: number
  sender_id?: number
  sender_name?: string
  recipient_group?: string
  trigger_type: 'manuel' | 'absence' | 'facture'
  content: string
  recipient_count: number
  sent_count: number
  failed_count: number
  status: 'pending' | 'sent' | 'partial' | 'failed'
  provider: string
  created_at: string
  recipients?: Array<{ id: number; recipient_name?: string; phone: string; status: 'sent' | 'failed'; error?: string }>
}

export interface AcademicYear {
  id: number
  school_id: number
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  class_count?: number
  student_count?: number
  created_at: string
}

export interface Document {
  id: number
  school_id: number
  student_id?: number
  uploaded_by: number
  name: string
  type: 'bulletin' | 'certificat' | 'contrat' | 'photo' | 'identite' | 'medical' | 'autre'
  file_path: string
  file_size?: number
  mime_type?: string
  created_at: string
}

export interface Message {
  id: number
  sender_id: number
  sender_name?: string
  sender_role?: string
  sender_avatar?: string
  subject?: string
  content: string
  parent_message_id?: number | null
  created_at: string
  read_at?: string
  reply_count?: number
  unread_reply_count?: number
  recipient_count?: number
  read_count?: number
  replies?: Message[]
}

export interface Notification {
  id: number
  title: string
  content?: string
  type: 'info' | 'warning' | 'success' | 'absence' | 'grade' | 'finance' | 'message'
  is_read: boolean
  created_at: string
}

export interface Book {
  id: number
  school_id: number
  title: string
  author?: string
  isbn?: string
  category?: string
  total_copies: number
  available_copies: number
  created_at: string
}

export interface BookLoan {
  id: number
  book_id: number
  book_title?: string
  book_author?: string
  student_id?: number
  staff_id?: number
  student_name?: string
  staff_name?: string
  borrowed_at: string
  due_date: string
  returned_at?: string
  status: 'emprunte' | 'rendu' | 'perdu'
}

export interface HealthVisit {
  id: number
  student_id: number
  student_name?: string
  matricule?: string
  class_name?: string
  visit_date: string
  reason: string
  treatment?: string
  temperature?: number
  sent_home: boolean
  notes?: string
}

export interface SchoolService {
  id: number
  school_id: number
  type: 'cantine' | 'transport'
  name: string
  description?: string
  price: number
  is_active: boolean
  created_at: string
}

export interface ServiceSubscription {
  id: number
  service_id: number
  service_name?: string
  service_type?: 'cantine' | 'transport'
  price?: number
  student_id: number
  student_name?: string
  matricule?: string
  class_name?: string
  start_date: string
  end_date?: string
  status: 'active' | 'suspendu' | 'termine'
  notes?: string
}

export interface DashboardStats {
  counters: {
    students: number
    teachers: number
    classes: number
    unpaid_invoices: number
    unread_messages: number
  }
  attendance: {
    today: { total: number; present: number; absent: number }
    trend: Array<{ date: string; total: number; present: number; absent: number }>
  }
  finance: { total: number; collected: number; pending: number }
  classAverages: Array<{ class_name: string; average: number }>
  recentAbsences: Array<{ date: string; status: string; student_name: string; class_name: string; justified: boolean }>
}
