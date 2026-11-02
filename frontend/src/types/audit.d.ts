export type AuditIssueSeverity = 'critical' | 'warning' | 'passed';

export type AuditCategory = 'seo' | 'performance' | 'accessibility';

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: AuditIssueSeverity;
  category: AuditCategory;
  displayValue?: string | null;
}

export interface AuditCategoryMetrics {
  score: number;
  critical: number;
  warnings: number;
}

export interface AuditSummary {
  critical: number;
  warnings: number;
  passed: number;
}

export interface ProjectAuditResult {
  projectId: string;
  url: string;
  strategy: 'mobile' | 'desktop';
  status: 'completed' | 'failed';
  crawledAt: string;
  healthScore: number;
  summary: AuditSummary;
  categories: {
    onPage: AuditCategoryMetrics;
    performance: AuditCategoryMetrics;
    accessibility: AuditCategoryMetrics;
  };
  issues: AuditIssue[];
  fromCache?: boolean;
}

/**
 * Google PageSpeed Insights (PSI) API subset definitions
 */
export interface LighthouseAuditRef {
  id: string;
  weight?: number;
  group?: string;
  acronym?: string;
  relevantAudits?: string[];
}

export interface LighthouseAudit {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  scoreDisplayMode?: 'binary' | 'numeric' | 'manual' | 'informative' | 'notApplicable' | 'error';
  displayValue?: string;
  explanation?: string;
  errorMessage?: string;
  warnings?: any[];
  details?: Record<string, any>;
}

export interface LighthouseCategory {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  auditRefs: LighthouseAuditRef[];
}

export interface LighthouseResult {
  lighthouseVersion?: string;
  userAgent?: string;
  fetchTime?: string;
  requestedUrl?: string;
  finalUrl?: string;
  categories: {
    performance?: LighthouseCategory;
    accessibility?: LighthouseCategory;
    seo?: LighthouseCategory;
    [key: string]: LighthouseCategory | undefined;
  };
  audits: {
    [auditId: string]: LighthouseAudit;
  };
}

export interface PageSpeedApiResponse {
  captchaResult?: string;
  kind?: string;
  id?: string;
  loadingExperience?: {
    id?: string;
    metrics?: Record<string, any>;
    overall_category?: string;
    initial_url?: string;
  };
  lighthouseResult: LighthouseResult;
  analysisUTCTimestamp?: string;
}
