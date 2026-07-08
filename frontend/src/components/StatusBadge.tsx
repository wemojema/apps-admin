export function DkimBadge({ status, verified }: { status: string; verified: boolean }) {
  const ok = verified && status === 'SUCCESS'
  const pending = status === 'PENDING'
  const cls = ok
    ? 'bg-emerald-100 text-emerald-700'
    : pending
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-600'
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {ok ? 'Verified' : status}
    </span>
  )
}
