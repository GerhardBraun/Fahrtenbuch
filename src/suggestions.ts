import type { Historie, Ziel, ZielZweck } from './types'

export interface Vorschlag {
  label: string
  ort?: string
  strasse?: string
  zweck?: string
}

function enthaelt(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase())
}

function sammeln(kandidaten: Vorschlag[], max = 8): Vorschlag[] {
  const gesehen = new Set<string>()
  const ergebnis: Vorschlag[] = []
  for (const k of kandidaten) {
    if (gesehen.has(k.label)) continue
    gesehen.add(k.label)
    ergebnis.push(k)
    if (ergebnis.length >= max) break
  }
  return ergebnis
}

export function ortVorschlaege(
  historie: Historie,
  ziele: Ziel[],
  zieleZweck: ZielZweck[],
  query: string,
): Vorschlag[] {
  if (!query.trim()) return []
  const kandidaten: Vorschlag[] = [
    ...historie.orte.filter((o) => enthaelt(o, query)).map((o) => ({ label: o, ort: o })),
    ...ziele
      .filter((z) => enthaelt(z.ort, query))
      .map((z) => ({ label: `${z.ort}, ${z.strasse}`, ort: z.ort, strasse: z.strasse })),
    ...zieleZweck
      .filter((z) => enthaelt(z.ort, query))
      .map((z) => ({
        label: `${z.ort}, ${z.strasse}: ${z.zweck}`,
        ort: z.ort,
        strasse: z.strasse,
        zweck: z.zweck,
      })),
  ]
  return sammeln(kandidaten)
}

export function strasseVorschlaege(
  historie: Historie,
  ziele: Ziel[],
  zieleZweck: ZielZweck[],
  query: string,
): Vorschlag[] {
  if (!query.trim()) return []
  const kandidaten: Vorschlag[] = [
    ...historie.strassen.filter((s) => enthaelt(s, query)).map((s) => ({ label: s, strasse: s })),
    ...ziele
      .filter((z) => enthaelt(z.strasse, query))
      .map((z) => ({ label: `${z.ort}, ${z.strasse}`, ort: z.ort, strasse: z.strasse })),
    ...zieleZweck
      .filter((z) => enthaelt(z.strasse, query))
      .map((z) => ({
        label: `${z.ort}, ${z.strasse}: ${z.zweck}`,
        ort: z.ort,
        strasse: z.strasse,
        zweck: z.zweck,
      })),
  ]
  return sammeln(kandidaten)
}

export function zweckVorschlaege(historie: Historie, zieleZweck: ZielZweck[], query: string): Vorschlag[] {
  if (!query.trim()) return []
  const kandidaten: Vorschlag[] = [
    ...historie.zwecke.filter((z) => enthaelt(z, query)).map((z) => ({ label: z, zweck: z })),
    ...zieleZweck
      .filter((z) => enthaelt(z.zweck, query))
      .map((z) => ({
        label: `${z.ort}, ${z.strasse}: ${z.zweck}`,
        ort: z.ort,
        strasse: z.strasse,
        zweck: z.zweck,
      })),
  ]
  return sammeln(kandidaten)
}
