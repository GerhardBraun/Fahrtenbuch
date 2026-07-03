import { useState } from 'react'
import { newId } from '../logic'
import type { Ziel, ZielZweck } from '../types'

interface Props {
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
}

type SubTab = 'ziele' | 'zielZweck'

export default function Zielverwaltung({ ziele, zieleZweck, onZieleChange, onZieleZweckChange }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('ziele')

  return (
    <div className="form">
      <h2>Ziele</h2>
      <div className="segmented">
        <button type="button" className={subTab === 'ziele' ? 'active' : ''} onClick={() => setSubTab('ziele')}>
          Ziele
        </button>
        <button
          type="button"
          className={subTab === 'zielZweck' ? 'active' : ''}
          onClick={() => setSubTab('zielZweck')}
        >
          Ziel und Zweck
        </button>
      </div>

      {subTab === 'ziele' ? (
        <ZieleListe ziele={ziele} onChange={onZieleChange} />
      ) : (
        <ZielZweckListe zieleZweck={zieleZweck} onChange={onZieleZweckChange} />
      )}
    </div>
  )
}

function ZieleListe({ ziele, onChange }: { ziele: Ziel[]; onChange: (ziele: Ziel[]) => Promise<void> }) {
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [radKm, setRadKm] = useState('')
  const [radMin, setRadMin] = useState('')
  const [autoKm, setAutoKm] = useState('')
  const [autoMin, setAutoMin] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!ort.trim()) return

    const neu: Ziel = {
      id: newId('z-'),
      ort: ort.trim(),
      strasse: strasse.trim(),
      werte: {
        Rad: { km: Number(radKm) || 0, dauerMin: Number(radMin) || 0 },
        Auto: { km: Number(autoKm) || 0, dauerMin: Number(autoMin) || 0 },
      },
    }
    await onChange([...ziele, neu])
    setOrt('')
    setStrasse('')
    setRadKm('')
    setRadMin('')
    setAutoKm('')
    setAutoMin('')
  }

  async function handleDelete(id: string) {
    await onChange(ziele.filter((z) => z.id !== id))
  }

  async function handleUpdate(id: string, patch: Partial<Ziel>) {
    await onChange(ziele.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  }

  return (
    <>
      <table className="tabelle">
        <thead>
          <tr>
            <th>Ort</th>
            <th>Straße</th>
            <th>Rad km</th>
            <th>Rad Min</th>
            <th>Auto km</th>
            <th>Auto Min</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ziele.map((z) => (
            <tr key={z.id}>
              <td>
                <input value={z.ort} onChange={(e) => handleUpdate(z.id, { ort: e.target.value })} />
              </td>
              <td>
                <input value={z.strasse} onChange={(e) => handleUpdate(z.id, { strasse: e.target.value })} />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Rad.km}
                  onChange={(e) =>
                    handleUpdate(z.id, { werte: { ...z.werte, Rad: { ...z.werte.Rad, km: Number(e.target.value) } } })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Rad.dauerMin}
                  onChange={(e) =>
                    handleUpdate(z.id, {
                      werte: { ...z.werte, Rad: { ...z.werte.Rad, dauerMin: Number(e.target.value) } },
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Auto.km}
                  onChange={(e) =>
                    handleUpdate(z.id, {
                      werte: { ...z.werte, Auto: { ...z.werte.Auto, km: Number(e.target.value) } },
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Auto.dauerMin}
                  onChange={(e) =>
                    handleUpdate(z.id, {
                      werte: { ...z.werte, Auto: { ...z.werte.Auto, dauerMin: Number(e.target.value) } },
                    })
                  }
                />
              </td>
              <td>
                <button type="button" onClick={() => handleDelete(z.id)}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Neues Ziel</h3>
      <form onSubmit={handleAdd}>
        <label>
          Ort
          <input value={ort} onChange={(e) => setOrt(e.target.value)} />
        </label>
        <label>
          Straße
          <input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
        </label>
        <label>
          Rad: km / Minuten (einfache Strecke)
          <div className="segmented">
            <input type="number" inputMode="numeric" value={radKm} onChange={(e) => setRadKm(e.target.value)} />
            <input type="number" inputMode="numeric" value={radMin} onChange={(e) => setRadMin(e.target.value)} />
          </div>
        </label>
        <label>
          Auto: km / Minuten (einfache Strecke)
          <div className="segmented">
            <input type="number" inputMode="numeric" value={autoKm} onChange={(e) => setAutoKm(e.target.value)} />
            <input type="number" inputMode="numeric" value={autoMin} onChange={(e) => setAutoMin(e.target.value)} />
          </div>
        </label>
        <button type="submit" className="primary">
          Ziel speichern
        </button>
      </form>
    </>
  )
}

function ZielZweckListe({
  zieleZweck,
  onChange,
}: {
  zieleZweck: ZielZweck[]
  onChange: (zieleZweck: ZielZweck[]) => Promise<void>
}) {
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [zweck, setZweck] = useState('')
  const [radKm, setRadKm] = useState('')
  const [radMin, setRadMin] = useState('')
  const [autoKm, setAutoKm] = useState('')
  const [autoMin, setAutoMin] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!ort.trim() || !zweck.trim()) return

    const neu: ZielZweck = {
      id: newId('zz-'),
      ort: ort.trim(),
      strasse: strasse.trim(),
      zweck: zweck.trim(),
      werte: {
        Rad: { km: Number(radKm) || 0, dauerMin: Number(radMin) || 0 },
        Auto: { km: Number(autoKm) || 0, dauerMin: Number(autoMin) || 0 },
      },
    }
    await onChange([...zieleZweck, neu])
    setOrt('')
    setStrasse('')
    setZweck('')
    setRadKm('')
    setRadMin('')
    setAutoKm('')
    setAutoMin('')
  }

  async function handleDelete(id: string) {
    await onChange(zieleZweck.filter((z) => z.id !== id))
  }

  async function handleUpdate(id: string, patch: Partial<ZielZweck>) {
    await onChange(zieleZweck.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  }

  return (
    <>
      <table className="tabelle">
        <thead>
          <tr>
            <th>Ort</th>
            <th>Straße</th>
            <th>Zweck</th>
            <th>Rad km</th>
            <th>Rad Min</th>
            <th>Auto km</th>
            <th>Auto Min</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {zieleZweck.map((z) => (
            <tr key={z.id}>
              <td>
                <input value={z.ort} onChange={(e) => handleUpdate(z.id, { ort: e.target.value })} />
              </td>
              <td>
                <input value={z.strasse} onChange={(e) => handleUpdate(z.id, { strasse: e.target.value })} />
              </td>
              <td>
                <input value={z.zweck} onChange={(e) => handleUpdate(z.id, { zweck: e.target.value })} />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Rad.km}
                  onChange={(e) =>
                    handleUpdate(z.id, { werte: { ...z.werte, Rad: { ...z.werte.Rad, km: Number(e.target.value) } } })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Rad.dauerMin}
                  onChange={(e) =>
                    handleUpdate(z.id, {
                      werte: { ...z.werte, Rad: { ...z.werte.Rad, dauerMin: Number(e.target.value) } },
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Auto.km}
                  onChange={(e) =>
                    handleUpdate(z.id, {
                      werte: { ...z.werte, Auto: { ...z.werte.Auto, km: Number(e.target.value) } },
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={z.werte.Auto.dauerMin}
                  onChange={(e) =>
                    handleUpdate(z.id, {
                      werte: { ...z.werte, Auto: { ...z.werte.Auto, dauerMin: Number(e.target.value) } },
                    })
                  }
                />
              </td>
              <td>
                <button type="button" onClick={() => handleDelete(z.id)}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Neu: Ziel und Zweck</h3>
      <form onSubmit={handleAdd}>
        <label>
          Ort
          <input value={ort} onChange={(e) => setOrt(e.target.value)} />
        </label>
        <label>
          Straße
          <input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
        </label>
        <label>
          Zweck
          <input value={zweck} onChange={(e) => setZweck(e.target.value)} />
        </label>
        <label>
          Rad: km / Minuten (einfache Strecke)
          <div className="segmented">
            <input type="number" inputMode="numeric" value={radKm} onChange={(e) => setRadKm(e.target.value)} />
            <input type="number" inputMode="numeric" value={radMin} onChange={(e) => setRadMin(e.target.value)} />
          </div>
        </label>
        <label>
          Auto: km / Minuten (einfache Strecke)
          <div className="segmented">
            <input type="number" inputMode="numeric" value={autoKm} onChange={(e) => setAutoKm(e.target.value)} />
            <input type="number" inputMode="numeric" value={autoMin} onChange={(e) => setAutoMin(e.target.value)} />
          </div>
        </label>
        <button type="submit" className="primary">
          Speichern
        </button>
      </form>
    </>
  )
}
