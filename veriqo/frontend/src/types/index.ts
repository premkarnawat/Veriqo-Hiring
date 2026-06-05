// ============================================================
// VERIQO - Core Domain Types
// ============================================================

export type UserRole = 'candidate' | 'employer' | 'expert' | 'admin'

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'expired'

export type FraudRisk = 'low' | 'medium' | 'high'

export type JobStatus = 'draft' | 'active' | 'paused' | 'closed'

export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'ats_matched'
  | 'interest_confirmed'
  | 'portfolio_verified'
  | 'work_sample'
  | 'expert_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

// ============================================================
// USER & AUTH
// ============================================================

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string
  avatar_url?: string
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface Session {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
}

// ============================================================
// CANDIDATE
// ============================================================

export interface CandidateProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  location?: string
  headline?: string
  summary?: string
  avatar_url?: string
  resume_url?: string
  github_url?: string
  linkedin_url?: string
  portfolio_url?: string
  behance_url?: string
  dribbble_url?: string
  years_of_experience?: number
  current_salary?: number
  expected_salary?: number
  notice_period_days?: number
  open_to_relocation: boolean
  skills: string[]
  verification_status: VerificationStatus
  trust_score?: number
  ats_score?: number
  portfolio_score?: number
  work_sample_score?: number
  technical_score?: number
  communication_score?: number
  reliability_score?: number
  fraud_risk?: FraudRisk
  fraud_score?: number
  joining_probability?: number
  passport_id?: string
  created_at: string
  updated_at: string
}

export interface CandidatePassport {
  id: string
  passport_id: string
  candidate_id: string
  candidate: CandidateProfile
  ats_score: number
  portfolio_score: number
  work_sample_score: number
  technical_score: number
  communication_score: number
  reliability_score: number
  fraud_risk: FraudRisk
  fraud_score: number
  joining_probability: number
  overall_trust_score: number
  verification_status: VerificationStatus
  final_recommendation: 'highly_recommended' | 'recommended' | 'conditional' | 'not_recommended'
  verified_at?: string
  expires_at?: string
  share_url?: string
  pdf_url?: string
  created_at: string
}

// ============================================================
// EMPLOYER
// ============================================================

export interface Company {
  id: string
  user_id: string
  name: string
  logo_url?: string
  website?: string
  industry?: string
  size?: string
  description?: string
  verified: boolean
  subscription_plan: 'free' | 'starter' | 'growth' | 'enterprise'
  subscription_status: 'active' | 'inactive' | 'trial' | 'cancelled'
  trial_ends_at?: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  company_id: string
  company?: Company
  title: string
  description: string
  requirements: string[]
  skills_required: string[]
  location?: string
  job_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
  work_mode: 'onsite' | 'remote' | 'hybrid'
  salary_min?: number
  salary_max?: number
  experience_min?: number
  experience_max?: number
  status: JobStatus
  applicant_count: number
  shortlisted_count: number
  created_at: string
  updated_at: string
}

// ============================================================
// APPLICATION / PIPELINE
// ============================================================

export interface Application {
  id: string
  job_id: string
  job?: Job
  candidate_id: string
  candidate?: CandidateProfile
  status: ApplicationStatus
  ats_score?: number
  interest_confirmed?: boolean
  current_salary?: number
  expected_salary?: number
  notice_period_days?: number
  open_to_relocation?: boolean
  has_other_offers?: boolean
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================================
// VERIFICATION
// ============================================================

export interface VerificationStage {
  id: string
  candidate_id: string
  stage: 'portfolio' | 'work_sample' | 'ai_evaluation' | 'expert_review' | 'reliability'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  score?: number
  feedback?: string
  assigned_expert_id?: string
  completed_at?: string
  created_at: string
}

// ============================================================
// EXPERT
// ============================================================

export interface Expert {
  id: string
  user_id: string
  full_name: string
  avatar_url?: string
  domains: string[]
  rating: number
  total_reviews: number
  verified: boolean
  available: boolean
  earnings_total: number
  created_at: string
}

// ============================================================
// ANALYTICS / DASHBOARD
// ============================================================

export interface EmployerDashboardStats {
  total_jobs: number
  active_jobs: number
  total_candidates: number
  verified_candidates: number
  interviews_scheduled: number
  offers_made: number
  hires_this_month: number
  avg_time_to_hire: number
  offer_acceptance_rate: number
  candidate_quality_score: number
}

export interface CandidateDashboardStats {
  applications_sent: number
  interviews_scheduled: number
  profile_views: number
  trust_score?: number
  verification_status: VerificationStatus
  passport_ready: boolean
}

// ============================================================
// UI HELPERS
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  success: boolean
}
