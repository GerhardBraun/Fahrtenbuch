import { useEffect, useMemo, useState } from 'react'
import { computeEtappe, findRoute, zielText } from '../logic'
import { nowTime, today } from '../timeUtils'
import type { Etappe, FahrzeugId, KmStaende, Route } from '../types'
import { FAHRZEUGE, ZUHAUSE } from '../types'

interface Props {
  routen: Route[]
  kmStaende: KmStaende
  etappen: Etappe[]
  onSave: (etappen: Etappe[]) => Promise<void>
}

function offenerStandort(etappen: Etappe[], fahrzeug: FahrzeugId): Etappe | null {
  const relevante = etappen.filter((e) => e.fahrzeug === fahrzeug)
  if (relevante.length === 0) return null
  const letzte = relevante[relevante.length - 1]
  return letzte.ziel === ZUHAUSE ? null : letzte
}

export default function EtappenForm({ routen, kmStaende, etappen, onSave }: Props) {
  const [fahrzeug, setFahrzeug] = useState<FahrzeugId>('Rad')
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [zweck, setZweck] = useState('')
  const [abfahrt, setAbfahrt] = useState('')
  const [ankunft, setAnkunft] = useState(nowTime())
  const [kmStandEnde, setKmStandEnde] = useState('')
  const [zurueck, setZurueck] = useState(false)
  const [meldung, setMeldung] = useState('')

  const standort = offenerStandort(etappen, fahrzeug)
  const start = standort ? standort.ziel : ZUHAUSE
  const lastKmStand = kmStaende[fahrzeug]

  const orte = useMemo(() => [...new Set(routen.map((r) => r.ort))], [routen])
  const strassen = useMemo(() => {
    const treffer = routen.filter((r) => r.ort.trim().toLowerCase() === ort.trim().toLowerCase())
    const quelle = treffer.length > 0 ? treffer : routen
    return [...new Set(quelle.map((r) => r.strasse))]
  }, [routen, ort])

  function handleOrtChange(value: string) {
    setOrt(value)
    if (!strasse) {
      const treffer = routen.filter((r) => r.ort.trim().toLowerCase() === value.trim().toLowerCase())
      if (treffer.length === 1) setStrasse(treffer[0].strasse)
    }
  }

  useEffect(() => {
    setAbfahrt(standort ? standort.ankunft : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fahrzeug])

  function resetForm() {
    setOrt('')
    setStrasse('')
    setZweck('')
    setAnkunft(nowTime())
    setKmStandEnde('')
    setZurueck(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMeldung('')

    const kmEnde = Number(kmStandEnde)
    const ziel = zurueck ? ZUHAUSE : zielText(ort, strasse)
    const zweckText = zurueck ? 'Rückfahrt' : zweck.trim()

    if (!ziel || !zweckText || !abfahrt || !ankunft || !kmStandEnde) {
      setMeldung('Bitte alle Felder ausfüllen.')
      return
    }
    if (kmEnde <= lastKmStand) {
      setMeldung(`km-Stand muss größer als der letzte Stand (${lastKmStand}) sein.`)
      return
    }

    const route = zurueck ? undefined : findRoute(routen, ort, strasse)
    const neue = computeEtappe({
      fahrzeug,
      datum: today(),
      start,
      ziel,
      zweck: zweckText,
      abfahrt,
      ankunft,
      kmStandEnde: kmEnde,
      lastKmStand,
      route,
    })

    await onSave([neue])
    resetForm()
    setMeldung(zurueck ? 'Rückfahrt gespeichert.' : 'Etappe gespeichert.')
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Etappe erfassen</h2>
      <p className="hinweis">Für Fahrten mit mehreren Zielen nacheinander.</p>

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

      <p className="info">
        Start: <strong>{start}</strong>
      </p>

      <label className="checkbox">
        <input type="checkbox" checked={zurueck} onChange={(e) => setZurueck(e.target.checked)} />
        Zurück nach Hause
      </label>

      {!zurueck && (
        <>
          <label>
            Ort
            <input list="orte-liste-etappe" value={ort} onChange={(e) => handleOrtChange(e.target.value)} />
            <datalist id="orte-liste-etappe">
              {orte.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </label>

          <label>
            Straße
            <input list="strassen-liste-etappe" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
            <datalist id="strassen-liste-etappe">
              {strassen.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <label>
            Anlass/Zweck
            <input value={zweck} onChange={(e) => setZweck(e.target.value)} />
          </label>
        </>
      )}

      <label>
        Abfahrtszeit
        <input type="time" value={abfahrt} onChange={(e) => setAbfahrt(e.target.value)} />
      </label>

      <label>
        Ankunftszeit
        <input type="time" value={ankunft} onChange={(e) => setAnkunft(e.target.value)} />
      </label>

      <label>
        km-Stand (nach dieser Etappe)
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
        Etappe speichern
      </button>
    </form>
  )
}
