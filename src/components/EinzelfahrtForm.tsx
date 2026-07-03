import { useState } from 'react'
import {
  computeEinzelfahrt,
  estimateDauerMin,
  findWerte,
  findZiel,
  findZielZweck,
  mitHistorieEintrag,
  newId,
  zielText,
} from '../logic'
import { ortVorschlaege, strasseVorschlaege, zweckVorschlaege, type Vorschlag } from '../suggestions'
import { nowTime, today } from '../timeUtils'
import type { Etappe, FahrzeugId, Historie, KmStaende, Ziel, ZielZweck } from '../types'
import { FAHRZEUGE, leereZielWerte } from '../types'
import Autocomplete from './Autocomplete'

interface Props {
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  historie: Historie
  kmStaende: KmStaende
  onSave: (etappen: Etappe[]) => Promise<void>
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
  onHistorieChange: (historie: Historie) => Promise<void>
}

export default function EinzelfahrtForm({
  ziele,
  zieleZweck,
  historie,
  kmStaende,
  onSave,
  onZieleChange,
  onZieleZweckChange,
  onHistorieChange,
}: Props) {
  const [fahrzeug, setFahrzeug] = useState<FahrzeugId>('Rad')
  const [datum, setDatum] = useState(today())
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [zweck, setZweck] = useState('')
  const [abfahrt, setAbfahrt] = useState('')
  const [ankunft, setAnkunft] = useState(nowTime())
  const [kmStandEnde, setKmStandEnde] = useState('')
  const [meldung, setMeldung] = useState('')

  const lastKmStand = kmStaende[fahrzeug]

  function anwenden(v: Vorschlag) {
    if (v.ort !== undefined) setOrt(v.ort)
    if (v.strasse !== undefined) setStrasse(v.strasse)
    if (v.zweck !== undefined) setZweck(v.zweck)
  }

  function resetForm() {
    setOrt('')
    setStrasse('')
    setZweck('')
    setAbfahrt('')
    setAnkunft(nowTime())
    setKmStandEnde('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMeldung('')

    const kmEnde = Number(kmStandEnde)
    if (!ort.trim() || !zweck.trim() || !abfahrt || !ankunft || !kmStandEnde) {
      setMeldung('Bitte alle Felder ausfüllen.')
      return
    }
    if (kmEnde <= lastKmStand) {
      setMeldung(`km-Stand muss größer als der letzte Stand (${lastKmStand}) sein.`)
      return
    }

    const werte = findWerte(ziele, zieleZweck, fahrzeug, ort, strasse, zweck)
    const neue = computeEinzelfahrt({
      fahrzeug,
      datum,
      ziel: zielText(ort, strasse),
      zweck: zweck.trim(),
      abfahrt,
      ankunft,
      kmStandEnde: kmEnde,
      lastKmStand,
      werte,
    })

    await onSave(neue)
    resetForm()
    setMeldung('Fahrt gespeichert.')
  }

  function berechneEinwegWerte() {
    const kmEnde = Number(kmStandEnde)
    const roundTripKm = kmEnde > lastKmStand ? kmEnde - lastKmStand : 0
    const km = Math.round(roundTripKm / 2)
    return { km, dauerMin: estimateDauerMin(fahrzeug, km) }
  }

  async function handleAlsZiel() {
    setMeldung('')
    if (!ort.trim()) {
      setMeldung('Bitte mindestens den Ort eintragen.')
      return
    }
    if (findZiel(ziele, ort, strasse)) {
      setMeldung('Dieses Ziel gibt es schon in der Zielliste.')
      return
    }
    const werte = leereZielWerte()
    werte[fahrzeug] = berechneEinwegWerte()
    await onZieleChange([...ziele, { id: newId('z-'), ort: ort.trim(), strasse: strasse.trim(), werte }])
    setMeldung('Als Ziel gespeichert.')
  }

  async function handleAlsZielUndZweck() {
    setMeldung('')
    if (!ort.trim() || !zweck.trim()) {
      setMeldung('Bitte Ort und Zweck eintragen.')
      return
    }
    if (findZielZweck(zieleZweck, ort, strasse, zweck)) {
      setMeldung('Diese Kombination gibt es schon in der Liste "Ziel und Zweck".')
      return
    }
    const werte = leereZielWerte()
    werte[fahrzeug] = berechneEinwegWerte()
    await onZieleZweckChange([
      ...zieleZweck,
      { id: newId('zz-'), ort: ort.trim(), strasse: strasse.trim(), zweck: zweck.trim(), werte },
    ])
    setMeldung('Als Ziel und Zweck gespeichert.')
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
        Ort
        <Autocomplete
          value={ort}
          onChange={setOrt}
          onSelect={anwenden}
          vorschlaege={ortVorschlaege(historie, ziele, zieleZweck, ort)}
          onSave={() => onHistorieChange(mitHistorieEintrag(historie, 'orte', ort))}
        />
      </label>

      <label>
        Straße
        <Autocomplete
          value={strasse}
          onChange={setStrasse}
          onSelect={anwenden}
          vorschlaege={strasseVorschlaege(historie, ziele, zieleZweck, strasse)}
          onSave={() => onHistorieChange(mitHistorieEintrag(historie, 'strassen', strasse))}
        />
      </label>

      <label>
        Anlass/Zweck
        <Autocomplete
          value={zweck}
          onChange={setZweck}
          onSelect={anwenden}
          vorschlaege={zweckVorschlaege(historie, zieleZweck, zweck)}
          onSave={() => onHistorieChange(mitHistorieEintrag(historie, 'zwecke', zweck))}
        />
      </label>

      <div className="segmented">
        <button type="button" onClick={handleAlsZiel}>
          Als Ziel speichern
        </button>
        <button type="button" onClick={handleAlsZielUndZweck}>
          Als Ziel und Zweck speichern
        </button>
      </div>

      <label>
        Datum
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
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
