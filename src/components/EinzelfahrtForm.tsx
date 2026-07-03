import { useState } from 'react'
import { computeEinzelfahrt, findRoute } from '../logic'
import { nowTime, today } from '../timeUtils'
import type { Etappe, FahrzeugId, KmStaende, Route } from '../types'
import { FAHRZEUGE } from '../types'

interface Props {
  routen: Route[]
  kmStaende: KmStaende
  onSave: (etappen: Etappe[]) => Promise<void>
}

export default function EinzelfahrtForm({ routen, kmStaende, onSave }: Props) {
  const [fahrzeug, setFahrzeug] = useState<FahrzeugId>('Rad')
  const [ziel, setZiel] = useState('')
  const [zweck, setZweck] = useState('')
  const [abfahrt, setAbfahrt] = useState('')
  const [ankunft, setAnkunft] = useState(nowTime())
  const [kmStandEnde, setKmStandEnde] = useState('')
  const [meldung, setMeldung] = useState('')

  const lastKmStand = kmStaende[fahrzeug]

  function resetForm() {
    setZiel('')
    setZweck('')
    setAbfahrt('')
    setAnkunft(nowTime())
    setKmStandEnde('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMeldung('')

    const kmEnde = Number(kmStandEnde)
    if (!ziel.trim() || !zweck.trim() || !abfahrt || !ankunft || !kmStandEnde) {
      setMeldung('Bitte alle Felder ausfüllen.')
      return
    }
    if (kmEnde <= lastKmStand) {
      setMeldung(`km-Stand muss größer als der letzte Stand (${lastKmStand}) sein.`)
      return
    }

    const route = findRoute(routen, ziel)
    const neue = computeEinzelfahrt({
      fahrzeug,
      datum: today(),
      ziel: route ? `${route.ort}, ${route.strasse}` : ziel.trim(),
      zweck: zweck.trim(),
      abfahrt,
      ankunft,
      kmStandEnde: kmEnde,
      lastKmStand,
      route,
    })

    await onSave(neue)
    resetForm()
    setMeldung('Fahrt gespeichert.')
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Fahrt erfassen</h2>

      <label>
        Fahrzeug
        <div className="segmented">
          {FAHRZEUGE.map((f) => (
            <button
              type="button"
              key={f.id}
              className={fahrzeug === f.id ? 'active' : ''}
              onClick={() => setFahrzeug(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </label>

      <label>
        Ziel
        <input
          list="routen-liste"
          value={ziel}
          onChange={(e) => setZiel(e.target.value)}
          placeholder="Ort, Straße"
        />
        <datalist id="routen-liste">
          {routen.map((r) => (
            <option key={r.id} value={`${r.ort}, ${r.strasse}`}>
              {r.name}
            </option>
          ))}
        </datalist>
      </label>

      <label>
        Anlass/Zweck
        <input value={zweck} onChange={(e) => setZweck(e.target.value)} />
      </label>

      <label>
        Abfahrtszeit
        <input type="time" value={abfahrt} onChange={(e) => setAbfahrt(e.target.value)} />
      </label>

      <label>
        Ankunftszeit
        <input type="time" value={ankunft} onChange={(e) => setAnkunft(e.target.value)} />
      </label>

      <label>
        km-Stand (nach der Fahrt)
        <input
          type="number"
          inputMode="numeric"
          value={kmStandEnde}
          onChange={(e) => setKmStandEnde(e.target.value)}
          placeholder={`zuletzt: ${lastKmStand}`}
        />
      </label>

      {meldung && <p className="meldung">{meldung}</p>}

      <button type="submit" className="primary">
        Fahrt speichern
      </button>
    </form>
  )
}
