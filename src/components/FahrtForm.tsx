import { useEffect, useState } from 'react'
import {
  computeEinzelfahrt,
  computeEtappe,
  estimateDauerMin,
  findWerte,
  findZiel,
  findZielZweck,
  kombiniereOrtStrasse,
  mitHistorieEintrag,
  newId,
  newRohdatenEintrag,
  resolveKmEingabe,
  zielText,
} from '../logic'
import { ortVorschlaege, strasseVorschlaege, zweckVorschlaege, type Vorschlag } from '../suggestions'
import { addMinutes, nowTime, subMinutes, today } from '../timeUtils'
import type { Etappe, FahrzeugId, Historie, KmStaende, RohdatenEintrag, Ziel, ZielZweck } from '../types'
import { leereZielWerte, ZUHAUSE, ZUHAUSE_ORT, ZUHAUSE_STRASSE } from '../types'
import Autocomplete from './Autocomplete'
import { AutoIcon, RadIcon, SaveIcon } from './Icons'

interface Props {
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  historie: Historie
  kmStaende: KmStaende
  etappen: Etappe[]
  onSave: (etappen: Etappe[]) => Promise<void>
  onSaveRohdaten: (eintrag: RohdatenEintrag) => Promise<void>
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
  onHistorieChange: (historie: Historie) => Promise<void>
}

type Modus = 'einzel' | 'etappe'

/**
 * Die zuletzt gespeicherte Etappe insgesamt (unabhängig vom Fahrzeug) – sofern sie nicht
 * zu Hause endete. Eine leere ziel (private Einzelfahrt) zählt ebenfalls als "zu Hause",
 * da sie bereits eine abgeschlossene Rundfahrt darstellt.
 */
function offenerStandort(etappen: Etappe[]): Etappe | null {
  if (etappen.length === 0) return null
  const letzte = etappen[etappen.length - 1]
  return letzte.ziel === ZUHAUSE || letzte.ziel === '' ? null : letzte
}

export default function FahrtForm({
  ziele,
  zieleZweck,
  historie,
  kmStaende,
  etappen,
  onSave,
  onSaveRohdaten,
  onZieleChange,
  onZieleZweckChange,
  onHistorieChange,
}: Props) {
  const [modus, setModus] = useState<Modus>('einzel')
  const [fahrzeug, setFahrzeug] = useState<FahrzeugId>(() => offenerStandort(etappen)?.fahrzeug ?? 'Rad')
  const [dienstlich, setDienstlich] = useState(() => offenerStandort(etappen)?.dienstlich ?? true)
  const [datum, setDatum] = useState(today())
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [zweck, setZweck] = useState('')
  const [abfahrt, setAbfahrt] = useState('')
  const [ankunft, setAnkunft] = useState(nowTime())
  const [kmStandEnde, setKmStandEnde] = useState('')
  const [zurueck, setZurueck] = useState(false)
  const [meldung, setMeldung] = useState('')
  const [speichertGerade, setSpeichertGerade] = useState(false)

  const standort = offenerStandort(etappen)
  const start = standort ? standort.ziel : ZUHAUSE
  const lastKmStand = kmStaende[fahrzeug]
  const kmVorschau = kmStandEnde.trim() ? resolveKmEingabe(kmStandEnde, lastKmStand) : null

  // Beim Fortsetzen einer Etappen-Kette Fahrzeug und dienstl./privat von der zuletzt
  // gespeicherten Etappe übernehmen (statt sie erneut auswählen zu müssen).
  useEffect(() => {
    if (modus === 'etappe' && standort) {
      setFahrzeug(standort.fahrzeug)
      setDienstlich(standort.dienstlich)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modus, standort?.id])
  const effektivZurueck = modus === 'etappe' && !!standort && zurueck

  function berechneDauerMin(): number {
    const kmEnde = resolveKmEingabe(kmStandEnde, lastKmStand)
    if (Number.isNaN(kmEnde)) return NaN
    const werte = effektivZurueck ? undefined : findWerte(ziele, zieleZweck, fahrzeug, ort, strasse, zweck)
    const strecke = werte && werte.km > 0 ? werte.km : kmEnde - lastKmStand
    return werte && werte.dauerMin > 0 ? werte.dauerMin : estimateDauerMin(fahrzeug, strecke)
  }

  const dauerVorschau = modus === 'etappe' && kmStandEnde.trim() ? berechneDauerMin() : NaN
  const ankunftVorschau =
    modus === 'etappe' && !standort && abfahrt && !Number.isNaN(dauerVorschau)
      ? addMinutes(abfahrt, dauerVorschau)
      : null
  const abfahrtVorschau =
    modus === 'etappe' && standort && ankunft && !Number.isNaN(dauerVorschau)
      ? subMinutes(ankunft, dauerVorschau)
      : null

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
    if (speichertGerade) return
    setSpeichertGerade(true)
    setDienstlich(dienstlich)
    try {
      await speichernInner(dienstlich)
    } finally {
      setSpeichertGerade(false)
    }
  }

  async function speichernInner(dienstlich: boolean) {
    setMeldung('')
    const kmEnde = resolveKmEingabe(kmStandEnde, lastKmStand)

    if (modus === 'einzel') {
      if (!abfahrt || !ankunft || !kmStandEnde) {
        setMeldung('Bitte alle Felder ausfüllen.')
        return
      }
      if (dienstlich && (!ort.trim() || !zweck.trim())) {
        setMeldung('Bitte alle Felder ausfüllen.')
        return
      }
      if (!dienstlich && !ort.trim() && !strasse.trim() && !zweck.trim()) {
        setMeldung('Bitte mindestens Ort, Straße oder Zweck ausfüllen.')
        return
      }
      if (Number.isNaN(kmEnde) || kmEnde <= lastKmStand) {
        setMeldung(`km-Stand muss größer als der letzte Stand (${lastKmStand}) sein.`)
        return
      }

      if (!dienstlich) {
        // Private Einzelfahrt: eine Etappe ohne Hin-/Rück-Aufteilung und ohne Ziel-Konsistenzprüfung.
        // Start übernimmt Ort/Straße aus der Eingabe (statt Zuhause), Ziel bleibt leer.
        const einzelne: Etappe = {
          id: newId(),
          datum,
          fahrzeug,
          start: kombiniereOrtStrasse(ort, strasse),
          ziel: '',
          zweck: zweck.trim(),
          abfahrt,
          ankunft,
          kmStand: kmEnde,
          strecke: kmEnde - lastKmStand,
          dienstlich: false,
          exportiert: false,
        }
        await onSave([einzelne])
        await onSaveRohdaten(
          newRohdatenEintrag({
            fahrzeug,
            datum,
            ort: ort.trim(),
            strasse: strasse.trim(),
            zweck: zweck.trim(),
            abfahrt,
            ankunft,
            kmStandEnde: kmEnde,
            dienstlich: false,
          }),
        )
        resetForm()
        setMeldung('Fahrt gespeichert.')
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
      await onSaveRohdaten(
        newRohdatenEintrag({
          fahrzeug,
          datum,
          ort: ort.trim(),
          strasse: strasse.trim(),
          zweck: zweck.trim(),
          abfahrt,
          ankunft,
          kmStandEnde: kmEnde,
          dienstlich,
        }),
      )
      resetForm()
      setMeldung('Fahrt gespeichert.')
    } else {
      const ziel = effektivZurueck ? ZUHAUSE : zielText(ort, strasse)
      const zweckText = effektivZurueck ? 'Rückfahrt' : zweck.trim()
      const zeitFeld = standort ? ankunft : abfahrt

      if (!ziel || !zweckText || !zeitFeld || !kmStandEnde) {
        setMeldung('Bitte alle Felder ausfüllen.')
        return
      }
      if (Number.isNaN(kmEnde) || kmEnde <= lastKmStand) {
        setMeldung(`km-Stand muss größer als der letzte Stand (${lastKmStand}) sein.`)
        return
      }
      const werte = effektivZurueck ? undefined : findWerte(ziele, zieleZweck, fahrzeug, ort, strasse, zweck)
      const neue = computeEtappe({
        fahrzeug,
        datum,
        start,
        ziel,
        zweck: zweckText,
        abfahrt: standort ? undefined : abfahrt,
        ankunft: standort ? ankunft : undefined,
        kmStandEnde: kmEnde,
        lastKmStand,
        werte,
        dienstlich,
      })
      await onSave([neue])
      await onSaveRohdaten(
        newRohdatenEintrag({
          fahrzeug,
          datum,
          ort: effektivZurueck ? ZUHAUSE_ORT : ort.trim(),
          strasse: effektivZurueck ? ZUHAUSE_STRASSE : strasse.trim(),
          zweck: zweckText,
          abfahrt: standort ? undefined : abfahrt,
          ankunft: standort ? ankunft : undefined,
          kmStandEnde: kmEnde,
          dienstlich,
        }),
      )
      resetForm()
      setMeldung(effektivZurueck ? 'Rückfahrt gespeichert.' : 'Etappe gespeichert.')
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

  const zielfelderAusblenden = effektivZurueck

  return (
    <div className="form">
      <h2>Fahrt erfassen</h2>

      <div className="modus-zeile">
        <div className="modus-toggle">
          <button type="button" className={modus === 'einzel' ? 'active' : ''} onClick={() => wechsleModus('einzel')}>
            Hin- und Rückfahrt
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
          {standort && (
            <label className="checkbox">
              <input type="checkbox" checked={zurueck} onChange={(e) => setZurueck(e.target.checked)} />
              Zurück nach Hause
            </label>
          )}
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
            <button type="button" className="icon-label" onClick={handleAlsZiel}>
              <SaveIcon /> Ziel
            </button>
            <button type="button" className="icon-label" onClick={handleAlsZielUndZweck}>
              <SaveIcon /> Ziel und Zweck
            </button>
          </div>
        </>
      )}

      <label>
        Datum
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
      </label>

      {modus === 'einzel' && (
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
      )}

      {modus === 'etappe' &&
        (standort ? (
          <label>
            Ankunftszeit
            <input type="time" value={ankunft} onChange={(e) => setAnkunft(e.target.value)} />
            {abfahrtVorschau && <span className="km-vorschau">Abfahrt (berechnet): {abfahrtVorschau}</span>}
          </label>
        ) : (
          <label>
            Abfahrtszeit
            <input type="time" value={abfahrt} onChange={(e) => setAbfahrt(e.target.value)} />
            {ankunftVorschau && <span className="km-vorschau">Ankunft (berechnet): {ankunftVorschau}</span>}
          </label>
        ))}

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
        <button
          type="button"
          className={dienstlich ? 'primary' : ''}
          onClick={() => speichern(true)}
          disabled={speichertGerade}
        >
          Als dienstl. speichern
        </button>
        <button
          type="button"
          className={!dienstlich ? 'primary' : ''}
          onClick={() => speichern(false)}
          disabled={speichertGerade}
        >
          Als privat speichern
        </button>
      </div>
    </div>
  )
}
