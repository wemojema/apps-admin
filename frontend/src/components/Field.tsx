import type { ChangeEvent } from 'react'

export function Field({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
}: {
  label: string
  value: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value ?? ''}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 ${
          readOnly ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-300 bg-white'
        }`}
      />
    </label>
  )
}
