import { addMinutes, subMinutes } from './timeUtils'
import type { Etappe, FahrzeugId, FahrzeugWerte, Historie, RohdatenEintrag, Ziel, ZielWerte, ZielZweck } from './types'
import { ZUHAUSE } from './types'

/**
 * Auto: variable Durchschnittsgeschwindigkeit zwischen 28 km/h (Stadtverkehr, kurze Strecken)
 * und 80 km/h (Landstraße/Autobahn, lange Strecken), Übergang als Sigmoid um 32 km herum.
 * Herleitung/Formel vom Nutzer vorgegeben (Excel: MAX(5;VRUNDEN(60*km/geschwindigkeit(km);5))).
 */
function autoGeschwindigkeitKmH(km: number): number {
  return 28 + 52 / (1 + Math.exp(-(km - 32) / 14.5))
}

/**
 * Geschätzte Fahrzeit: Auto per Sigmoid-Geschwindigkeitsmodell, Rad konstant 20 km/h (3 Min/km).
 * Beide auf 5-Minuten-Intervalle gerundet, mindestens 5 Minuten (auch bei 1 km).
 */
export function estimateDauerMin(fahrzeug: FahrzeugId, km: number): number {
  if (km <= 0) return 0
  if (fahrzeug === 'Auto') {
    const minuten = (60 * km) / autoGeschwindigkeitKmH(km)
    return Math.max(5, Math.round(minuten / 5) * 5)
  }
  return Math.max(5, Math.round((km * 3) / 5) * 5)
}

let idCounter = 0
export function newId(prefix = ''): string {
  idCounter += 1
  return `${prefix}${Date.now()}-${idCounter}`
}

export function zielText(ort: string, strasse: string): string {
  return strasse.trim() ? `${ort.trim()}, ${strasse.trim()}` : ort.trim()
}

/**
 * Vereinfachte km-Eingabe: 1-2 Ziffern = letzte zwei Stellen des km-Stands
 * (mit Hunderterübergang), 3 Ziffern = letzte drei Stellen (mit Tausenderübergang),
 * ab 4 Ziffern = vollständiger km-Stand.
 */
export function resolveKmEingabe(eingabe: string, lastKmStand: number): number {
  const digits = eingabe.trim()
  if (!/^\d+$/.test(digits)) return NaN
  const n = Number(digits)

  if (digits.length === 3) {
    const basis = Math.floor(lastKmStand / 1000) * 1000
    let kandidat = basis + n
    if (kandidat <= lastKmStand) kandidat += 1000
    return kandidat
  }
  if (digits.length <= 2) {
    const basis = Math.floor(lastKmStand / 100) * 100
    let kandidat = basis + n
    if (kandidat <= lastKmStand) kandidat += 100
    return kandidat
  }
  return n
}

export function gleich(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Übernimmt km/Fahrzeit-Werte bei allen Ziel- und Ziel-und-Zweck-Einträgen mit demselben
 * Ort+Straße (unabhängig vom Zweck), z.B. wenn bei "Fritzlar, Dom: Hl. Messe" Werte
 * eingetragen werden, gelten sie auch für "Fritzlar, Dom" und "Fritzlar, Dom: Gebetskreis".
 */
export function synchronisiereWerte(
  ort: string,
  strasse: string,
  werte: ZielWerte,
  ziele: Ziel[],
  zieleZweck: ZielZweck[],
): { ziele: Ziel[]; zieleZweck: ZielZweck[] } {
  const passt = (o: string, s: string) => gleich(o, ort) && gleich(s, strasse)
  return {
    ziele: ziele.map((z) => (passt(z.ort, z.strasse) ? { ...z, werte } : z)),
    zieleZweck: zieleZweck.map((z) => (passt(z.ort, z.strasse) ? { ...z, werte } : z)),
  }
}

export function findZiel(ziele: Ziel[], ort: string, strasse: string): Ziel | undefined {
  return ziele.find((z) => gleich(z.ort, ort) && gleich(z.strasse, strasse))
}

export function findZielZweck(zieleZweck: ZielZweck[], ort: string, strasse: string, zweck: string): ZielZweck | undefined {
  return zieleZweck.find((z) => gleich(z.ort, ort) && gleich(z.strasse, strasse) && gleich(z.zweck, zweck))
}

/** Ziel-und-Zweck-Treffer geht vor, da spezifischer; sonst Ziel-Treffer. */
export function findWerte(
  ziele: Ziel[],
  zieleZweck: ZielZweck[],
  fahrzeug: FahrzeugId,
  ort: string,
  strasse: string,
  zweck: string,
): FahrzeugWerte | undefined {
  const zz = findZielZweck(zieleZweck, ort, strasse, zweck)
  if (zz) return zz.werte[fahrzeug]
  const z = findZiel(ziele, ort, strasse)
  if (z) return z.werte[fahrzeug]
  return undefined
}

export function mitHistorieEintrag(historie: Historie, feld: keyof Historie, wert: string): Historie {
  const w = wert.trim()
  if (!w) return historie
  if (historie[feld].some((e) => gleich(e, w))) return historie
  return { ...historie, [feld]: [...historie[feld], w] }
}

function mergeListe(bestehend: string[], neu: string[]): string[] {
  const out = [...bestehend]
  for (const w of neu) {
    if (typeof w === 'string' && w.trim() && !out.some((e) => gleich(e, w))) out.push(w)
  }
  return out
}

/** Bestehende Einträge bleiben unverändert; nur neue (nach Ort/Straße[/Zweck]) werden ergänzt. */
export function mergeHistorien(bestehend: Historie, importiert: Historie): Historie {
  return {
    orte: mergeListe(bestehend.orte, importiert.orte ?? []),
    strassen: mergeListe(bestehend.strassen, importiert.strassen ?? []),
    zwecke: mergeListe(bestehend.zwecke, importiert.zwecke ?? []),
  }
}

export function mergeZieleListen(bestehend: Ziel[], importiert: Ziel[]): Ziel[] {
  const out = [...bestehend]
  for (const z of importiert) {
    if (!out.some((e) => gleich(e.ort, z.ort) && gleich(e.strasse, z.strasse))) {
      out.push({ ...z, id: newId('z-') })
    }
  }
  return out
}

export function mergeZielZweckListen(bestehend: ZielZweck[], importiert: ZielZweck[]): ZielZweck[] {
  const out = [...bestehend]
  for (const z of importiert) {
    if (!out.some((e) => gleich(e.ort, z.ort) && gleich(e.strasse, z.strasse) && gleich(e.zweck, z.zweck))) {
      out.push({ ...z, id: newId('zz-') })
    }
  }
  return out
}

interface EinzelfahrtInput {
  fahrzeug: FahrzeugId
  datum: string
  ziel: string
  zweck: string
  abfahrt: string
  ankunft: string
  kmStandEnde: number
  lastKmStand: number
  werte?: FahrzeugWerte
  dienstlich: boolean
}

export function computeEinzelfahrt(input: EinzelfahrtInput): Etappe[] {
  const { fahrzeug, datum, ziel, zweck, abfahrt, ankunft, kmStandEnde, lastKmStand, werte, dienstlich } = input
  const roundTripKm = kmStandEnde - lastKmStand
  // Hin- und Rückfahrt sollen im Export immer dieselbe Strecke ausweisen; bei ungerader
  // Gesamtstrecke wird die halbierte Strecke aufgerundet (35 km -> 18 km je Richtung).
  const kmEinwegIst = Math.ceil(roundTripKm / 2)
  const kmHinIst = kmEinwegIst
  const kmRueckIst = kmEinwegIst

  // km/Fahrzeit aus Ziel/Ziel-und-Zweck übernehmen, aber nur wenn dort tatsächlich ein Wert
  // (>0) hinterlegt ist – sonst die Ist-Werte aus der Eingabe verwenden statt mit 0 zu überschreiben.
  const kmHin = werte && werte.km > 0 ? werte.km : kmHinIst
  const kmRueck = werte && werte.km > 0 ? werte.km : kmRueckIst
  const dauerHin = werte && werte.dauerMin > 0 ? werte.dauerMin : estimateDauerMin(fahrzeug, kmHin)
  const dauerRueck = werte && werte.dauerMin > 0 ? werte.dauerMin : estimateDauerMin(fahrzeug, kmRueck)

  const ankunftHin = addMinutes(abfahrt, dauerHin)
  const abfahrtRueck = subMinutes(ankunft, dauerRueck)

  const hin: Etappe = {
    id: newId(),
    datum,
    fahrzeug,
    start: ZUHAUSE,
    ziel,
    zweck,
    abfahrt,
    ankunft: ankunftHin,
    kmStand: lastKmStand + kmHin,
    strecke: kmHin,
    dienstlich,
    exportiert: false,
  }

  const rueck: Etappe = {
    id: newId(),
    datum,
    fahrzeug,
    start: ziel,
    ziel: ZUHAUSE,
    zweck: 'Rückfahrt',
    abfahrt: abfahrtRueck,
    ankunft,
    kmStand: kmStandEnde,
    strecke: kmRueck,
    dienstlich,
    exportiert: false,
  }

  return [hin, rueck]
}

interface EtappeInput {
  fahrzeug: FahrzeugId
  datum: string
  start: string
  ziel: string
  zweck: string
  /** Erste Etappe (Start zu Hause): Abfahrt eingetragen, Ankunft wird errechnet. */
  abfahrt?: string
  /** Weitere Etappen/Rückfahrt: Ankunft eingetragen, Abfahrt wird errechnet. */
  ankunft?: string
  kmStandEnde: number
  lastKmStand: number
  werte?: FahrzeugWerte
  dienstlich: boolean
}

export function computeEtappe(input: EtappeInput): Etappe {
  const { fahrzeug, datum, start, ziel, zweck, abfahrt, ankunft, kmStandEnde, lastKmStand, werte, dienstlich } = input

  const strecke = werte && werte.km > 0 ? werte.km : kmStandEnde - lastKmStand
  const dauerMin = werte && werte.dauerMin > 0 ? werte.dauerMin : estimateDauerMin(fahrzeug, strecke)

  const abfahrtEndgueltig = abfahrt ?? subMinutes(ankunft!, dauerMin)
  const ankunftEndgueltig = ankunft ?? addMinutes(abfahrt!, dauerMin)

  return {
    id: newId(),
    datum,
    fahrzeug,
    start,
    ziel,
    zweck,
    abfahrt: abfahrtEndgueltig,
    ankunft: ankunftEndgueltig,
    kmStand: lastKmStand + strecke,
    strecke,
    dienstlich,
    exportiert: false,
  }
}

interface RohdatenInput {
  fahrzeug: FahrzeugId
  datum: string
  ziel: string
  zweck: string
  abfahrt?: string
  ankunft?: string
  kmStandEnde: number
  dienstlich: boolean
}

export function newRohdatenEintrag(input: RohdatenInput): RohdatenEintrag {
  return {
    id: newId('rd-'),
    datum: input.datum,
    fahrzeug: input.fahrzeug,
    ziel: input.ziel,
    zweck: input.zweck,
    abfahrt: input.abfahrt ?? '',
    ankunft: input.ankunft ?? '',
    kmStandEnde: input.kmStandEnde,
    dienstlich: input.dienstlich,
  }
}
