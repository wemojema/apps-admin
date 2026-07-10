import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  deleteTenant,
  getTenant,
  getTenantStatus,
  provisionTenant,
  putTenant,
  type Tenant,
  type TenantStatus,
} from '../api/tenants'
import { useAuth } from '../auth/AuthContext'
import { DkimBadge } from '../components/StatusBadge'
import { Field } from '../components/Field'

const EMPTY: Tenant = {
  tenantId: '',
  appName: '',
  frontendUrl: '',
  senderEmail: '',
  senderName: '',
  clientId: '',
  clientRedirectUri: '',
}

export function TenantDetail({ mode }: { mode: 'create' | 'edit' }) {
  const { accessToken } = useAuth()
  const { tenantId: routeId } = useParams()
  const navigate = useNavigate()
  const id = mode === 'edit' ? decodeURIComponent(routeId ?? '') : null

  const [form, setForm] = useState<Tenant>(EMPTY)
  const [status, setStatus] = useState<TenantStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'edit' || !id || !accessToken) return
    getTenant(accessToken, id).then(setForm).catch((e) => setError(String(e)))
    getTenantStatus(accessToken, id).then(setStatus).catch(() => setStatus(null))
  }, [mode, id, accessToken])

  const set = (k: keyof Tenant) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!accessToken) return
    setSaving(true)
    setError(null)
    try {
      const targetId = mode === 'edit' ? id! : form.tenantId.trim()
      if (!targetId) throw new Error('Tenant host is required (e.g. foo.auth.wemojema.com).')
      await putTenant(accessToken, targetId, { ...form, tenantId: targetId })
      navigate(`/tenants/${encodeURIComponent(targetId)}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!accessToken || !id) return
    if (!window.confirm(`Delete tenant ${id}? Existing sessions expire within ~15 min.`)) return
    try {
      await deleteTenant(accessToken, id)
      navigate('/')
    } catch (e) {
      setError(String(e))
    }
  }

  async function provision() {
    if (!accessToken || !id) return
    if (
      !window.confirm(
        `Provision DNS + email for ${id}?\n\nQueues CREATE_AUTH_CNAME (auth subdomain) and PROVISION_TENANT_EMAIL (sender domain) to org-control.`,
      )
    )
      return
    setProvisioning(true)
    setProvisionMsg(null)
    setError(null)
    try {
      await provisionTenant(accessToken, id)
      setProvisionMsg('Queued. org-control will create the DNS + email records shortly.')
    } catch (e) {
      setError(String(e))
    } finally {
      setProvisioning(false)
    }
  }

  function copySnippet() {
    const tid = (mode === 'edit' ? id! : form.tenantId.trim()) || '<tenant-host>'
    const snippet = [
      '# Frontend (PKCE)',
      `VITE_AUTH_URL=https://${tid}`,
      `VITE_CLIENT_ID=${form.clientId}`,
      `# redirect_uri: ${form.clientRedirectUri}`,
      '',
      '# Backend (wemojema-auth-sdk)',
      `WEMOJEMA_AUTH_HOST=${tid}`,
    ].join('\n')
    void navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="max-w-2xl">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Tenants
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {mode === 'create' ? 'New tenant' : form.appName || id}
        </h1>
        {mode === 'edit' && status && (
          <DkimBadge status={status.dkimStatus} verified={status.verifiedForSending} />
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {provisionMsg && <p className="mt-4 text-sm text-green-600">{provisionMsg}</p>}

      <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <Field
          label="Tenant host (issuer)"
          value={mode === 'edit' ? id ?? '' : form.tenantId}
          onChange={mode === 'create' ? set('tenantId') : undefined}
          readOnly={mode === 'edit'}
          placeholder="foo.auth.wemojema.com"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="App name" value={form.appName} onChange={set('appName')} placeholder="Foo" />
          <Field label="Frontend URL" value={form.frontendUrl} onChange={set('frontendUrl')} placeholder="https://foo.com" />
          <Field label="Client id" value={form.clientId} onChange={set('clientId')} placeholder="foo-web" />
          <Field label="Redirect URI" value={form.clientRedirectUri} onChange={set('clientRedirectUri')} placeholder="https://foo.com/callback" />
          <Field label="Sender email" value={form.senderEmail} onChange={set('senderEmail')} placeholder="no-reply@foo.com" />
          <Field label="Sender name" value={form.senderName} onChange={set('senderName')} placeholder="Foo" />
        </div>
      </div>

      {mode === 'edit' && status && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-sm">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">Email (SES)</h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-2">
            <dt className="text-slate-500">Sender domain</dt>
            <dd className="text-slate-900">{status.senderDomain ?? '—'}</dd>
            <dt className="text-slate-500">DKIM status</dt>
            <dd className="text-slate-900">{status.dkimStatus}</dd>
            <dt className="text-slate-500">Verified for sending</dt>
            <dd className="text-slate-900">{status.verifiedForSending ? 'yes' : 'no'}</dd>
          </dl>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : mode === 'create' ? 'Register tenant' : 'Save changes'}
        </button>
        <button
          onClick={copySnippet}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? 'Copied!' : 'Copy integration snippet'}
        </button>
        {mode === 'edit' && (
          <button
            onClick={provision}
            disabled={provisioning}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {provisioning ? 'Provisioning…' : 'Provision DNS + email'}
          </button>
        )}
        {mode === 'edit' && (
          <button
            onClick={remove}
            className="ml-auto rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
