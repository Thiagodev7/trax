export interface ApiCompany {
  id: string;
  agencyId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reports: number;
    integrations: number;
  };
}

/** @deprecated Use ApiCompany instead */
export type ApiClient = ApiCompany;

export interface ApiReport {
  id: string;
  agencyId: string;
  companyId: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  shareToken?: string;
  periodStart?: string;
  periodEnd?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  moduleConfig: Record<string, unknown> | null;
  layoutJson: unknown;
  company?: { id: string; name: string };
  /** @deprecated Use company instead */
  client?: { id: string; name: string };
}

export type ApiUserRole = 'AGENCY_ADMIN' | 'AGENCY_VIEWER' | 'COMPANY_VIEWER';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  userCompanies: { company: { id: string; name: string } }[];
  /** @deprecated Use userCompanies */
  userClients?: { client: { id: string; name: string } }[];
}

export interface AgencyPlanInfo {
  plan: string;
  trialEndsAt?: string | null;
  maxCompanies: number;
  maxUsers: number;
  usage: {
    companies: number;
    users: number;
    integrations: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
