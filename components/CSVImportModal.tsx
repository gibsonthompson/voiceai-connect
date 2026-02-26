'use client';

import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, FileSpreadsheet, Loader2, CheckCircle,
  AlertCircle, ArrowRight, ArrowLeft, ChevronDown, Info
} from 'lucide-react';

// Default dark theme for admin pages (no agency theme available)
const ADMIN_DARK_THEME = {
  bg: '#0a0a0a',
  text: '#fafaf9',
  textMuted: 'rgba(250,250,249,0.5)',
  border: 'rgba(255,255,255,0.08)',
  hover: 'rgba(255,255,255,0.04)',
  card: 'rgba(255,255,255,0.04)',
  input: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.08)',
  primary: '#3b82f6',
  primary15: 'rgba(59,130,246,0.15)',
  primary30: 'rgba(59,130,246,0.3)',
  primaryText: '#ffffff',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.1)',
  errorBorder: 'rgba(239,68,68,0.2)',
  warning: '#f59e0b',
  warningBg: 'rgba(245,158,11,0.1)',
  warningBorder: 'rgba(245,158,11,0.2)',
  info: '#60a5fa',
  infoBg: 'rgba(96,165,250,0.1)',
  infoBorder: 'rgba(96,165,250,0.2)',
  isDark: true,
};

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  onImportComplete: () => void;
  theme?: any;
  apiBase?: string;  // '/api/admin' for admin, undefined for agency
}

// The lead fields we support mapping to
const LEAD_FIELDS = [
  { key: 'business_name', label: 'Business Name', required: true },
  { key: 'contact_name', label: 'Contact Name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'industry', label: 'Industry', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'estimated_value', label: 'Estimated Value ($/mo)', required: false },
  { key: 'company_size', label: 'Company Size', required: false },
];

// Smart auto-mapping: CSV header → lead field
const AUTO_MAP: Record<string, string> = {
  // business_name
  'company': 'business_name',
  'company name': 'business_name',
  'company_name': 'business_name',
  'business': 'business_name',
  'business name': 'business_name',
  'business_name': 'business_name',
  'organization': 'business_name',
  'organization name': 'business_name',
  'account': 'business_name',
  'account name': 'business_name',
  'name': 'business_name',
  // contact_name
  'contact': 'contact_name',
  'contact name': 'contact_name',
  'contact_name': 'contact_name',
  'full name': 'contact_name',
  'full_name': 'contact_name',
  'person': 'contact_name',
  'person name': 'contact_name',
  // first + last name combo handled separately
  'first name': '_first_name',
  'first_name': '_first_name',
  'firstname': '_first_name',
  'last name': '_last_name',
  'last_name': '_last_name',
  'lastname': '_last_name',
  // email
  'email': 'email',
  'email address': 'email',
  'email_address': 'email',
  'e-mail': 'email',
  'work email': 'email',
  'business email': 'email',
  // phone
  'phone': 'phone',
  'phone number': 'phone',
  'phone_number': 'phone',
  'telephone': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'work phone': 'phone',
  'direct phone': 'phone',
  // website
  'website': 'website',
  'website url': 'website',
  'website_url': 'website',
  'url': 'website',
  'domain': 'website',
  'company website': 'website',
  'web': 'website',
  // industry
  'industry': 'industry',
  'sector': 'industry',
  'category': 'industry',
  'business type': 'industry',
  // notes
  'notes': 'notes',
  'note': 'notes',
  'description': 'notes',
  'comments': 'notes',
  // estimated_value
  'value': 'estimated_value',
  'deal value': 'estimated_value',
  'estimated value': 'estimated_value',
  'revenue': 'estimated_value',
  'mrr': 'estimated_value',
  // company_size
  'company size': 'company_size',
  'company_size': 'company_size',
  'employees': 'company_size',
  'size': 'company_size',
  '# employees': 'company_size',
};

const SOURCE_OPTIONS = [
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'apollo', label: 'Apollo' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'cold_outreach', label: 'Cold Outreach List' },
  { value: 'referral', label: 'Referral List' },
  { value: 'other', label: 'Other' },
];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v.trim())) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

type Step = 'upload' | 'map' | 'review' | 'importing' | 'done';

export default function CSVImportModal({
  isOpen,
  onClose,
  agencyId,
  onImportComplete,
  theme: themeProp,
  apiBase,
}: CSVImportModalProps) {
  // Use provided theme or fall back to admin dark theme
  const theme = themeProp || ADMIN_DARK_THEME;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [defaultSource, setDefaultSource] = useState('csv_import');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Track first/last name columns for combining
  const [firstNameCol, setFirstNameCol] = useState<string | null>(null);
  const [lastNameCol, setLastNameCol] = useState<string | null>(null);

  // Determine if we're in admin mode
  const isAdminMode = Boolean(apiBase);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({});
    setDefaultSource('csv_import');
    setImporting(false);
    setResult(null);
    setError('');
    setFirstNameCol(null);
    setLastNameCol(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum 5MB.');
      return;
    }

    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0 || rows.length === 0) {
        setError('Could not parse CSV. Make sure it has headers and data rows.');
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map columns
      const mapping: Record<string, string> = {};
      let fnCol: string | null = null;
      let lnCol: string | null = null;

      headers.forEach(header => {
        const normalized = header.toLowerCase().trim();
        const match = AUTO_MAP[normalized];
        if (match === '_first_name') {
          fnCol = header;
        } else if (match === '_last_name') {
          lnCol = header;
        } else if (match) {
          // Only map if not already mapped (first match wins)
          if (!Object.values(mapping).includes(header)) {
            mapping[match] = header;
          }
        }
      });

      // If we found first/last name but no full contact_name, we'll combine them
      if (fnCol && !mapping['contact_name']) {
        setFirstNameCol(fnCol);
        setLastNameCol(lnCol);
        mapping['contact_name'] = fnCol; // Will be combined during import
      }

      setColumnMapping(mapping);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (leadField: string, csvColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [leadField]: csvColumn || '',
    }));
  };

  const getMappedPreview = (row: Record<string, string>) => {
    const preview: Record<string, string> = {};
    for (const [dbField, csvCol] of Object.entries(columnMapping)) {
      if (csvCol && row[csvCol]) {
        let value = row[csvCol];
        // Combine first + last name
        if (dbField === 'contact_name' && firstNameCol && lastNameCol && csvCol === firstNameCol) {
          value = `${row[firstNameCol] || ''} ${row[lastNameCol] || ''}`.trim();
        }
        preview[dbField] = value;
      }
    }
    return preview;
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');

    try {
      // Smart auth: admin uses admin_token, agency uses auth_token
      const token = isAdminMode
        ? localStorage.getItem('admin_token')
        : localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      // Pre-process rows: combine first+last name if needed
      const processedRows = csvRows.map(row => {
        const processed = { ...row };
        if (firstNameCol && lastNameCol && columnMapping['contact_name'] === firstNameCol) {
          processed[firstNameCol] = `${row[firstNameCol] || ''} ${row[lastNameCol] || ''}`.trim();
        }
        return processed;
      });

      // Build URL: admin mode uses apiBase, agency mode uses standard route
      const importUrl = apiBase
        ? `${backendUrl}${apiBase}/leads/import`
        : `${backendUrl}/api/agency/${agencyId}/leads/import`;

      // Build body
      const bodyPayload: any = {
        leads: processedRows,
        columnMapping,
        defaultSource,
        userId: user.id,
      };

      // Admin mode: no agencyId needed — backend inserts with agency_id: null

      const response = await fetch(importUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
      setStep('done');
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const hasRequiredMapping = Boolean(columnMapping['business_name'] || columnMapping['contact_name']);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={handleClose}
      />

      <div
        className="relative w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
        style={{ backgroundColor: theme.bg || '#0a0a0a', border: `1px solid ${theme.border}` }}
      >
        {/* Drag handle mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: theme.primary15 || 'rgba(59,130,246,0.15)' }}
            >
              <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.primary || '#3b82f6' }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
                Import Leads from CSV
              </h2>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {step === 'upload' && 'Upload your CSV file'}
                {step === 'map' && `${csvRows.length} rows found — map columns`}
                {step === 'review' && 'Review before importing'}
                {step === 'importing' && 'Importing...'}
                {step === 'done' && 'Import complete'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 transition-colors"
            style={{ color: theme.textMuted }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div
              className="mb-4 rounded-xl p-3 text-sm flex items-center gap-2"
              style={{ backgroundColor: theme.errorBg || 'rgba(239,68,68,0.1)', border: `1px solid ${theme.errorBorder || 'rgba(239,68,68,0.2)'}`, color: theme.error || '#ef4444' }}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ============ STEP 1: UPLOAD ============ */}
          {step === 'upload' && (
            <div>
              <div
                className="rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors"
                style={{ border: `2px dashed ${theme.border}`, backgroundColor: theme.hover || 'rgba(255,255,255,0.02)' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3" style={{ color: theme.textMuted }} />
                <p className="font-medium text-sm mb-1" style={{ color: theme.text }}>
                  Drop your CSV here or click to browse
                </p>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  Supports .csv files up to 5MB (max 500 rows)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: theme.hover || 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: theme.info || '#60a5fa' }} />
                  <div className="text-xs" style={{ color: theme.textMuted }}>
                    <p className="font-medium mb-1" style={{ color: theme.text }}>Tips for best results:</p>
                    <p>• Export from Apollo, LinkedIn, or any CRM as CSV</p>
                    <p>• First row should be column headers</p>
                    <p>• At minimum, include a business name or contact name column</p>
                    <p>• Duplicate emails already in your CRM will be skipped</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ STEP 2: MAP COLUMNS ============ */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: theme.text }}>
                  Map your CSV columns to lead fields
                </p>
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: theme.primary15 || 'rgba(59,130,246,0.15)', color: theme.primary || '#3b82f6' }}>
                  {csvRows.length} rows
                </span>
              </div>

              {/* Source selector */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: theme.textMuted }}>
                  Lead Source (applied to all imported leads)
                </label>
                <select
                  value={defaultSource}
                  onChange={(e) => setDefaultSource(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: theme.input || theme.hover, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }}
                >
                  {SOURCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Column mapping */}
              <div className="space-y-2">
                {LEAD_FIELDS.map(field => (
                  <div
                    key={field.key}
                    className="flex items-center gap-3 rounded-lg p-3"
                    style={{ backgroundColor: theme.hover || 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: theme.text }}>
                        {field.label}
                        {field.required && <span style={{ color: theme.error || '#ef4444' }}> *</span>}
                      </p>
                    </div>
                    <ArrowLeft className="h-4 w-4 shrink-0" style={{ color: theme.textMuted }} />
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ backgroundColor: theme.input || theme.hover, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }}
                    >
                      <option value="">— Skip —</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* First + Last name notice */}
              {firstNameCol && lastNameCol && columnMapping['contact_name'] === firstNameCol && (
                <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.infoBg || 'rgba(96,165,250,0.1)', border: `1px solid ${theme.infoBorder || 'rgba(96,165,250,0.2)'}` }}>
                  <Info className="h-4 w-4 shrink-0" style={{ color: theme.info || '#60a5fa' }} />
                  <p className="text-xs" style={{ color: theme.info || '#60a5fa' }}>
                    First Name + Last Name columns will be combined into Contact Name
                  </p>
                </div>
              )}

              {!hasRequiredMapping && (
                <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.warningBg || 'rgba(245,158,11,0.1)', border: `1px solid ${theme.warningBorder || 'rgba(245,158,11,0.2)'}` }}>
                  <AlertCircle className="h-4 w-4 shrink-0" style={{ color: theme.warning || '#f59e0b' }} />
                  <p className="text-xs" style={{ color: theme.warning || '#f59e0b' }}>
                    Map at least Business Name or Contact Name to continue
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============ STEP 3: REVIEW ============ */}
          {step === 'review' && (
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: theme.text }}>
                Preview (first 5 rows)
              </p>

              <div className="space-y-2">
                {csvRows.slice(0, 5).map((row, idx) => {
                  const preview = getMappedPreview(row);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg p-3"
                      style={{ backgroundColor: theme.hover || 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.primary15 || 'rgba(59,130,246,0.15)', color: theme.primary || '#3b82f6' }}>
                          {idx + 1}
                        </span>
                        <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
                          {preview.business_name || preview.contact_name || 'Unnamed'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: theme.textMuted }}>
                        {preview.contact_name && <span>👤 {preview.contact_name}</span>}
                        {preview.email && <span>✉️ {preview.email}</span>}
                        {preview.phone && <span>📞 {preview.phone}</span>}
                        {preview.industry && <span>🏢 {preview.industry}</span>}
                        {preview.website && <span>🌐 {preview.website}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {csvRows.length > 5 && (
                <p className="text-xs text-center" style={{ color: theme.textMuted }}>
                  ...and {csvRows.length - 5} more rows
                </p>
              )}

              <div className="rounded-xl p-4" style={{ backgroundColor: theme.primary15 || 'rgba(59,130,246,0.15)', border: `1px solid ${theme.primary30 || 'rgba(59,130,246,0.3)'}` }}>
                <p className="text-sm font-medium" style={{ color: theme.primary || '#3b82f6' }}>
                  Ready to import {csvRows.length} leads
                </p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                  Source: {SOURCE_OPTIONS.find(s => s.value === defaultSource)?.label || defaultSource}
                  {' · '}All leads will be set to "New" status
                  {' · '}Duplicate emails will be skipped
                </p>
              </div>
            </div>
          )}

          {/* ============ STEP 4: IMPORTING ============ */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: theme.primary || '#3b82f6' }} />
              <p className="font-medium" style={{ color: theme.text }}>Importing {csvRows.length} leads...</p>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>This may take a moment</p>
            </div>
          )}

          {/* ============ STEP 5: DONE ============ */}
          {step === 'done' && result && (
            <div className="py-8 text-center">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4"
                style={{ backgroundColor: theme.primary15 || 'rgba(59,130,246,0.15)' }}
              >
                <CheckCircle className="h-8 w-8" style={{ color: theme.primary || '#3b82f6' }} />
              </div>
              <p className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
                {result.imported} lead{result.imported !== 1 ? 's' : ''} imported
              </p>
              {result.duplicates > 0 && (
                <p className="text-sm" style={{ color: theme.warning || '#f59e0b' }}>
                  {result.duplicates} duplicate{result.duplicates !== 1 ? 's' : ''} skipped
                </p>
              )}
              {result.errors && result.errors.length > 0 && result.errors.length <= 10 && (
                <div className="mt-4 text-left max-h-32 overflow-y-auto rounded-lg p-3" style={{ backgroundColor: theme.hover || 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
                  {result.errors.map((err: any, idx: number) => (
                    <p key={idx} className="text-xs mb-1" style={{ color: theme.textMuted }}>
                      Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2"
          style={{ borderTop: `1px solid ${theme.border}`, backgroundColor: theme.bg || '#0a0a0a' }}
        >
          {step === 'upload' && (
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-medium"
              style={{ backgroundColor: theme.hover || 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border}`, color: theme.textMuted }}
            >
              Cancel
            </button>
          )}

          {step === 'map' && (
            <>
              <button
                onClick={() => { setStep('upload'); reset(); }}
                className="flex-1 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-medium"
                style={{ backgroundColor: theme.hover || 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border}`, color: theme.textMuted }}
              >
                Back
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={!hasRequiredMapping}
                className="flex-[1.3] flex items-center justify-center gap-2 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: theme.primary || '#3b82f6', color: theme.primaryText || '#ffffff' }}
              >
                Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button
                onClick={() => setStep('map')}
                className="flex-1 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-medium"
                style={{ backgroundColor: theme.hover || 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border}`, color: theme.textMuted }}
              >
                Back
              </button>
              <button
                onClick={() => { setStep('importing'); handleImport(); }}
                disabled={importing}
                className="flex-[1.3] flex items-center justify-center gap-2 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-medium"
                style={{ backgroundColor: theme.primary || '#3b82f6', color: theme.primaryText || '#ffffff' }}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import {csvRows.length} Leads
              </button>
            </>
          )}

          {step === 'done' && (
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-medium"
              style={{ backgroundColor: theme.primary || '#3b82f6', color: theme.primaryText || '#ffffff' }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}