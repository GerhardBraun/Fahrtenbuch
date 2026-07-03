export type FahrzeugId = 'Rad' | 'Auto'

export const FAHRZEUGE: { id: FahrzeugId; label: string }[] = [
  { id: 'Rad', label: 'Fahrrad' },
  { id: 'Auto', label: 'Auto' },
]

export const ZUHAUSE = 'Gensungen, Hesslarer Str. 1'

export interface Route {
  id: string
  name: string
  ort: string
  strasse: string
  refKm: number
  refDauerMin: number
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
  routeId?: string
  exportiert: boolean
}

export interface KmStaende {
  Rad: number
  Auto: number
}
