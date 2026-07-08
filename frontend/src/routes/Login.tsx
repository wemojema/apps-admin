const AUTH_URL = import.meta.env.VITE_AUTH_URL as string

export function Login() {
  const params = new URLSearchParams(window.location.search)
  const hasError = params.has('error')
  const next = params.get('next') ?? ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-xl font-semibold text-slate-900">Wemojema Apps Admin</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Sign in to continue.</p>

        {/* Native form POST — the auth server validates, then redirects back to /oauth2/authorize */}
        <form
          action={`${AUTH_URL}/login`}
          method="POST"
          className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {next && <input type="hidden" name="next" value={next} />}
          {hasError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Incorrect email or password.</p>
          )}
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</span>
            <input
              name="username"
              type="email"
              required
              autoFocus
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
