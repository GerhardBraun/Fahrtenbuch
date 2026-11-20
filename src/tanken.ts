import type { Tankbeleg } from './types'

export interface TankMittel {
  von: Tankbeleg
  bis: Tankbeleg
  km: number
  tage: number
  liter: number
  preis: number
  kmProTag: number | null
  literPro100: number | null
  preisPro100: number | null
}

export interface TankGesamt {
  /** Summen über alle Belege (auch nicht vollgetankte am Ende) */
  liter: number
  preis: number
  /** km-Stand des jüngsten vollen Belegs = Bezugsstrecke der Durchschnittswerte */
  km: number
  literPro100: number | null
  preisPro100: number | null
}

export interface TankStatistik {
  letztes: TankMittel | null
  sechsMonate: TankMittel | null
  gesamt: TankGesamt | null
  /** Anzahl jüngster Belege ohne Volltanken, die noch nicht in die Mittelwerte eingehen */
  offen: number
}

export function istVoll(b: Tankbeleg): boolean {
  return b.voll !== false
}

/** Chronologisch sortiert (Datum, bei gleichem Datum km-Stand). */
export function sortiereBelege(belege: Tankbeleg[]): Tankbeleg[] {
  return [...belege].sort((a, b) => a.datum.localeCompare(b.datum) || a.kmStand - b.kmStand)
}

function tageZwischen(von: string, bis: string): number {
  const a = Date.UTC(+von.slice(0, 4), +von.slice(5, 7) - 1, +von.slice(8, 10))
  const b = Date.UTC(+bis.slice(0, 4), +bis.slice(5, 7) - 1, +bis.slice(8, 10))
  return Math.round((b - a) / 86_400_000)
}

/** Datum (YYYY-MM-DD) n Monate vor dem gegebenen Datum; Monatsende wird gekappt (31.08. → 28./29.02.). */
export function monateZurueck(datum: string, monate: number): string {
  const jahr = +datum.slice(0, 4)
  const monat = +datum.slice(5, 7) - 1 - monate
  const tag = +datum.slice(8, 10)
  const ziel = new Date(Date.UTC(jahr, monat, 1))
  const letzterTag = new Date(Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth() + 1, 0)).getUTCDate()
  ziel.setUTCDate(Math.min(tag, letzterTag))
  return ziel.toISOString().slice(0, 10)
}

function pro100(wert: number, km: number): number | null {
  return km > 0 ? (wert / km) * 100 : null
}

function summe(belege: Tankbeleg[], feld: 'liter' | 'preis'): number {
  return belege.reduce((s, b) => s + b[feld], 0)
}

/**
 * Mittelwerte zwischen zwei vollen Belegen (Indizes in der sortierten Liste, von < bis).
 * Getankt wurde alles nach „von“ bis einschließlich „bis“ – auch Teilbetankungen dazwischen.
 */
function mittel(sortiert: Tankbeleg[], vonIdx: number, bisIdx: number): TankMittel {
  const von = sortiert[vonIdx]
  const bis = sortiert[bisIdx]
  const getankt = sortiert.slice(vonIdx + 1, bisIdx + 1)
  const liter = summe(getankt, 'liter')
  const preis = summe(getankt, 'preis')
  const km = bis.kmStand - von.kmStand
  const tage = tageZwischen(von.datum, bis.datum)
  return {
    von,
    bis,
    km,
    tage,
    liter,
    preis,
    kmProTag: tage > 0 ? km / tage : null,
    literPro100: pro100(liter, km),
    preisPro100: pro100(preis, km),
  }
}

/** Indizes der vollen Belege in der sortierten Liste. */
function volleIndizes(sortiert: Tankbeleg[]): number[] {
  return sortiert.flatMap((b, i) => (istVoll(b) ? [i] : []))
}

/**
 * Verbrauch je vollem Beleg (l/100 km seit dem vorherigen vollen Beleg), für die Listenanzeige.
 * Beim ältesten vollen Beleg (Summe der bisherigen Buchführung) bezogen auf seinen km-Stand.
 */
export function verbrauchJeBeleg(belege: Tankbeleg[]): Map<string, number | null> {
  const sortiert = sortiereBelege(belege)
  const out = new Map<string, number | null>()
  let vorherIdx = -1
  sortiert.forEach((b, i) => {
    if (!istVoll(b)) {
      out.set(b.id, null)
      return
    }
    const getankt = sortiert.slice(vorherIdx + 1, i + 1)
    const km = b.kmStand - (vorherIdx >= 0 ? sortiert[vorherIdx].kmStand : 0)
    out.set(b.id, pro100(summe(getankt, 'liter'), km))
    vorherIdx = i
  })
  return out
}

/**
 * - letztes: Zeitraum zwischen den beiden jüngsten vollen Belegen
 * - sechsMonate: vom jüngsten vollen Beleg, der mindestens 6 Monate vor dem jüngsten vollen Beleg liegt,
 *   bis zum jüngsten vollen Beleg
 * - gesamt: Summen aller Belege; Durchschnitt = alle Mengen bis zum jüngsten vollen Beleg / dessen km-Stand
 * Nicht vollgetankte Belege nach dem jüngsten vollen gehen nur in die Summen ein.
 */
export function tankStatistik(belege: Tankbeleg[]): TankStatistik {
  return statistikBis(sortiereBelege(belege), belege.length - 1)
}

/** Statistik, wie sie galt, als der Beleg mit Index endIdx (sortierte Liste) der jüngste war. */
function statistikBis(sortiert: Tankbeleg[], endIdx: number): TankStatistik & { refIdx: number } {
  if (endIdx < 0) return { letztes: null, sechsMonate: null, gesamt: null, offen: 0, refIdx: -1 }
  const bisher = sortiert.slice(0, endIdx + 1)

  const voll = volleIndizes(bisher)
  const letzterVoll = voll.length > 0 ? voll[voll.length - 1] : -1
  const offen = endIdx - letzterVoll

  const letztes = voll.length >= 2 ? mittel(bisher, voll[voll.length - 2], letzterVoll) : null

  const stichtag = letzterVoll >= 0 ? monateZurueck(bisher[letzterVoll].datum, 6) : ''
  const refIdx = [...voll].reverse().find((i) => bisher[i].datum <= stichtag) ?? -1
  const sechsMonate = refIdx >= 0 && refIdx < letzterVoll ? mittel(bisher, refIdx, letzterVoll) : null

  const bisVoll = bisher.slice(0, letzterVoll + 1)
  const km = letzterVoll >= 0 ? bisher[letzterVoll].kmStand : 0
  const gesamt: TankGesamt = {
    liter: summe(bisher, 'liter'),
    preis: summe(bisher, 'preis'),
    km,
    literPro100: pro100(summe(bisVoll, 'liter'), km),
    preisPro100: pro100(summe(bisVoll, 'preis'), km),
  }

  return { letztes, sechsMonate, gesamt, offen, refIdx }
}

/** Eine Exportzeile je Beleg (aufsteigend) mit den Werten, die beim jeweiligen Beleg galten. */
export interface TankExportZeile {
  beleg: Tankbeleg
  letztes: TankMittel | null
  sechsMonate: TankMittel | null
  gesamt: TankGesamt
}

export function tankExportZeilen(belege: Tankbeleg[]): TankExportZeile[] {
  const sortiert = sortiereBelege(belege)
  return sortiert.map((beleg, i) => {
    const st = statistikBis(sortiert, i)
    return { beleg, letztes: st.letztes, sechsMonate: st.sechsMonate, gesamt: st.gesamt! }
  })
}

/**
 * Exportierte Belege löschen, ohne die Berechnungen zu zerstören: Der Beleg, der zuletzt Bezugspunkt
 * der 6-Monats-Berechnung war, wird zum Summenbeleg (Datum und km-Stand bleiben, Menge und Preis =
 * Summe aller Belege bis einschließlich ihm); alle älteren Belege entfallen.
 * Damit nur Exportiertes verloren geht, wird ggf. ein älterer voller Beleg genommen, bis zu dem
 * (einschließlich) alles exportiert ist.
 */
export function zusammenfassen(belege: Tankbeleg[]): { belege: Tankbeleg[]; entfernt: number; summenbeleg?: Tankbeleg } {
  const sortiert = sortiereBelege(belege)
  const { refIdx } = statistikBis(sortiert, sortiert.length - 1)
  let c = -1
  for (let i = 0; i <= refIdx; i++) {
    if (!sortiert[i].exportiert) break
    if (istVoll(sortiert[i])) c = i
  }
  if (c <= 0) return { belege, entfernt: 0 }

  const alt = sortiert.slice(0, c + 1)
  const summenbeleg: Tankbeleg = {
    ...sortiert[c],
    liter: runde(summe(alt, 'liter'), 2),
    preis: runde(summe(alt, 'preis'), 2),
  }
  return { belege: [summenbeleg, ...sortiert.slice(c + 1)], entfernt: c, summenbeleg }
}

function runde(wert: number, stellen: number): number {
  const f = 10 ** stellen
  return Math.round(wert * f) / f
}

export function mergeTankbelege(bestehend: Tankbeleg[], importiert: Tankbeleg[]): Tankbeleg[] {
  const out = [...bestehend]
  for (const b of importiert) {
    if (!out.some((e) => e.id === b.id || (e.datum === b.datum && e.kmStand === b.kmStand))) {
      out.push(b)
    }
  }
  return out
}

/** Dezimalzahl mit Komma oder Punkt einlesen. */
export function parseZahl(text: string): number {
  const t = text.trim()
  if (!t) return NaN
  // „1.234,56“ → 1234.56; „45,3“ → 45.3; „45.3“ → 45.3
  return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t)
}

const fmtCache = new Map<number, Intl.NumberFormat>()
export function zahl(wert: number | null | undefined, stellen: number): string {
  if (wert == null || !Number.isFinite(wert)) return '–'
  let f = fmtCache.get(stellen)
  if (!f) {
    f = new Intl.NumberFormat('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen })
    fmtCache.set(stellen, f)
  }
  return f.format(wert)
}

export function datumKurz(datum: string): string {
  return `${datum.slice(8, 10)}.${datum.slice(5, 7)}.${datum.slice(2, 4)}`
}
