import { useMemo, useState } from 'react'
import type { Etappe } from '../types'

interface Props {
  etappen: Etappe[]
  onChange: (etappen: Etappe[]) => Promise<void>
}

function formatDatum(datum: string): string {
  const [j, m, t] = datum.split('-')
  return `${t}.${m}.${j}`
}

export default function ExportView({ etappen, onChange }: Props) {
  const [von, setVon] = useState('')
  const [bis, setBis] = useState('')
  const [nurNichtExportiert, setNurNichtExportiert] = useState(true)
  const [kopfzeile, setKopfzeile] = useState(false)
  const [meldung, setMeldung] = useState('')

  const gefiltert = useMemo(() => {
    return etappen
      .filter((e) => e.dienstlich)
      .filter((e) => (von ? e.datum >= von : true))
      .filter((e) => (bis ? e.datum <= bis : true))
      .filter((e) => (nurNichtExportiert ? !e.exportiert : true))
      .sort((a, b) => (a.datum + a.abfahrt).localeCompare(b.datum + b.abfahrt))
  }, [etappen, von, bis, nurNichtExportiert])

  const text = useMemo(() => {
    const zeilen = gefiltert.map((e) =>
      [formatDatum(e.datum), e.abfahrt, e.ankunft, e.start, e.ziel, e.zweck, String(e.strecke)].join('\t'),
    )
    if (kopfzeile) {
      zeilen.unshift(['Datum', 'Abfahrt', 'Ankunft', 'Start', 'Ziel', 'Anlass/Zweck', 'Strecke'].join('\t'))
    }
    return zeilen.join('\n')
  }, [gefiltert, kopfzeile])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setMeldung('In die Zwischenablage kopiert.')
    } catch {
      setMeldung('Kopieren nicht möglich – bitte Text manuell markieren.')
    }
  }

  async function handleMarkExportiert() {
    const ids = new Set(gefiltert.map((e) => e.id))
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
      <p className="hinweis">Private Fahrten werden nicht mit exportiert.</p>

      <label>
        Von
        <input type="date" value={von} onChange={(e) => setVon(e.target.value)} />
      </label>
      <label>
        Bis
        <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={nurNichtExportiert}
          onChange={(e) => setNurNichtExportiert(e.target.checked)}
        />
        Nur nicht exportierte Einträge
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={kopfzeile} onChange={(e) => setKopfzeile(e.target.checked)} />
        Kopfzeile einschließen
      </label>

      <p className="hinweis">{gefiltert.length} Zeile(n)</p>

      <textarea className="export-text" readOnly value={text} rows={12} />

      <button type="button" className="primary" onClick={handleCopy}>
        In Zwischenablage kopieren
      </button>
      <button type="button" onClick={handleMarkExportiert} disabled={gefiltert.length === 0}>
        Als exportiert markieren
      </button>
      <button type="button" onClick={handleDeleteExportiert} disabled={anzahlExportiert === 0}>
        Exportierte löschen ({anzahlExportiert})
      </button>

      {meldung && <p className="meldung">{meldung}</p>}
    </div>
  )
}
