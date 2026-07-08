import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { getSesAccount, type SesAccountStatus } from '../api/tenants'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { accessToken, logout } = useAuth()
  const [ses, setSes] = useState<SesAccountStatus | null>(null)

  useEffect(() => {
    if (!accessToken) return
    getSesAccount(accessToken).then(setSes).catch(() => setSes(null))
  }, [accessToken])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            Wemojema Apps Admin
          </Link>
          <div className="flex items-center gap-4">
            {ses && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  ses.productionAccessEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
                title={`Enforcement: ${ses.enforcementStatus} · rate ${ses.maxSendRate}/s`}
              >
                SES: {ses.productionAccessEnabled ? 'Production' : 'Sandbox'} ·{' '}
                {ses.sentLast24Hours}/{ses.max24HourSend} sent
              </span>
            )}
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
