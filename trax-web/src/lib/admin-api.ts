import { auth } from '@/lib/auth'
import { getPublicApiBaseUrl } from '@/lib/api-base-url'
import { getBaseDomain, tenantDisplayUrl } from '@/lib/domains'

const SERVER_API_URL = process.env.API_URL ?? 'http://api:3000'

export const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  STARTER: 'Starter',
  PRO: 'Pro',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
}

export const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  STARTER: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  PRO: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  AGENCY: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  ENTERPRISE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

export const ROLE_LABELS: Record<string, string> = {
  AGENCY_ADMIN: 'Admin da Agência',
  AGENCY_VIEWER: 'Visualizador',
  COMPANY_VIEWER: 'Empresa',
}

export const BASE_DOMAIN = getBaseDomain()

export interface PlatformStats {
  totalAgencies: number
  activeAgencies: number
  inactiveAgencies: number
  totalUsers: number
  activeUsers: number
  totalCompanies: number
  totalReports: number
  trialsExpiringSoon: number
  expiredTrials: number
  agenciesWithIntegrations: number
  agenciesWithStripeCustomer: number
  failedSyncsLast24h: number
  agenciesByPlan: Record<string, number>
  agenciesByStatus: { active: number; inactive: number }
  recentAgencies: Array<{
    id: string
    name: string
    slug: string
    plan: string
    createdAt: string
  }>
  topAgenciesByCompanies: Array<{
    id: string
    name: string
    slug: string
    companyCount: number
  }>
}

export interface PlatformHealth {
  api: { status: 'ok' | 'error'; message?: string }
  database: { status: 'ok' | 'error'; message?: string }
  email: { configured: boolean; provider: string }
  checkedAt: string
}

export interface AgencyListItem {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  maxCompanies: number
  maxUsers: number
  trialEndsAt: string | null
  createdAt: string
  _count: { companies: number; users: number; reports: number }
}

export interface AgencyDetail extends AgencyListItem {
  customDomain: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  updatedAt: string
  _count: { companies: number; users: number; reports: number; integrations: number }
  recentIntegrationErrors: Array<{
    id: string
    provider: string
    displayName: string | null
    lastErrorMsg: string | null
    updatedAt: string
    company: { id: string; name: string }
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  agency: { id: string; name: string; slug: string }
}

export interface SuperAdminProfile {
  id: string
  email: string
  name: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AgencyCompany {
  id: string
  name: string
  email: string | null
  website: string | null
  isActive: boolean
  createdAt: string
  _count: { integrations: number; reports: number }
}

export interface AgencyIntegration {
  id: string
  provider: string
  status: string
  displayName: string | null
  externalAccount: string | null
  lastSyncAt: string | null
  lastErrorMsg: string | null
  updatedAt: string
  company: { id: string; name: string }
}

export interface DeletePreview {
  agency: { id: string; name: string; slug: string }
  counts: { users: number; companies: number; reports: number; integrations: number }
}

export interface AuditLogEntry {
  id: string
  agencyId: string | null
  actorType: string
  userId: string | null
  superAdminId: string | null
  action: string
  entityType: string
  entityId: string | null
  entityName: string | null
  description: string
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
  agency: { id: string; name: string; slug: string } | null
  user: { id: string; name: string; email: string } | null
}

export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  PUBLISH: 'Publicação',
  SYNC: 'Sincronização',
  TEST: 'Teste',
  INVITE: 'Convite',
}

export const ENTITY_LABELS: Record<string, string> = {
  AGENCY: 'Agência',
  COMPANY: 'Empresa',
  USER: 'Usuário',
  REPORT: 'Relatório',
  INTEGRATION: 'Integração',
  AUTH: 'Autenticação',
}

export const ACTOR_LABELS: Record<string, string> = {
  AGENCY_USER: 'Usuário',
  SUPER_ADMIN: 'Super Admin',
  SYSTEM: 'Sistema',
}

function getServerBaseUrl() {
  return `${SERVER_API_URL}/api/v1/super-admin`
}

function getClientBaseUrl() {
  return `${getPublicApiBaseUrl()}/api/v1/super-admin`
}

async function serverFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const session = await auth()
    const token = (session as { accessToken?: string })?.accessToken
    if (!token) return null

    const res = await fetch(`${getServerBaseUrl()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      },
      cache: 'no-store',
    })

    if (!res.ok) return null
    if (res.status === 204) return undefined as T
    return res.json()
  } catch {
    return null
  }
}

export async function adminGetStats() {
  return serverFetch<PlatformStats>('/stats')
}

export async function adminGetHealth() {
  return serverFetch<PlatformHealth>('/health')
}

export async function adminListAgencies(params: {
  page?: number
  limit?: number
  search?: string
  plan?: string
  isActive?: boolean
}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.search) qs.set('search', params.search)
  if (params.plan) qs.set('plan', params.plan)
  if (params.isActive !== undefined) qs.set('isActive', String(params.isActive))
  return serverFetch<PaginatedResponse<AgencyListItem>>(`/agencies?${qs}`)
}

export async function adminGetAgency(id: string) {
  return serverFetch<AgencyDetail>(`/agencies/${id}`)
}

export async function adminGetAgencyUsers(id: string, page = 1) {
  return serverFetch<PaginatedResponse<AdminUser>>(
    `/agencies/${id}/users?page=${page}&limit=20`,
  )
}

export async function adminGetAgencyCompanies(id: string) {
  return serverFetch<AgencyCompany[]>(`/agencies/${id}/companies`)
}

export async function adminGetAgencyIntegrations(id: string) {
  return serverFetch<AgencyIntegration[]>(`/agencies/${id}/integrations`)
}

export async function adminGetDeletePreview(id: string) {
  return serverFetch<DeletePreview>(`/agencies/${id}/delete-preview`)
}

export async function adminListUsers(params: {
  page?: number
  search?: string
  agencyId?: string
  role?: string
  isActive?: boolean
}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  qs.set('limit', '20')
  if (params.search) qs.set('search', params.search)
  if (params.agencyId) qs.set('agencyId', params.agencyId)
  if (params.role) qs.set('role', params.role)
  if (params.isActive !== undefined) qs.set('isActive', String(params.isActive))
  return serverFetch<PaginatedResponse<AdminUser>>(`/users?${qs}`)
}

export async function adminGetProfile() {
  return serverFetch<SuperAdminProfile>('/me')
}

export async function adminListAuditLogs(params: {
  page?: number
  search?: string
  agencyId?: string
  action?: string
  entityType?: string
}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  qs.set('limit', '30')
  if (params.search) qs.set('search', params.search)
  if (params.agencyId) qs.set('agencyId', params.agencyId)
  if (params.action) qs.set('action', params.action)
  if (params.entityType) qs.set('entityType', params.entityType)
  return serverFetch<PaginatedResponse<AuditLogEntry>>(`/audit-logs?${qs}`)
}

export async function adminGetAgencyAuditLogs(id: string, page = 1) {
  return serverFetch<PaginatedResponse<AuditLogEntry>>(
    `/agencies/${id}/audit-logs?page=${page}&limit=30`,
  )
}

export function getAdminClientBaseUrl() {
  return getClientBaseUrl()
}

export function tenantUrl(slug: string) {
  return tenantDisplayUrl(slug)
}
