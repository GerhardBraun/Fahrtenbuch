import { useState } from 'react'
import type { Vorschlag } from '../suggestions'

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (vorschlag: Vorschlag) => void
  vorschlaege: Vorschlag[]
  placeholder?: string
  onSave?: () => void
}

export default function Autocomplete({ value, onChange, onSelect, vorschlaege, placeholder, onSave }: Props) {
  const [offen, setOffen] = useState(false)

  return (
    <div className="autocomplete">
      <div className="autocomplete-zeile">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setOffen(true)
          }}
          onFocus={() => setOffen(true)}
          onBlur={() => setTimeout(() => setOffen(false), 150)}
        />
        {onSave && (
          <button
            type="button"
            className="save-btn"
            title="Wert in Vorschlagsliste speichern"
            aria-label="Wert in Vorschlagsliste speichern"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSave}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M5 3h11l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 3v6h8V3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 21v-8h10v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      {offen && vorschlaege.length > 0 && (
        <ul className="autocomplete-liste">
          {vorschlaege.map((v) => (
            <li
              key={v.label}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(v)
                setOffen(false)
              }}
            >
              {v.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
