import { useMemo, useState } from 'react'
import type { Etappe } from '../types'

interface Props {
  etappen: Etappe[]
  onChange: (etappen: Etappe[]) => Promise<void>
}

type Modus = 'nachweis' | 'rohdaten'

function formatDatum(datum: string): string {
  const [j, m, t] = datum.split('-')
  return `${t}.${m}.${j}`
}

function nachweisZeilen(liste: Etappe[]): string[] {
  return liste.map((e) =>
    [formatDatum(e.datum), e.abfahrt, e.ankunft, e.start, e.ziel, e.zweck, String(e.strecke)].join('\t'),
  )
}

function mitKopf(zeilen: string[], kopfzeile: boolean, kopf: string[]): string {
  const z = [...zeilen]
  if (kopfzeile) z.unshift(kopf.join('\t'))
  return z.join('\n')
}

const NACHWEIS_KOPF = ['Datum', 'Abfahrt', 'Ankunft', 'Start', 'Ziel', 'Anlass/Zweck', 'Strecke']
const ROHDATEN_KOPF = [
  'ID',
  'Datum',
  'Fahrzeug',
  'Start',
  'Ziel',
  'Anlass/Zweck',
  'Abfahrt',
  'Ankunft',
  'km-Stand',
  'Strecke',
  'Art',
  'Exportiert',
]

export default function ExportView({ etappen, onChange }: Props) {
  const [modus, setModus] = useState<Modus>('nachweis')
  const [von, setVon] = useState('')
  const [bis, setBis] = useState('')
  const [nurNichtExportiert, setNurNichtExportiert] = useState(true)
  const [kopfzeile, setKopfzeile] = useState(false)
  const [meldung, setMeldung] = useState('')

  const gefiltertBasis = useMemo(() => {
    return etappen
      .filter((e) => modus === 'rohdaten' || e.dienstlich)
      .filter((e) => (von ? e.datum >= von : true))
      .filter((e) => (bis ? e.datum <= bis : true))
      .filter((e) => (modus === 'nachweis' && nurNichtExportiert ? !e.exportiert : true))
      .sort((a, b) => (a.datum + a.abfahrt).localeCompare(b.datum + b.abfahrt))
  }, [etappen, von, bis, nurNichtExportiert, modus])

  const radListe = useMemo(() => gefiltertBasis.filter((e) => e.fahrzeug === 'Rad'), [gefiltertBasis])
  const autoListe = useMemo(() => gefiltertBasis.filter((e) => e.fahrzeug === 'Auto'), [gefiltertBasis])
  const radText = useMemo(() => mitKopf(nachweisZeilen(radListe), kopfzeile, NACHWEIS_KOPF), [radListe, kopfzeile])
  const autoText = useMemo(() => mitKopf(nachweisZeilen(autoListe), kopfzeile, NACHWEIS_KOPF), [autoListe, kopfzeile])

  const rohdatenText = useMemo(() => {
    const zeilen = gefiltertBasis.map((e) =>
      [
        e.id,
        formatDatum(e.datum),
        e.fahrzeug,
        e.start,
        e.ziel,
        e.zweck,
        e.abfahrt,
        e.ankunft,
        String(e.kmStand),
        String(e.strecke),
        e.dienstlich ? 'dienstlich' : 'privat',
        e.exportiert ? 'ja' : 'nein',
      ].join('\t'),
    )
    return mitKopf(zeilen, kopfzeile, ROHDATEN_KOPF)
  }, [gefiltertBasis, kopfzeile])

  async function handleCopy(t: string) {
    try {
      await navigator.clipboard.writeText(t)
      setMeldung('In die Zwischenablage kopiert.')
    } catch {
      setMeldung('Kopieren nicht möglich – bitte Text manuell markieren.')
    }
  }

  async function handleMarkExportiert(liste: Etappe[]) {
    const ids = new Set(liste.map((e) => e.id))
    await onChange(etappen.map((e) => (ids.has(e.id) ? { ...e, exportiert: true } : e)))
    setMeldung('Als exportiert markiert.')
  }

  async function handleDeleteExportiert() {
    if (!confirm('Alle bereits exportierten Einträge endgültig löschen?')) return
    await onChange(etappen.filter((e) => !e.exportiert))
    setMeldung('Exportierte Einträge gelöscht.')
  }

  const anzahlExportiert = etappen.filter((e) => e.exportiert).length

  return (
    <div className="form">
      <h2>Export</h2>

      <div className="segmented">
        <button type="button" className={modus === 'nachweis' ? 'active' : ''} onClick={() => setModus('nachweis')}>
          Fahrtennachweis
        </button>
        <button type="button" className={modus === 'rohdaten' ? 'active' : ''} onClick={() => setModus('rohdaten')}>
          Rohdaten (Sicherung)
        </button>
      </div>

      {modus === 'nachweis' ? (
        <p className="hinweis">Private Fahrten werden nicht mit exportiert, getrennt nach Fahrzeug.</p>
      ) : (
        <p className="hinweis">Alle Fahrten (dienstlich und privat) mit allen Feldern, z.B. zur Sicherung in Excel.</p>
      )}

      <label>
        Von
        <input type="date" value={von} onChange={(e) => setVon(e.target.value)} />
      </label>
      <label>
        Bis
        <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} />
      </label>
      {modus === 'nachweis' && (
        <label className="checkbox">
          <input
            type="checkbox"
            checked={nurNichtExportiert}
            onChange={(e) => setNurNichtExportiert(e.target.checked)}
          />
          Nur nicht exportierte Einträge
        </label>
      )}
      <label className="checkbox">
        <input type="checkbox" checked={kopfzeile} onChange={(e) => setKopfzeile(e.target.checked)} />
        Kopfzeile einschließen
      </label>

      {modus === 'rohdaten' ? (
        <>
          <p className="hinweis">{gefiltertBasis.length} Zeile(n)</p>
          <textarea className="export-text" readOnly value={rohdatenText} rows={12} />
          <button type="button" className="primary" onClick={() => handleCopy(rohdatenText)}>
            In Zwischenablage kopieren
          </button>
        </>
      ) : (
        <>
          <h3>Rad ({radListe.length})</h3>
          <textarea className="export-text" readOnly value={radText} rows={8} />
          <div className="segmented">
            <button type="button" className="primary" onClick={() => handleCopy(radText)}>
              Kopieren
            </button>
            <button type="button" onClick={() => handleMarkExportiert(radListe)} disabled={radListe.length === 0}>
              Als exportiert markieren
            </button>
          </div>

          <h3>Auto ({autoListe.length})</h3>
          <textarea className="export-text" readOnly value={autoText} rows={8} />
          <div className="segmented">
            <button type="button" className="primary" onClick={() => handleCopy(autoText)}>
              Kopieren
            </button>
            <button type="button" onClick={() => handleMarkExportiert(autoListe)} disabled={autoListe.length === 0}>
              Als exportiert markieren
            </button>
          </div>

          <button type="button" onClick={handleDeleteExportiert} disabled={anzahlExportiert === 0}>
            Exportierte löschen ({anzahlExportiert})
          </button>
        </>
      )}

      {meldung && <p className="meldung">{meldung}</p>}
    </div>
  )
}
