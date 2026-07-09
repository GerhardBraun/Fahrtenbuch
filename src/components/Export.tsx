import { useMemo, useState } from 'react'
import type { Etappe, RohdatenEintrag } from '../types'

interface Props {
  etappen: Etappe[]
  rohdaten: RohdatenEintrag[]
  onChange: (etappen: Etappe[]) => Promise<void>
  onChangeRohdaten: (rohdaten: RohdatenEintrag[]) => Promise<void>
}

type Modus = 'nachweis' | 'rohdaten'

function formatDatum(datum: string): string {
  const [j, m, t] = datum.split('-')
  return `${t}.${m}.${j}`
}

function nachweisZeilen(liste: Etappe[], trenner: string): string[] {
  return liste.map((e) =>
    [formatDatum(e.datum), e.abfahrt, e.ankunft, e.start, e.ziel, e.zweck, String(e.strecke)].join(trenner),
  )
}

function rohdatenZeilen(liste: RohdatenEintrag[], trenner: string): string[] {
  return liste.map((r) =>
    [
      formatDatum(r.datum),
      r.fahrzeug,
      r.ort,
      r.strasse,
      r.zweck,
      r.abfahrt,
      r.ankunft,
      String(r.kmStandEnde),
      r.dienstlich ? 'dienstlich' : 'privat',
    ].join(trenner),
  )
}

function sortiertEtappen(liste: Etappe[]): Etappe[] {
  return [...liste].sort((a, b) => (a.datum + a.abfahrt).localeCompare(b.datum + b.abfahrt))
}

function sortiertRohdaten(liste: RohdatenEintrag[]): RohdatenEintrag[] {
  return [...liste].sort((a, b) => (a.datum + a.abfahrt + a.ankunft).localeCompare(b.datum + b.abfahrt + b.ankunft))
}

function mitKopf(zeilen: string[], kopfzeile: boolean, kopf: string[], trenner: string): string {
  const z = [...zeilen]
  if (kopfzeile) z.unshift(kopf.join(trenner))
  return z.join('\n')
}

function mitTabDarstellung(text: string, tabAlsZeichen: boolean): string {
  return tabAlsZeichen ? text.split('\t').join('^t') : text
}

const NACHWEIS_KOPF = ['Datum', 'Abfahrt', 'Ankunft', 'Start', 'Ziel', 'Anlass/Zweck', 'Strecke']
const ROHDATEN_KOPF = ['Datum', 'Fahrzeug', 'Ort', 'Straße', 'Anlass/Zweck', 'Abfahrt', 'Ankunft', 'km-Stand', 'Art']

export default function ExportView({ etappen, rohdaten, onChange, onChangeRohdaten }: Props) {
  const [modus, setModus] = useState<Modus>('nachweis')
  const [von, setVon] = useState('')
  const [bis, setBis] = useState('')
  const [nurNichtExportiert, setNurNichtExportiert] = useState(true)
  const [kopfzeile, setKopfzeile] = useState(false)
  const [tabAlsZeichen, setTabAlsZeichen] = useState(true)
  const [meldung, setMeldung] = useState('')

  const nachweisBasis = useMemo(() => {
    return etappen
      .filter((e) => e.dienstlich)
      .filter((e) => (von ? e.datum >= von : true))
      .filter((e) => (bis ? e.datum <= bis : true))
      .filter((e) => (nurNichtExportiert ? !e.exportiert : true))
      .sort((a, b) => (a.datum + a.abfahrt).localeCompare(b.datum + b.abfahrt))
  }, [etappen, von, bis, nurNichtExportiert])

  const radListe = useMemo(() => nachweisBasis.filter((e) => e.fahrzeug === 'Rad'), [nachweisBasis])
  const autoListe = useMemo(() => nachweisBasis.filter((e) => e.fahrzeug === 'Auto'), [nachweisBasis])
  const radTextBasis = useMemo(
    () => mitKopf(nachweisZeilen(radListe, '\t'), kopfzeile, NACHWEIS_KOPF, '\t'),
    [radListe, kopfzeile],
  )
  const autoTextBasis = useMemo(
    () => mitKopf(nachweisZeilen(autoListe, '\t'), kopfzeile, NACHWEIS_KOPF, '\t'),
    [autoListe, kopfzeile],
  )
  const radText = useMemo(() => mitTabDarstellung(radTextBasis, tabAlsZeichen), [radTextBasis, tabAlsZeichen])
  const autoText = useMemo(() => mitTabDarstellung(autoTextBasis, tabAlsZeichen), [autoTextBasis, tabAlsZeichen])

  const rohdatenGefiltert = useMemo(() => {
    return rohdaten
      .filter((r) => (von ? r.datum >= von : true))
      .filter((r) => (bis ? r.datum <= bis : true))
      .filter((r) => (nurNichtExportiert ? !r.exportiert : true))
      .sort((a, b) => (a.datum + a.abfahrt + a.ankunft).localeCompare(b.datum + b.abfahrt + b.ankunft))
  }, [rohdaten, von, bis, nurNichtExportiert])

  const rohdatenTextBasis = useMemo(
    () => mitKopf(rohdatenZeilen(rohdatenGefiltert, '\t'), kopfzeile, ROHDATEN_KOPF, '\t'),
    [rohdatenGefiltert, kopfzeile],
  )
  const rohdatenText = useMemo(
    () => mitTabDarstellung(rohdatenTextBasis, tabAlsZeichen),
    [rohdatenTextBasis, tabAlsZeichen],
  )

  // Standard-Export: immer alle noch nicht exportierten Daten, unabhängig von Von/Bis.
  const radStandard = useMemo(
    () => sortiertEtappen(etappen.filter((e) => e.dienstlich && !e.exportiert && e.fahrzeug === 'Rad')),
    [etappen],
  )
  const autoStandard = useMemo(
    () => sortiertEtappen(etappen.filter((e) => e.dienstlich && !e.exportiert && e.fahrzeug === 'Auto')),
    [etappen],
  )
  const rohdatenStandard = useMemo(() => sortiertRohdaten(rohdaten.filter((r) => !r.exportiert)), [rohdaten])
  const anzahlStandard = radStandard.length + autoStandard.length + rohdatenStandard.length

  function handleStandardExport() {
    const inhalt = [
      ['Rad', ...nachweisZeilen(radStandard, '\t')].join('\n'),
      ['Auto', ...nachweisZeilen(autoStandard, '\t')].join('\n'),
      ['Rohdaten', ...rohdatenZeilen(rohdatenStandard, '\t')].join('\n'),
    ].join('\n\n')
    handleDownload('Standard-Export.txt', inhalt)
  }

  async function handleStandardMarkExportiert() {
    const radAutoIds = new Set([...radStandard, ...autoStandard].map((e) => e.id))
    await onChange(etappen.map((e) => (radAutoIds.has(e.id) ? { ...e, exportiert: true } : e)))
    const rohdatenIds = new Set(rohdatenStandard.map((r) => r.id))
    await onChangeRohdaten(rohdaten.map((r) => (rohdatenIds.has(r.id) ? { ...r, exportiert: true } : r)))
    setMeldung('Alle Standard-Export-Daten als exportiert markiert.')
  }

  async function handleCopy(t: string) {
    try {
      await navigator.clipboard.writeText(t)
      setMeldung('In die Zwischenablage kopiert.')
    } catch {
      setMeldung('Kopieren nicht möglich – bitte Text manuell markieren.')
    }
  }

  function handleDownload(dateiname: string, inhalt: string) {
    const blob = new Blob([inhalt], { type: 'text/tab-separated-values;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = dateiname
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMeldung('Datei heruntergeladen. Bitte als Anhang verschicken, nicht als Text einfügen.')
  }

  async function handleMarkExportiert(liste: Etappe[]) {
    const ids = new Set(liste.map((e) => e.id))
    await onChange(etappen.map((e) => (ids.has(e.id) ? { ...e, exportiert: true } : e)))
    setMeldung('Als exportiert markiert.')
  }

  async function handleDeleteExportiert() {
    if (!confirm('Alle bereits exportierten Einträge (Fahrtennachweis und Rohdaten) endgültig löschen?')) return
    await onChange(etappen.filter((e) => !e.exportiert))
    await onChangeRohdaten(rohdaten.filter((r) => !r.exportiert))
    setMeldung('Exportierte Einträge gelöscht.')
  }

  async function handleMarkRohdatenExportiert() {
    const ids = new Set(rohdatenGefiltert.map((r) => r.id))
    await onChangeRohdaten(rohdaten.map((r) => (ids.has(r.id) ? { ...r, exportiert: true } : r)))
    setMeldung('Als exportiert markiert.')
  }

  async function handleDeleteRohdatenExportiert() {
    if (!confirm('Alle bereits exportierten Rohdaten-Einträge endgültig löschen?')) return
    await onChangeRohdaten(rohdaten.filter((r) => !r.exportiert))
    setMeldung('Exportierte Einträge gelöscht.')
  }

  const anzahlExportiert = etappen.filter((e) => e.exportiert).length
  const anzahlRohdatenExportiert = rohdaten.filter((r) => r.exportiert).length

  return (
    <div className="form">
      <h2>Export</h2>

      <p className="hinweis">
        Für die regelmäßige Übertragung vom Smartphone: eine Datei mit allen noch nicht exportierten Daten, in drei
        Blöcken (je mit "Rad"/"Auto"/"Rohdaten" markiert, dann die Zeilen ohne Spalten-Kopfzeile, echte Tabulatoren).
      </p>
      <div className="segmented">
        <button type="button" className="primary" onClick={handleStandardExport} disabled={anzahlStandard === 0}>
          Standard-Export-Download
        </button>
        <button type="button" onClick={handleStandardMarkExportiert} disabled={anzahlStandard === 0}>
          Als exportiert markieren
        </button>
      </div>

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
        <p className="hinweis">Genau die eingegebenen Rohdaten (dienstlich und privat), z.B. zur Sicherung in Excel.</p>
      )}

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
      <label className="checkbox">
        <input type="checkbox" checked={tabAlsZeichen} onChange={(e) => setTabAlsZeichen(e.target.checked)} />
        Tabulatoren als ^t einfügen
      </label>

      <p className="hinweis">
        Bei Umweg über WhatsApp/E-Mail: „Kopieren" nutzt „^t" statt Tabulator (übersteht den Versand als Text – am
        Laptop vor dem Einfügen ^t durch Tabulator ersetzen). „Herunterladen" erzeugt immer eine Datei mit echten
        Tabulatoren zum Verschicken als Anhang.
      </p>

      {modus === 'rohdaten' ? (
        <>
          <p className="hinweis">{rohdatenGefiltert.length} Zeile(n)</p>
          <textarea className="export-text" readOnly value={rohdatenText} rows={12} />
          <div className="segmented">
            <button type="button" className="primary" onClick={() => handleCopy(rohdatenText)}>
              Kopieren
            </button>
            <button type="button" onClick={() => handleDownload('Rohdaten.txt', rohdatenTextBasis)}>
              Herunterladen
            </button>
            <button
              type="button"
              onClick={handleMarkRohdatenExportiert}
              disabled={rohdatenGefiltert.length === 0}
            >
              Als exportiert markieren
            </button>
          </div>
          <button type="button" onClick={handleDeleteRohdatenExportiert} disabled={anzahlRohdatenExportiert === 0}>
            Exportierte löschen ({anzahlRohdatenExportiert})
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
            <button type="button" onClick={() => handleDownload('Fahrtennachweis-Rad.txt', radTextBasis)}>
              Herunterladen
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
            <button type="button" onClick={() => handleDownload('Fahrtennachweis-Auto.txt', autoTextBasis)}>
              Herunterladen
            </button>
            <button type="button" onClick={() => handleMarkExportiert(autoListe)} disabled={autoListe.length === 0}>
              Als exportiert markieren
            </button>
          </div>

          <button
            type="button"
            onClick={handleDeleteExportiert}
            disabled={anzahlExportiert === 0 && anzahlRohdatenExportiert === 0}
          >
            Exportierte löschen ({anzahlExportiert + anzahlRohdatenExportiert})
          </button>
        </>
      )}

      {meldung && <p className="meldung">{meldung}</p>}
    </div>
  )
}
