export interface ApiClient {
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

export interface ApiReport {
  id: string;
  agencyId: string;
  clientId: string;
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
  client?: { id: string; name: string };
}

export type ApiUserRole = 'AGENCY_ADMIN' | 'AGENCY_VIEWER' | 'CLIENT_VIEWER';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  userClients: { client: { id: string; name: string } }[];
}

export interface AgencyPlanInfo {
  plan: string;
  trialEndsAt?: string | null;
  maxClients: number;
  maxUsers: number;
  usage: {
    clients: number;
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
