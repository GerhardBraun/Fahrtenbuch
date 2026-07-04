import { useEffect, useState } from 'react'
import {
  computeEinzelfahrt,
  computeEtappe,
  estimateDauerMin,
  findWerte,
  findZiel,
  findZielZweck,
  mitHistorieEintrag,
  newId,
  resolveKmEingabe,
  zielText,
} from '../logic'
import { ortVorschlaege, strasseVorschlaege, zweckVorschlaege, type Vorschlag } from '../suggestions'
import { nowTime, today } from '../timeUtils'
import type { Etappe, FahrzeugId, Historie, KmStaende, Ziel, ZielZweck } from '../types'
import { leereZielWerte, ZUHAUSE } from '../types'
import Autocomplete from './Autocomplete'
import { AutoIcon, RadIcon } from './Icons'

interface Props {
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  historie: Historie
  kmStaende: KmStaende
  etappen: Etappe[]
  onSave: (etappen: Etappe[]) => Promise<void>
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
  onHistorieChange: (historie: Historie) => Promise<void>
}

type Modus = 'einzel' | 'etappe'

function offenerStandort(etappen: Etappe[], fahrzeug: FahrzeugId): Etappe | null {
  const relevante = etappen.filter((e) => e.fahrzeug === fahrzeug)
  if (relevante.length === 0) return null
  const letzte = relevante[relevante.length - 1]
  return letzte.ziel === ZUHAUSE ? null : letzte
}

export default function FahrtForm({
  ziele,
  zieleZweck,
  historie,
  kmStaende,
  etappen,
  onSave,
  onZieleChange,
  onZieleZweckChange,
  onHistorieChange,
}: Props) {
  const [modus, setModus] = useState<Modus>('einzel')
  const [fahrzeug, setFahrzeug] = useState<FahrzeugId>('Rad')
  const [datum, setDatum] = useState(today())
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
  const kmVorschau = kmStandEnde.trim() ? resolveKmEingabe(kmStandEnde, lastKmStand) : null

  useEffect(() => {
    if (modus === 'etappe') {
      setAbfahrt(standort ? standort.ankunft : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fahrzeug, modus])

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
    setZurueck(false)
  }

  function wechsleModus(neuerModus: Modus) {
    setModus(neuerModus)
    resetForm()
  }

  async function speichern(dienstlich: boolean) {
    setMeldung('')
    const kmEnde = resolveKmEingabe(kmStandEnde, lastKmStand)

    if (modus === 'einzel') {
      if (!ort.trim() || !zweck.trim() || !abfahrt || !ankunft || !kmStandEnde) {
        setMeldung('Bitte alle Felder ausfüllen.')
        return
      }
      if (Number.isNaN(kmEnde) || kmEnde <= lastKmStand) {
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
        dienstlich,
      })
      await onSave(neue)
      resetForm()
      setMeldung('Fahrt gespeichert.')
    } else {
      const ziel = zurueck ? ZUHAUSE : zielText(ort, strasse)
      const zweckText = zurueck ? 'Rückfahrt' : zweck.trim()

      if (!ziel || !zweckText || !abfahrt || !ankunft || !kmStandEnde) {
        setMeldung('Bitte alle Felder ausfüllen.')
        return
      }
      if (Number.isNaN(kmEnde) || kmEnde <= lastKmStand) {
        setMeldung(`km-Stand muss größer als der letzte Stand (${lastKmStand}) sein.`)
        return
      }
      const werte = zurueck ? undefined : findWerte(ziele, zieleZweck, fahrzeug, ort, strasse, zweck)
      const neue = computeEtappe({
        fahrzeug,
        datum,
        start,
        ziel,
        zweck: zweckText,
        abfahrt,
        ankunft,
        kmStandEnde: kmEnde,
        lastKmStand,
        werte,
        dienstlich,
      })
      await onSave([neue])
      resetForm()
      setMeldung(zurueck ? 'Rückfahrt gespeichert.' : 'Etappe gespeichert.')
    }
  }

  function berechneEinwegWerte() {
    const kmEnde = resolveKmEingabe(kmStandEnde, lastKmStand)
    const roundTripKm = kmEnde > lastKmStand ? kmEnde - lastKmStand : 0
    const km = Math.ceil(roundTripKm / 2)
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

  const zielfelderAusblenden = modus === 'etappe' && zurueck

  return (
    <div className="form">
      <h2>Fahrt erfassen</h2>

      <div className="modus-zeile">
        <div className="modus-toggle">
          <button type="button" className={modus === 'einzel' ? 'active' : ''} onClick={() => wechsleModus('einzel')}>
            Einzelfahrt
          </button>
          <button type="button" className={modus === 'etappe' ? 'active' : ''} onClick={() => wechsleModus('etappe')}>
            Etappe
          </button>
        </div>
        <div className="fahrzeug-icons">
          <button
            type="button"
            className={fahrzeug === 'Rad' ? 'active' : ''}
            title="Fahrrad"
            aria-label="Fahrrad"
            onClick={() => setFahrzeug('Rad')}
          >
            <RadIcon />
          </button>
          <button
            type="button"
            className={fahrzeug === 'Auto' ? 'active' : ''}
            title="Auto"
            aria-label="Auto"
            onClick={() => setFahrzeug('Auto')}
          >
            <AutoIcon />
          </button>
        </div>
      </div>

      {modus === 'etappe' && (
        <>
          <p className="info">
            Start: <strong>{start}</strong>
          </p>
          <label className="checkbox">
            <input type="checkbox" checked={zurueck} onChange={(e) => setZurueck(e.target.checked)} />
            Zurück nach Hause
          </label>
        </>
      )}

      {!zielfelderAusblenden && (
        <>
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
        </>
      )}

      <label>
        Datum
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
      </label>

      <div className="zeit-zeile">
        <label>
          Abfahrtszeit
          <input type="time" value={abfahrt} onChange={(e) => setAbfahrt(e.target.value)} />
        </label>
        <label>
          Ankunftszeit
          <input type="time" value={ankunft} onChange={(e) => setAnkunft(e.target.value)} />
        </label>
      </div>

      <label>
        km-Stand (nach der Fahrt)
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={kmStandEnde}
          onChange={(e) => setKmStandEnde(e.target.value)}
          placeholder={`zuletzt: ${lastKmStand}`}
        />
        {kmVorschau !== null && !Number.isNaN(kmVorschau) && String(kmVorschau) !== kmStandEnde.trim() && (
          <span className="km-vorschau">→ {kmVorschau}</span>
        )}
      </label>

      {meldung && <p className="meldung">{meldung}</p>}

      <div className="segmented">
        <button type="button" className="primary" onClick={() => speichern(true)}>
          Als dienstl. speichern
        </button>
        <button type="button" onClick={() => speichern(false)}>
          Als privat speichern
        </button>
      </div>
    </div>
  )
}
