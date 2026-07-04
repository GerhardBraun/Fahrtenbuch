import { get, set } from 'idb-keyval'
import type { Etappe, Historie, KmStaende, RohdatenEintrag, Ziel, ZielZweck } from './types'

const ETAPPEN_KEY = 'etappen'
const ROHDATEN_KEY = 'rohdaten'
const ZIELE_KEY = 'ziele'
const ZIELE_ZWECK_KEY = 'zieleZweck'
const HISTORIE_KEY = 'historie'
const KMSTAENDE_KEY = 'kmstaende'

const LEERE_HISTORIE: Historie = { orte: [], strassen: [], zwecke: [] }

export async function loadEtappen(): Promise<Etappe[]> {
  return (await get<Etappe[]>(ETAPPEN_KEY)) ?? []
}

export async function saveEtappen(etappen: Etappe[]): Promise<void> {
  await set(ETAPPEN_KEY, etappen)
}

export async function loadRohdaten(): Promise<RohdatenEintrag[]> {
  return (await get<RohdatenEintrag[]>(ROHDATEN_KEY)) ?? []
}

export async function saveRohdaten(rohdaten: RohdatenEintrag[]): Promise<void> {
  await set(ROHDATEN_KEY, rohdaten)
}

export async function loadZiele(): Promise<Ziel[]> {
  return (await get<Ziel[]>(ZIELE_KEY)) ?? []
}

export async function saveZiele(ziele: Ziel[]): Promise<void> {
  await set(ZIELE_KEY, ziele)
}

export async function loadZieleZweck(): Promise<ZielZweck[]> {
  return (await get<ZielZweck[]>(ZIELE_ZWECK_KEY)) ?? []
}

export async function saveZieleZweck(zieleZweck: ZielZweck[]): Promise<void> {
  await set(ZIELE_ZWECK_KEY, zieleZweck)
}

export async function loadHistorie(): Promise<Historie> {
  return (await get<Historie>(HISTORIE_KEY)) ?? LEERE_HISTORIE
}

export async function saveHistorie(historie: Historie): Promise<void> {
  await set(HISTORIE_KEY, historie)
}

export async function loadKmStaende(): Promise<KmStaende> {
  return (await get<KmStaende>(KMSTAENDE_KEY)) ?? { Rad: 0, Auto: 0 }
}

export async function saveKmStaende(kmStaende: KmStaende): Promise<void> {
  await set(KMSTAENDE_KEY, kmStaende)
}
