import { addMinutes, subMinutes } from './timeUtils'
import type { Etappe, FahrzeugId, FahrzeugWerte, Historie, Ziel, ZielZweck } from './types'
import { ZUHAUSE } from './types'

/**
 * Geschätzte Fahrzeit wie bisher in der Excel-Mappe:
 * Auto ~36 km/h (5 Min je angefangene 3 km), Rad ~20 km/h (3 Min/km, auf 5 Min gerundet).
 */
export function estimateDauerMin(fahrzeug: FahrzeugId, km: number): number {
  if (km <= 0) return 0
  if (fahrzeug === 'Auto') {
    return Math.floor((km + 1) / 3) * 5
  }
  return Math.round((km * 3) / 5) * 5
}

let idCounter = 0
export function newId(prefix = ''): string {
  idCounter += 1
  return `${prefix}${Date.now()}-${idCounter}`
}

export function zielText(ort: string, strasse: string): string {
  return strasse.trim() ? `${ort.trim()}, ${strasse.trim()}` : ort.trim()
}

function gleich(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
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
}

export function computeEinzelfahrt(input: EinzelfahrtInput): Etappe[] {
  const { fahrzeug, datum, ziel, zweck, abfahrt, ankunft, kmStandEnde, lastKmStand, werte } = input
  const roundTripKm = kmStandEnde - lastKmStand

  let kmHin: number
  let kmRueck: number
  let dauerHin: number
  let dauerRueck: number

  if (werte) {
    kmHin = werte.km
    kmRueck = werte.km
    dauerHin = werte.dauerMin
    dauerRueck = werte.dauerMin
  } else {
    kmHin = Math.round(roundTripKm / 2)
    kmRueck = roundTripKm - kmHin
    dauerHin = estimateDauerMin(fahrzeug, kmHin)
    dauerRueck = estimateDauerMin(fahrzeug, kmRueck)
  }

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
  abfahrt: string
  ankunft: string
  kmStandEnde: number
  lastKmStand: number
  werte?: FahrzeugWerte
}

export function computeEtappe(input: EtappeInput): Etappe {
  const { fahrzeug, datum, start, ziel, zweck, abfahrt, ankunft, kmStandEnde, lastKmStand, werte } = input

  let strecke: number
  let ankunftEndgueltig: string

  if (werte) {
    strecke = werte.km
    ankunftEndgueltig = addMinutes(abfahrt, werte.dauerMin)
  } else {
    strecke = kmStandEnde - lastKmStand
    ankunftEndgueltig = ankunft
  }

  return {
    id: newId(),
    datum,
    fahrzeug,
    start,
    ziel,
    zweck,
    abfahrt,
    ankunft: ankunftEndgueltig,
    kmStand: lastKmStand + strecke,
    strecke,
    exportiert: false,
  }
}
