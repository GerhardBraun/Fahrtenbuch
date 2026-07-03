import { useMemo, useState } from 'react'
import { mergeHistorien, mergeZieleListen, mergeZielZweckListen } from '../logic'
import type { Historie, Ziel, ZielZweck } from '../types'

interface Props {
  historie: Historie
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  onHistorieChange: (historie: Historie) => Promise<void>
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
}

export default function Daten({ historie, ziele, zieleZweck, onHistorieChange, onZieleChange, onZieleZweckChange }: Props) {
  const [importText, setImportText] = useState('')
  const [meldung, setMeldung] = useState('')

  const exportText = useMemo(
    () => JSON.stringify({ historie, ziele, zieleZweck }, null, 2),
    [historie, ziele, zieleZweck],
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportText)
      setMeldung('In die Zwischenablage kopiert.')
    } catch {
      setMeldung('Kopieren nicht möglich – bitte Text manuell markieren.')
    }
  }

  async function handleImport() {
    setMeldung('')
    let parsed: {
      historie?: Partial<Historie>
      ziele?: Ziel[]
      zieleZweck?: ZielZweck[]
    }
    try {
      parsed = JSON.parse(importText)
    } catch {
      setMeldung('Der eingefügte Text ist kein gültiges JSON.')
      return
    }

    const importHistorie: Historie = {
      orte: Array.isArray(parsed.historie?.orte) ? parsed.historie.orte : [],
      strassen: Array.isArray(parsed.historie?.strassen) ? parsed.historie.strassen : [],
      zwecke: Array.isArray(parsed.historie?.zwecke) ? parsed.historie.zwecke : [],
    }
    const importZiele: Ziel[] = Array.isArray(parsed.ziele) ? parsed.ziele : []
    const importZielZweck: ZielZweck[] = Array.isArray(parsed.zieleZweck) ? parsed.zieleZweck : []

    await onHistorieChange(mergeHistorien(historie, importHistorie))
    await onZieleChange(mergeZieleListen(ziele, importZiele))
    await onZieleZweckChange(mergeZielZweckListen(zieleZweck, importZielZweck))

    setImportText('')
    setMeldung(
      `Übernommen: bis zu ${importHistorie.orte.length} Orte, ${importHistorie.strassen.length} Straßen, ` +
        `${importHistorie.zwecke.length} Zwecke, ${importZiele.length} Ziele, ${importZielZweck.length} Ziel-und-Zweck-Einträge ` +
        `(bereits vorhandene wurden übersprungen).`,
    )
  }

  return (
    <div className="form">
      <h2>Daten übertragen</h2>
      <p className="hinweis">
        Zum Austausch der Listen (Ort/Straße/Zweck-Verlauf, Ziele, Ziel und Zweck) zwischen Geräten – z. B. vom PC
        aufs Smartphone. Fahrten selbst werden hier nicht übertragen.
      </p>

      <h3>Export</h3>
      <textarea className="export-text" readOnly value={exportText} rows={8} />
      <button type="button" className="primary" onClick={handleCopy}>
        In Zwischenablage kopieren
      </button>

      <h3>Import</h3>
      <p className="hinweis">Auf dem Zielgerät hier einfügen. Vorhandene Einträge bleiben unverändert.</p>
      <textarea
        className="export-text"
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        rows={8}
        placeholder="Hier den kopierten Text einfügen…"
      />
      <button type="button" className="primary" onClick={handleImport} disabled={!importText.trim()}>
        Übernehmen
      </button>

      {meldung && <p className="meldung">{meldung}</p>}
    </div>
  )
}
