// ---------------------------------------------------------------------------
// Canonical Lead type.
//
// One shared definition for a lead across every surface that touches one: the
// agency leads list, the lead detail page, the admin leads page, and the
// Composer and Call-Script modals. Previously each of those declared its own
// `interface Lead`, and they drifted apart (notably website/notes being
// `string | null` in one place and `string` in another), which caused a build
// break when a lead from one surface was passed into a modal typed by another.
//
// Nullability here mirrors the database: columns that can be empty are
// `string | null`, and fields that only some endpoints return are optional.
// Required fields are the ones every endpoint always sends.
// ---------------------------------------------------------------------------

export interface LeadOutreachSummary {
  last_contacted?: string | null;
  email_count?: number;
  sms_count?: number;
  call_count?: number;
}

export interface Lead {
  // Always present
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  industry: string;
  source: string;
  status: string;
  estimated_value: number;
  next_follow_up: string | null;
  created_at: string;

  // Present on some surfaces / nullable in the database
  website?: string | null;
  notes?: string | null;
  linkedin_url?: string | null;
  converted_client_id?: string | null;
  updated_at?: string;
  last_outreach_at?: string | null;
  last_outreach_type?: string | null;

  // Computed join, returned by the agency leads-list endpoint only
  outreach?: LeadOutreachSummary;
}