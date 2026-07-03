import { get, set } from 'idb-keyval'
import type { Etappe, KmStaende, Route } from './types'

const ETAPPEN_KEY = 'etappen'
const ROUTEN_KEY = 'routen'
const KMSTAENDE_KEY = 'kmstaende'

export async function loadEtappen(): Promise<Etappe[]> {
  return (await get<Etappe[]>(ETAPPEN_KEY)) ?? []
}

export async function saveEtappen(etappen: Etappe[]): Promise<void> {
  await set(ETAPPEN_KEY, etappen)
}

export async function loadRouten(): Promise<Route[]> {
  return (await get<Route[]>(ROUTEN_KEY)) ?? []
}

export async function saveRouten(routen: Route[]): Promise<void> {
  await set(ROUTEN_KEY, routen)
}

export async function loadKmStaende(): Promise<KmStaende> {
  return (await get<KmStaende>(KMSTAENDE_KEY)) ?? { Rad: 0, Auto: 0 }
}

export async function saveKmStaende(kmStaende: KmStaende): Promise<void> {
  await set(KMSTAENDE_KEY, kmStaende)
}
