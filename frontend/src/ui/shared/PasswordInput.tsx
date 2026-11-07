import { useState } from 'react'

type PasswordInputProps = {
  id: string
  name?: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'current-password' | 'new-password'
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  title?: string
}

export default function PasswordInput({
  id,
  name = id,
  value,
  onChange,
  autoComplete,
  required = true,
  minLength,
  maxLength,
  pattern,
  title,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-control">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        aria-describedby={title ? `${id}-hint` : undefined}
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((shown) => !shown)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 5.2A11 11 0 0112 5c5 0 8.5 4 9.5 7a10.8 10.8 0 01-3.2 4.5" />
              <path d="M6.2 6.2A11 11 0 002.5 12c1 3 4.5 7 9.5 7a10.6 10.6 0 004.1-.8" />
            </>
          ) : (
            <>
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
              <circle cx="12" cy="12" r="2.5" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
