export type FahrzeugId = 'Rad' | 'Auto'

export const FAHRZEUGE: { id: FahrzeugId; label: string }[] = [
  { id: 'Rad', label: 'Fahrrad' },
  { id: 'Auto', label: 'Auto' },
]

export const ZUHAUSE_ORT = 'Gensungen'
export const ZUHAUSE_STRASSE = 'Hesslarer Str. 1'
export const ZUHAUSE = `${ZUHAUSE_ORT}, ${ZUHAUSE_STRASSE}`

export interface FahrzeugWerte {
  km: number
  dauerMin: number
}

export interface ZielWerte {
  Rad: FahrzeugWerte
  Auto: FahrzeugWerte
}

export function leereZielWerte(): ZielWerte {
  return { Rad: { km: 0, dauerMin: 0 }, Auto: { km: 0, dauerMin: 0 } }
}

export interface Ziel {
  id: string
  ort: string
  strasse: string
  werte: ZielWerte
}

export interface ZielZweck {
  id: string
  ort: string
  strasse: string
  zweck: string
  werte: ZielWerte
}

export interface Historie {
  orte: string[]
  strassen: string[]
  zwecke: string[]
}

export interface Etappe {
  id: string
  datum: string // YYYY-MM-DD
  fahrzeug: FahrzeugId
  start: string
  ziel: string
  zweck: string
  abfahrt: string // HH:MM
  ankunft: string // HH:MM
  kmStand: number
  strecke: number
  dienstlich: boolean
  exportiert: boolean
}

/**
 * Exakt das, was beim Speichern einer Fahrt eingegeben wurde – unabhängig von der
 * Berechnung der Etappen (Hin-/Rückfahrt-Aufteilung, Referenzwerte aus Zielen usw.).
 * Ein Eintrag pro Speichervorgang (bei Einzelfahrt also einer für Hin+Rück zusammen).
 */
export interface RohdatenEintrag {
  id: string
  datum: string
  fahrzeug: FahrzeugId
  ort: string
  strasse: string
  zweck: string
  abfahrt: string // '' wenn nicht eingegeben (wurde errechnet)
  ankunft: string // '' wenn nicht eingegeben (wurde errechnet)
  kmStandEnde: number
  dienstlich: boolean
  exportiert: boolean
}

export interface KmStaende {
  Rad: number
  Auto: number
}
