import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { buildAuthorizeUrl, generateChallenge, generateVerifier } from './pkce'

const AUTH_URL = import.meta.env.VITE_AUTH_URL as string
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID as string
const TOKEN_KEY = 'admin_access_token'

function redirectUri(): string {
  return `${window.location.origin}/callback`
}

interface AuthContextValue {
  accessToken: string | null
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => void
  handleCallback: (code: string, state: string) => Promise<void>
  clearToken: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY))

  const login = useCallback(async () => {
    const verifier = generateVerifier()
    const challenge = await generateChallenge(verifier)
    const state = generateVerifier().slice(0, 24)
    sessionStorage.setItem('pkce_verifier', verifier)
    sessionStorage.setItem('pkce_state', state)
    window.location.href = buildAuthorizeUrl({
      authUrl: AUTH_URL,
      clientId: CLIENT_ID,
      redirectUri: redirectUri(),
      challenge,
      state,
    })
  }, [])

  const handleCallback = useCallback(async (code: string, returnedState: string) => {
    const verifier = sessionStorage.getItem('pkce_verifier')
    const expectedState = sessionStorage.getItem('pkce_state')
    sessionStorage.removeItem('pkce_verifier')
    sessionStorage.removeItem('pkce_state')

    if (!verifier) throw new Error('No PKCE verifier found — restart login.')
    if (!expectedState || expectedState !== returnedState) {
      throw new Error('State mismatch — possible CSRF. Restart login.')
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: CLIENT_ID,
      code_verifier: verifier,
    })
    const res = await fetch(`${AUTH_URL}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)

    const tokens = (await res.json()) as { access_token: string }
    sessionStorage.setItem(TOKEN_KEY, tokens.access_token)
    setAccessToken(tokens.access_token)
  }, [])

  const clearToken = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setAccessToken(null)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    window.location.href =
      `${AUTH_URL}/oauth2/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`
  }, [clearToken])

  const value = useMemo<AuthContextValue>(
    () => ({ accessToken, isAuthenticated: !!accessToken, login, logout, handleCallback, clearToken }),
    [accessToken, login, logout, handleCallback, clearToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
