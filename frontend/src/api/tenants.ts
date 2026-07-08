import { apiFetch } from './client'

export interface Tenant {
  tenantId: string
  appName: string
  frontendUrl: string
  senderEmail: string
  senderName: string
  clientId: string
  clientRedirectUri: string
}

export interface TenantStatus {
  tenantId: string
  senderDomain: string | null
  dkimStatus: string
  verifiedForSending: boolean
}

export interface SesAccountStatus {
  productionAccessEnabled: boolean
  enforcementStatus: string
  max24HourSend: number
  maxSendRate: number
  sentLast24Hours: number
}

const enc = encodeURIComponent

export const listTenants = (token: string) => apiFetch<Tenant[]>('/api/v1/tenants', { token })

export const getTenant = (token: string, id: string) =>
  apiFetch<Tenant>(`/api/v1/tenants/${enc(id)}`, { token })

export const putTenant = (token: string, id: string, body: Tenant) =>
  apiFetch<Tenant>(`/api/v1/tenants/${enc(id)}`, { method: 'PUT', body: JSON.stringify(body), token })

export const deleteTenant = (token: string, id: string) =>
  apiFetch<void>(`/api/v1/tenants/${enc(id)}`, { method: 'DELETE', token })

export const getTenantStatus = (token: string, id: string) =>
  apiFetch<TenantStatus>(`/api/v1/tenants/${enc(id)}/status`, { token })

export const getSesAccount = (token: string) =>
  apiFetch<SesAccountStatus>('/api/v1/account/ses', { token })
