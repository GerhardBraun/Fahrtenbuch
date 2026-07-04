import { useState } from 'react'
import type { Vorschlag } from '../suggestions'
import { SaveIcon } from './Icons'

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
            <SaveIcon />
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
