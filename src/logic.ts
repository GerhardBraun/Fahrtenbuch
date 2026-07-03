import { addMinutes, subMinutes } from './timeUtils'
import type { Etappe, FahrzeugId, Route } from './types'
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
function newId(): string {
  idCounter += 1
  return `${Date.now()}-${idCounter}`
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
  route?: Route
}

export function computeEinzelfahrt(input: EinzelfahrtInput): Etappe[] {
  const { fahrzeug, datum, ziel, zweck, abfahrt, ankunft, kmStandEnde, lastKmStand, route } = input
  const roundTripKm = kmStandEnde - lastKmStand

  let kmHin: number
  let kmRueck: number
  let dauerHin: number
  let dauerRueck: number

  if (route) {
    kmHin = route.refKm
    kmRueck = route.refKm
    dauerHin = route.refDauerMin
    dauerRueck = route.refDauerMin
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
    routeId: route?.id,
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
    routeId: route?.id,
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
  route?: Route
}

export function computeEtappe(input: EtappeInput): Etappe {
  const { fahrzeug, datum, start, ziel, zweck, abfahrt, ankunft, kmStandEnde, lastKmStand, route } = input

  let strecke: number
  let ankunftEndgueltig: string

  if (route) {
    strecke = route.refKm
    ankunftEndgueltig = addMinutes(abfahrt, route.refDauerMin)
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
    routeId: route?.id,
    exportiert: false,
  }
}

export function findRoute(routen: Route[], ort: string, strasse: string): Route | undefined {
  const ortN = ort.trim().toLowerCase()
  const strasseN = strasse.trim().toLowerCase()
  return routen.find((r) => r.ort.trim().toLowerCase() === ortN && r.strasse.trim().toLowerCase() === strasseN)
}

export function zielText(ort: string, strasse: string): string {
  return strasse.trim() ? `${ort.trim()}, ${strasse.trim()}` : ort.trim()
}
