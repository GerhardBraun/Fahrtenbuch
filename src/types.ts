export type FahrzeugId = 'Rad' | 'Auto'

export const FAHRZEUGE: { id: FahrzeugId; label: string }[] = [
  { id: 'Rad', label: 'Fahrrad' },
  { id: 'Auto', label: 'Auto' },
]

export const ZUHAUSE = 'Gensungen, Hesslarer Str. 1'

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
  exportiert: boolean
}

export interface KmStaende {
  Rad: number
  Auto: number
}
