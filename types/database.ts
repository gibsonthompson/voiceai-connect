// ============================================================================
// DATABASE TYPES
// Auto-generated types for Supabase tables
// ============================================================================

export type AgencyStatus = 'pending_payment' | 'trial' | 'active' | 'suspended';
export type AgencyPlan = 'starter' | 'professional' | 'enterprise';
export type ClientStatus = 'pending' | 'provisioning' | 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended';
export type ClientPlan = 'starter' | 'pro' | 'growth';
export type SubscriptionStatus = 'pending' | 'trial' | 'active' | 'past_due' | 'canceled';
export type UserRole = 'super_admin' | 'agency_owner' | 'agency_staff' | 'client' | 'admin';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';

export interface Agency {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  phone?: string;
  
  // Branding
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  
  // Domain
  slug?: string;
  marketing_domain?: string;
  domain_verified: boolean;
  
  // Client Pricing (in cents)
  price_starter: number;
  price_pro: number;
  price_growth: number;
  
  // Client Call Limits
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
  
  // Stripe Platform Billing
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  
  // Stripe Connect
  stripe_account_id?: string;
  stripe_onboarding_complete: boolean;
  
  // Subscription
  plan_type: AgencyPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  current_period_end?: string;
  
  // Status
  status: AgencyStatus;
  onboarding_completed: boolean;
  onboarding_step: number;
  
  // Settings
  support_email?: string;
  support_phone?: string;
  timezone: string;
  
  // White-label
  company_tagline?: string;
  website_headline?: string;
  website_subheadline?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Client {
  id: string;
  agency_id?: string;
  created_at: string;
  updated_at?: string;
  
  // Business Info
  business_name: string;
  industry?: string;
  business_website?: string;
  business_city?: string;
  business_state?: string;
  business_hours?: Record<string, { open: string; close: string } | null>;
  website_url?: string;
  
  // Contact
  email?: string;
  owner_name?: string;
  owner_phone: string;
  phone_number?: string;
  phone_area_code?: string;
  
  // VAPI
  vapi_assistant_id?: string;
  vapi_phone_number?: string;
  vapi_phone_number_id?: string;
  voice_id?: string;
  greeting_message?: string;
  
  // Knowledge Base
  knowledge_base_id?: string;
  knowledge_base_data?: Record<string, unknown>;
  knowledge_base_updated_at?: string;
  
  // Subscription
  status: ClientStatus;
  plan?: string;
  plan_type: ClientPlan;
  monthly_price?: number;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  
  // Usage
  monthly_call_limit: number;
  calls_this_month: number;
  
  // Settings
  sms_notifications: boolean;
  notification_phone?: string;
  timezone: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  
  // Calendar
  calendar_provider?: string;
  google_calendar_connected: boolean;
  google_access_token?: string;
  google_refresh_token?: string;
  google_token_expires_at?: string;
  google_calendar_id?: string;
  calcom_connected: boolean;
  calcom_api_key?: string;
  calcom_event_type_id?: string;
  calcom_username?: string;
  calcom_user_id?: string;
  appointment_duration: number;
  
  // Onboarding Tracking
  first_call_received: boolean;
  first_call_received_at?: string;
  gbp_setup_completed: boolean;
  pwa_installed: boolean;
  
  // Referral
  referral_source?: string;
}

export interface User {
  id: string;
  agency_id?: string;
  client_id?: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name?: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
}

export interface Call {
  id: string;
  client_id?: string;
  conversation_id?: string;
  created_at: string;
  
  // Call Info
  caller_phone?: string;
  duration_seconds?: number;
  started_at?: string;
  ended_at?: string;
  call_status: string;
  
  // Content
  transcript?: string;
  summary?: string;
  ai_summary?: string;
  recording_url?: string;
  
  // Extracted Data
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  service_requested?: string;
  urgency_level?: UrgencyLevel;
  sentiment?: string;
  
  // Appointment
  appointment_booked: boolean;
  appointment_time?: string;
  
  // Notifications
  sms_sent: boolean;
  sms_sent_at?: string;
  
  // Raw Data
  conversation_data?: Record<string, unknown>;
  call_metadata?: Record<string, unknown>;
}

export interface Appointment {
  id: string;
  client_id?: string;
  google_event_id?: string;
  calcom_booking_id?: string;
  
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  appointment_time: string;
  duration: number;
  service_type?: string;
  notes?: string;
  status: string;
  booking_source: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  agency_id?: string;
  client_id?: string;
  first_name: string;
  last_name?: string;
}

export interface JWTPayload {
  sub: string;  // user id
  email: string;
  role: UserRole;
  agency_id?: string;
  client_id?: string;
  iat: number;
  exp: number;
}

// ============================================================================
// AGENCY CONTEXT (for middleware/routing)
// ============================================================================

export interface AgencyContext {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  support_email?: string;
  price_starter: number;
  price_pro: number;
  price_growth: number;
}
