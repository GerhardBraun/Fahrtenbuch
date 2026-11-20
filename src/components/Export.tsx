import { useMemo, useState } from 'react'
import { tankExportZeilen, zusammenfassen } from '../tanken'
import type { TankExportZeile } from '../tanken'
import type { Etappe, RohdatenEintrag, Tankbeleg } from '../types'

interface Props {
  etappen: Etappe[]
  rohdaten: RohdatenEintrag[]
  onChange: (etappen: Etappe[]) => Promise<void>
  onChangeRohdaten: (rohdaten: RohdatenEintrag[]) => Promise<void>
  tankbelege: Tankbeleg[]
  onChangeTankbelege: (belege: Tankbeleg[]) => Promise<void>
}

type Modus = 'nachweis' | 'rohdaten' | 'tanken'

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

/** Zahl für Excel: Dezimalkomma, keine Tausenderpunkte; leer, wenn nicht berechenbar. */
function excelZahl(wert: number | null | undefined, stellen: number): string {
  if (wert == null || !Number.isFinite(wert)) return ''
  return wert.toFixed(stellen).replace('.', ',')
}

function tankZeilen(liste: TankExportZeile[], trenner: string): string[] {
  return liste.map(({ beleg: b, letztes, sechsMonate, gesamt }) => {
    const voll = b.voll !== false
    const mittelSpalten = (m: typeof letztes) =>
      voll && m ? [excelZahl(m.kmProTag, 1), excelZahl(m.literPro100, 2), excelZahl(m.preisPro100, 2)] : ['', '', '']
    return [
      formatDatum(b.datum),
      String(b.kmStand),
      voll ? '' : 'nicht voll',
      excelZahl(b.liter, 2),
      excelZahl(b.preis, 2),
      excelZahl(b.liter > 0 ? b.preis / b.liter : null, 3),
      ...mittelSpalten(letztes),
      ...mittelSpalten(sechsMonate),
      excelZahl(gesamt.liter, 2),
      excelZahl(gesamt.preis, 2),
      voll ? excelZahl(gesamt.literPro100, 2) : '',
      voll ? excelZahl(gesamt.preisPro100, 2) : '',
    ].join(trenner)
  })
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
const TANK_KOPF = [
  'Datum',
  'km-Stand',
  'voll',
  'Menge',
  'Preis',
  '€/l',
  'km/Tag (letztes)',
  'l/100 km (letztes)',
  '€/100 km (letztes)',
  'km/Tag (6 Monate)',
  'l/100 km (6 Monate)',
  '€/100 km (6 Monate)',
  'Menge gesamt',
  'Kosten gesamt',
  'l/100 km gesamt',
  '€/100 km gesamt',
]
const ROHDATEN_KOPF = ['Datum', 'Fahrzeug', 'Ort', 'Straße', 'Anlass/Zweck', 'Abfahrt', 'Ankunft', 'km-Stand', 'Art']

export default function ExportView({
  etappen,
  rohdaten,
  onChange,
  onChangeRohdaten,
  tankbelege,
  onChangeTankbelege,
}: Props) {
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

  // Tanken: Werte je Beleg immer aus allen Belegen berechnet, erst danach gefiltert.
  const tankGefiltert = useMemo(
    () =>
      tankExportZeilen(tankbelege)
        .filter(({ beleg: b }) => (von ? b.datum >= von : true))
        .filter(({ beleg: b }) => (bis ? b.datum <= bis : true))
        .filter(({ beleg: b }) => (nurNichtExportiert ? !b.exportiert : true)),
    [tankbelege, von, bis, nurNichtExportiert],
  )
  const tankTextBasis = useMemo(
    () => mitKopf(tankZeilen(tankGefiltert, '\t'), kopfzeile, TANK_KOPF, '\t'),
    [tankGefiltert, kopfzeile],
  )
  const tankText = useMemo(() => mitTabDarstellung(tankTextBasis, tabAlsZeichen), [tankTextBasis, tabAlsZeichen])
  const tankZusammenfassung = useMemo(() => zusammenfassen(tankbelege), [tankbelege])

  async function handleMarkTankExportiert() {
    const ids = new Set(tankGefiltert.map((z) => z.beleg.id))
    await onChangeTankbelege(tankbelege.map((b) => (ids.has(b.id) ? { ...b, exportiert: true } : b)))
    setMeldung('Als exportiert markiert.')
  }

  async function handleTankZusammenfassen() {
    const { entfernt, summenbeleg, belege } = tankZusammenfassung
    if (!summenbeleg) return
    const [j, m, t] = summenbeleg.datum.split('-')
    if (
      !confirm(
        `${entfernt} exportierte Tankbeleg(e) löschen? Der Beleg vom ${t}.${m}.${j} wird zum Summenbeleg ` +
          `(Menge und Preis = Summe aller Belege bis dahin).`,
      )
    )
      return
    await onChangeTankbelege(belege)
    setMeldung(`${entfernt} Tankbeleg(e) gelöscht, Summenbeleg zum ${t}.${m}.${j} angelegt.`)
  }

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
  const tankStandard = useMemo(() => tankExportZeilen(tankbelege).filter((z) => !z.beleg.exportiert), [tankbelege])
  const anzahlStandard = radStandard.length + autoStandard.length + rohdatenStandard.length + tankStandard.length

  function handleStandardExport() {
    const inhalt = [
      ['Rad', ...nachweisZeilen(radStandard, '\t')].join('\n'),
      ['Auto', ...nachweisZeilen(autoStandard, '\t')].join('\n'),
      ['Rohdaten', ...rohdatenZeilen(rohdatenStandard, '\t')].join('\n'),
      ['Tanken', ...tankZeilen(tankStandard, '\t')].join('\n'),
    ].join('\n\n')
    handleDownload('Standard-Export.txt', inhalt)
  }

  async function handleStandardMarkExportiert() {
    const radAutoIds = new Set([...radStandard, ...autoStandard].map((e) => e.id))
    await onChange(etappen.map((e) => (radAutoIds.has(e.id) ? { ...e, exportiert: true } : e)))
    const rohdatenIds = new Set(rohdatenStandard.map((r) => r.id))
    await onChangeRohdaten(rohdaten.map((r) => (rohdatenIds.has(r.id) ? { ...r, exportiert: true } : r)))
    const tankIds = new Set(tankStandard.map((z) => z.beleg.id))
    await onChangeTankbelege(tankbelege.map((b) => (tankIds.has(b.id) ? { ...b, exportiert: true } : b)))
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
    const { entfernt, summenbeleg, belege } = tankZusammenfassung
    const tankHinweis = summenbeleg
      ? ` Von den Tankbelegen werden ${entfernt} gelöscht; der Beleg vom ${formatDatum(summenbeleg.datum)} wird zum Summenbeleg.`
      : ''
    if (
      !confirm(
        `Alle bereits exportierten Einträge (Fahrtennachweis, Rohdaten, Tankbelege) endgültig löschen?${tankHinweis}`,
      )
    )
      return
    await onChange(etappen.filter((e) => !e.exportiert))
    await onChangeRohdaten(rohdaten.filter((r) => !r.exportiert))
    if (summenbeleg) await onChangeTankbelege(belege)
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
        Für die regelmäßige Übertragung vom Smartphone: eine Datei mit allen noch nicht exportierten Daten, in vier
        Blöcken (je mit "Rad"/"Auto"/"Rohdaten"/"Tanken" markiert, dann die Zeilen ohne Spalten-Kopfzeile, echte Tabulatoren).
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
        <button type="button" className={modus === 'tanken' ? 'active' : ''} onClick={() => setModus('tanken')}>
          Tanken
        </button>
      </div>

      {modus === 'nachweis' ? (
        <p className="hinweis">Private Fahrten werden nicht mit exportiert, getrennt nach Fahrzeug.</p>
      ) : modus === 'tanken' ? (
        <p className="hinweis">
          Eine Zeile je Tankbeleg, aufsteigend, mit den Mittelwerten, die beim jeweiligen Beleg galten.
        </p>
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

      {modus === 'tanken' ? (
        <>
          <p className="hinweis">{tankGefiltert.length} Zeile(n)</p>
          <textarea className="export-text" readOnly value={tankText} rows={12} />
          <div className="segmented">
            <button type="button" className="primary" onClick={() => handleCopy(tankText)}>
              Kopieren
            </button>
            <button type="button" onClick={() => handleDownload('Tankbelege.txt', tankTextBasis)}>
              Herunterladen
            </button>
            <button type="button" onClick={handleMarkTankExportiert} disabled={tankGefiltert.length === 0}>
              Als exportiert markieren
            </button>
          </div>
          <button type="button" onClick={handleTankZusammenfassen} disabled={tankZusammenfassung.entfernt === 0}>
            Exportierte löschen ({tankZusammenfassung.entfernt})
          </button>
          <p className="hinweis">
            Gelöscht werden nur exportierte Belege vor dem Bezugsbeleg der 6-Monats-Berechnung; dieser wird zum
            Summenbeleg. Jüngere Belege bleiben erhalten.
          </p>
        </>
      ) : modus === 'rohdaten' ? (
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
            disabled={anzahlExportiert + anzahlRohdatenExportiert + tankZusammenfassung.entfernt === 0}
          >
            Exportierte löschen ({anzahlExportiert + anzahlRohdatenExportiert + tankZusammenfassung.entfernt})
          </button>
        </>
      )}

      {meldung && <p className="meldung">{meldung}</p>}
    </div>
  )
}
