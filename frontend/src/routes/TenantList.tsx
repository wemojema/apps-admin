import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTenants, type Tenant } from '../api/tenants'
import { useAuth } from '../auth/AuthContext'

export function TenantList() {
  const { accessToken } = useAuth()
  const [tenants, setTenants] = useState<Tenant[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    listTenants(accessToken)
      .then(setTenants)
      .catch((e) => setError(String(e)))
  }, [accessToken])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <Link
          to="/tenants/new"
          className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New tenant
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!tenants && !error && <p className="mt-6 text-sm text-slate-500">Loading…</p>}

      {tenants && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">App</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Sender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.tenantId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/tenants/${encodeURIComponent(t.tenantId)}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {t.tenantId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.appName}</td>
                  <td className="px-4 py-3 text-slate-600">{t.clientId}</td>
                  <td className="px-4 py-3 text-slate-600">{t.senderEmail}</td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No tenants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
