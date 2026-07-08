import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Callback() {
  const { handleCallback } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const code = params.get('code')
    const state = params.get('state')
    if (!code || !state) {
      setError('Missing code/state in callback URL.')
      return
    }
    handleCallback(code, state)
      .then(() => navigate('/', { replace: true }))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [params, handleCallback, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      {error ? (
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <a href="/" className="mt-4 inline-block text-sm text-slate-900 underline">
            Back to start
          </a>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Signing you in…</p>
      )}
    </div>
  )
}
